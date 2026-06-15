import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, collection, getDocs, getDoc, setDoc, deleteDoc } from "firebase/firestore";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem("vistaraa_wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("vistaraa_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Auth sync logic for Wishlist
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // 1. Fetch current favorites from Firestore
          const favRef = collection(db, "users", user.uid, "favorites");
          const snap = await getDocs(favRef);
          const firestoreFavs = snap.docs.map(doc => doc.data());

          // 2. Fetch full product details for each firestore favorite item
          const fetchedProducts = [];
          for (const fav of firestoreFavs) {
            if (fav.productid) {
              const docRef = doc(db, "products", fav.productid);
              const prodDoc = await getDoc(docRef);
              if (prodDoc.exists()) {
                fetchedProducts.push({ id: prodDoc.id, ...prodDoc.data() });
              }
            }
          }

          // 3. Merge local storage wishlist into Firestore
          const localWishlist = [...wishlist];
          const mergedWishlist = [...fetchedProducts];

          for (const item of localWishlist) {
            const exists = mergedWishlist.some(w => w.id === item.id);
            if (!exists) {
              const favData = {
                favoriteId: item.id,
                productid: item.id,
                customerId: user.uid
              };
              await setDoc(doc(db, "users", user.uid, "favorites", item.id), favData);
              mergedWishlist.push(item);
            }
          }

          // 4. Update state
          setWishlist(mergedWishlist);
        } catch (err) {
          console.error("Error syncing wishlist with Firestore:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const addToWishlist = (product) => {
    setWishlist((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;

      if (auth.currentUser) {
        const favData = {
          favoriteId: product.id,
          productid: product.id,
          customerId: auth.currentUser.uid
        };
        setDoc(doc(db, "users", auth.currentUser.uid, "favorites", product.id), favData)
          .catch(err => console.error("Firestore add to favorites error:", err));
      }

      return [...prev, product];
    });
  };

  const removeFromWishlist = (id) => {
    setWishlist((prev) => {
      if (auth.currentUser) {
        deleteDoc(doc(db, "users", auth.currentUser.uid, "favorites", id))
          .catch(err => console.error("Firestore delete from favorites error:", id, err));
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        if (auth.currentUser) {
          deleteDoc(doc(db, "users", auth.currentUser.uid, "favorites", product.id))
            .catch(err => console.error("Firestore delete from favorites error:", product.id, err));
        }
        return prev.filter((item) => item.id !== product.id);
      } else {
        if (auth.currentUser) {
          const favData = {
            favoriteId: product.id,
            productid: product.id,
            customerId: auth.currentUser.uid
          };
          setDoc(doc(db, "users", auth.currentUser.uid, "favorites", product.id), favData)
            .catch(err => console.error("Firestore add to favorites error:", err));
        }
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (id) => {
    return wishlist.some((item) => item.id === id);
  };

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        wishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
