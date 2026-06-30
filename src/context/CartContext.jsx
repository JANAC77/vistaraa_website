import React, { createContext, useContext, useState, useEffect } from "react";
import { getPlaceholderImage } from "../utils/placeholder";
import { auth, db } from "../firebase";
import { doc, collection, getDocs, getDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem("vistaraa_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Track if sync is complete to prevent wiping remote cart on initial load
  const [syncReady, setSyncReady] = useState(false);

  useEffect(() => {
    localStorage.setItem("vistaraa_cart", JSON.stringify(cart));
  }, [cart]);

  // Auth sync logic
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // 1. Fetch current cart from Firestore
          const cartRef = collection(db, "users", user.uid, "cart");
          const snap = await getDocs(cartRef);
          const rawFirestoreCart = snap.docs.map(doc => doc.data());

          // Resolve product details for any items fetched from Firestore (e.g. added by the mobile app)
          const firestoreCart = [];
          for (const item of rawFirestoreCart) {
            let resolvedItem = { ...item };
            if (!resolvedItem.name || resolvedItem.salePrice === undefined || resolvedItem.salePrice === null) {
              try {
                const docRef = doc(db, "products", resolvedItem.productid);
                const prodDoc = await getDoc(docRef);
                if (prodDoc.exists()) {
                  const productData = prodDoc.data();
                  const getProductImage = (p) => {
                    if (!p?.images?.length) return getPlaceholderImage(400, 400, "Product");
                    const primary = p.images.find(img => img.isPrimary);
                    return primary?.url || p.images[0]?.url;
                  };

                  const selectedSize = resolvedItem.sizeVariant?.size;
                  let selectedVariant = null;
                  if (selectedSize && productData.sizeVariants) {
                    selectedVariant = productData.sizeVariants.find(sv => sv.size === selectedSize);
                  }

                  const priceToUse = selectedVariant ? Number(selectedVariant.price) : Number(productData.salePrice || productData.price || 0);

                  resolvedItem = {
                    ...resolvedItem,
                    id: resolvedItem.productid,
                    name: productData.name || "Product",
                    price: Number(productData.price || 0),
                    salePrice: Number(priceToUse) || 0,
                    image: getProductImage(productData),
                    sku: selectedVariant ? selectedVariant.sku : (productData.sku || resolvedItem.productid),
                    variantKey: selectedSize || "default",
                    variantSize: selectedSize || null,
                    sellerId: productData.sellerId || "default"
                  };
                } else {
                  // Set default fallbacks if product doesn't exist
                  resolvedItem = {
                    ...resolvedItem,
                    id: resolvedItem.productid,
                    name: resolvedItem.name || "Product",
                    price: Number(resolvedItem.price || 0),
                    salePrice: Number(resolvedItem.salePrice || 0),
                    image: resolvedItem.image || getPlaceholderImage(400, 400, "Product"),
                    sku: resolvedItem.sku || resolvedItem.productid,
                    variantKey: resolvedItem.variantKey || "default",
                    variantSize: resolvedItem.variantSize || null,
                    sellerId: resolvedItem.sellerId || "default"
                  };
                }
              } catch (prodErr) {
                console.error(`Error fetching product details for cart item ${resolvedItem.productid}:`, prodErr);
              }
            }
            firestoreCart.push(resolvedItem);
          }

          // 2. Merge local storage cart into Firestore
          const localCart = [...cart];
          const mergedCartList = [...firestoreCart];

          for (const item of localCart) {
            const cartId = item.variantKey ? `${item.id}_${item.variantKey}` : item.id;
            const exists = firestoreCart.some(fi => fi.cartId === cartId);
            if (!exists) {
              const mapped = {
                cartId,
                customerId: user.uid,
                productid: item.id,
                quantity: Number(item.quantity) || 1,
                sizeVariant: item.variantSize ? {
                  size: item.variantSize,
                  color: null,
                  stock: 0,
                  skuSuffix: null
                } : null,
                id: item.id,
                name: item.name,
                price: Number(item.price) || 0,
                salePrice: Number(item.salePrice) || 0,
                image: item.image || null,
                sku: item.sku || item.id,
                variantKey: item.variantKey || "default",
                variantSize: item.variantSize || null,
                sellerId: item.sellerId || "default"
              };
              await setDoc(doc(db, "users", user.uid, "cart", cartId), mapped);
              mergedCartList.push(mapped);
            }
          }

          // 3. Deduplicate mergedCartList (group by productid + variantSize)
          const deduplicatedCartMap = {};
          const duplicateDocsToDelete = [];

          for (const item of mergedCartList) {
            const key = item.variantKey ? `${item.id}_${item.variantKey}` : item.id;
            if (deduplicatedCartMap[key]) {
              deduplicatedCartMap[key].quantity += (Number(item.quantity) || 1);
              duplicateDocsToDelete.push({ docId: item.cartId || item.id, parentKey: key });
            } else {
              deduplicatedCartMap[key] = { ...item };
            }
          }

          const deduplicatedCart = Object.values(deduplicatedCartMap);

          // Perform background deletion of duplicate docs in Firestore
          for (const dup of duplicateDocsToDelete) {
            const mainDoc = deduplicatedCartMap[dup.parentKey];
            if (dup.docId !== mainDoc.cartId) {
              const dupDocRef = doc(db, "users", user.uid, "cart", dup.docId);
              deleteDoc(dupDocRef).then(() => {
                console.log(`Self-healing: deleted duplicate cart document ${dup.docId} for user ${user.uid}`);
              }).catch(err => {
                console.error(`Self-healing: failed to delete duplicate cart document ${dup.docId}:`, err);
              });
            }
          }

          // Also, update the main document's quantity in Firestore since we merged them
          for (const item of deduplicatedCart) {
            const originalItem = rawFirestoreCart.find(fi => fi.cartId === item.cartId);
            if (originalItem && Number(originalItem.quantity) !== Number(item.quantity)) {
              const docRef = doc(db, "users", user.uid, "cart", item.cartId);
              updateDoc(docRef, { quantity: Number(item.quantity) }).catch(err => {
                console.error(`Self-healing: failed to update merged cart item quantity:`, err);
              });
            }
          }

          // 4. Update local state with the merged & deduplicated cart
          setCart(deduplicatedCart);
        } catch (err) {
          console.error("Error syncing cart with Firestore:", err);
        }
      } else {
        setCart([]);
      }
      setSyncReady(true);
    });

    return () => unsubscribe();
  }, []);

  const addToCart = async (product, selectedVariant = null, quantity = 1) => {
    const variantKey = selectedVariant ? selectedVariant.sku || selectedVariant.size : "default";
    const cartId = `${product.id}_${variantKey}`;
    const priceToUse = selectedVariant ? Number(selectedVariant.price) : Number(product.salePrice || product.price || 0);

    const getProductImage = (p) => {
      if (!p?.images?.length) return getPlaceholderImage(400, 400, "Product");
      const primary = p.images.find(img => img.isPrimary);
      return primary?.url || p.images[0]?.url;
    };

    const newItem = {
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      salePrice: priceToUse,
      image: getProductImage(product),
      sku: selectedVariant ? selectedVariant.sku : (product.sku || product.id),
      variantKey,
      variantSize: selectedVariant ? selectedVariant.size : null,
      sellerId: product.sellerId || "default",
      quantity,
    };

    const existingIndex = cart.findIndex(
      (item) => item.id === product.id && item.variantKey === variantKey
    );

    if (existingIndex > -1) {
      const newQty = cart[existingIndex].quantity + quantity;

      if (auth.currentUser) {
        try {
          await updateDoc(doc(db, "users", auth.currentUser.uid, "cart", cartId), {
            quantity: newQty
          });
        } catch (err) {
          console.error("Firestore update cart quantity error:", err);
        }
      }

      setCart(prevCart => {
        const updated = [...prevCart];
        updated[existingIndex].quantity = newQty;
        return updated;
      });
      return;
    }

    if (auth.currentUser) {
      const mapped = {
        cartId,
        customerId: auth.currentUser.uid,
        productid: product.id,
        quantity,
        sizeVariant: newItem.variantSize ? {
          size: newItem.variantSize,
          color: null,
          stock: 0,
          skuSuffix: null
        } : null,
        ...newItem
      };
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid, "cart", cartId), mapped);
      } catch (err) {
        console.error("Firestore add to cart error:", err);
      }
    }

    setCart(prevCart => [...prevCart, newItem]);
  };

  const removeFromCart = async (id, variantKey) => {
    const cartId = `${id}_${variantKey}`;
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "cart", cartId));
      } catch (err) {
        console.error("Firestore delete from cart error:", err);
        return; // Exit if failed, keeping state intact
      }
    }
    setCart((prevCart) => prevCart.filter((item) => !(item.id === id && item.variantKey === variantKey)));
  };

  const updateQuantity = async (id, variantKey, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(id, variantKey);
      return;
    }
    const cartId = `${id}_${variantKey}`;
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, "users", auth.currentUser.uid, "cart", cartId), {
          quantity: Number(quantity)
        });
      } catch (err) {
        console.error("Firestore update cart quantity error:", err);
        return;
      }
    }
    setCart((prevCart) => prevCart.map((item) =>
      item.id === id && item.variantKey === variantKey ? { ...item, quantity } : item
    ));
  };

  const clearCart = async () => {
    if (auth.currentUser) {
      for (const item of cart) {
        const cartId = item.variantKey ? `${item.id}_${item.variantKey}` : item.id;
        try {
          await deleteDoc(doc(db, "users", auth.currentUser.uid, "cart", cartId));
        } catch (err) {
          console.error("Firestore clear cart item error:", err);
        }
      }
    }
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + item.salePrice * item.quantity, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
