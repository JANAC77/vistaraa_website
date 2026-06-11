import React, { createContext, useContext, useState, useEffect } from "react";
import { getPlaceholderImage } from "../utils/placeholder";

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

  useEffect(() => {
    localStorage.setItem("vistaraa_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, selectedVariant = null, quantity = 1) => {
    setCart((prevCart) => {
      // Find if item exists in cart with same variant
      const variantKey = selectedVariant ? selectedVariant.sku || selectedVariant.size : "default";
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.variantKey === variantKey
      );

      const priceToUse = selectedVariant ? Number(selectedVariant.price) : Number(product.salePrice || product.price || 0);

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

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

      return [...prevCart, newItem];
    });
  };

  const removeFromCart = (id, variantKey) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.id === id && item.variantKey === variantKey))
    );
  };

  const updateQuantity = (id, variantKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, variantKey);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.variantKey === variantKey ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
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
