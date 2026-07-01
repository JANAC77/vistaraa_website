import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Eye, Flame, Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { getPlaceholderImage } from "../utils/placeholder";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist, removeFromWishlist } = useWishlist();

  const getProductImage = (p) => {
    if (!p?.images?.length) return getPlaceholderImage(400, 400, "Vistaraa Product");
    const primary = p.images.find(img => img.isPrimary);
    return primary?.url || p.images[0]?.url;
  };

  const hasDiscount = Number(product.salePrice) < Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.salePrice)) / Number(product.price)) * 100)
    : 0;

  const isOutOfStock = Number(product.stock) <= 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    // Add default variant or none
    const defaultVariant = product.variants?.length > 0 ? product.variants[0] : null;
    addToCart(product, defaultVariant, 1);

    // Remove from wishlist if present
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    }

    // Quick notification animation or alert
    const target = e.currentTarget;
    target.classList.add("added");
    setTimeout(() => {
      target.classList.remove("added");
    }, 1000);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="glass-card product-card-container" style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
      background: "var(--bg-card)"
    }}>
      {/* Product Image Section */}
      <Link to={`/product/${product.id}`} style={{ display: "block", position: "relative", paddingBottom: "100%", overflow: "hidden", background: "#f1f5f9" }}>
        <img
          src={getProductImage(product)}
          alt={product.name}
          className="product-image"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
          loading="lazy"
        />

        {/* Wishlist Heart Toggle */}
        <button
          onClick={handleWishlistToggle}
          className="wishlist-btn"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 10,
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(4px)",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart
            size={18}
            fill={isInWishlist(product.id) ? "var(--error)" : "none"}
            color={isInWishlist(product.id) ? "var(--error)" : "var(--text-main)"}
            style={{ transition: "transform 0.2s ease" }}
            className="wishlist-heart-icon"
          />
        </button>

        {/* Overlay Hover Actions */}
        <div className="card-hover-overlay" style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(2px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          opacity: 0,
          transition: "opacity 0.3s ease",
          zIndex: 2
        }}>
          <span className="btn btn-secondary" style={{
            padding: "10px",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <Eye size={18} />
          </span>
        </div>

        {/* Badges */}
        <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 3 }}>
          {isOutOfStock ? (
            <span className="badge badge-out">Out Of Stock</span>
          ) : hasDiscount ? (
            <span className="badge badge-sale">{discountPercent}% OFF</span>
          ) : product.createdAt && (Date.now() - Number(product.createdAt) < 7 * 24 * 60 * 60 * 1000) ? (
            <span className="badge badge-new">New</span>
          ) : null}
        </div>
      </Link>

      {/* Product Description Info */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <span style={{
          fontSize: "11px",
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--text-muted)",
          marginBottom: "6px",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px"
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }}></span>
          {product.brand && product.brand.trim() ? product.brand : (product.categoryName || "General")}
        </span>

        <Link to={`/product/${product.id}`} style={{ display: "block", marginBottom: "8px" }}>
          <h3 className="product-title" style={{ fontSize: "16px", fontWeight: "700", lineHeight: "1.4", height: "44px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {product.name}
          </h3>
        </Link>

        {/* Pricing & Add to Cart button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {hasDiscount ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "18px", fontWeight: "900", color: "var(--text-main)" }}>₹{Number(product.salePrice).toLocaleString()}</span>
                <span style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "line-through" }}>₹{Number(product.price).toLocaleString()}</span>
              </div>
            ) : (
              <span style={{ fontSize: "18px", fontWeight: "900", color: "var(--text-main)" }}>₹{Number(product.price || 0).toLocaleString()}</span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="quick-add-btn"
            style={{
              background: isOutOfStock ? "var(--border-color)" : "var(--primary)",
              color: isOutOfStock ? "var(--text-muted)" : "white",
              border: "none",
              borderRadius: "12px",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isOutOfStock ? "not-allowed" : "pointer",
              boxShadow: isOutOfStock ? "none" : "0 4px 6px var(--primary-glow)",
              transition: "all 0.2s ease",
            }}
            title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>

      <style>{`
        .product-card-container:hover .product-image {
          transform: scale(1.06);
        }
        .product-card-container:hover .card-hover-overlay {
          opacity: 1 !important;
        }
        .product-title {
          transition: color 0.2s ease;
        }
        .product-card-container:hover .product-title {
          color: var(--primary);
        }
        .quick-add-btn:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 6px 12px var(--primary-glow);
          background: var(--primary-hover);
        }
        .quick-add-btn.added {
          background: var(--success) !important;
          transform: scale(1.1);
        }
        .wishlist-btn:hover {
          transform: scale(1.1);
          background: white !important;
        }
        .wishlist-btn:active {
          transform: scale(0.9);
        }
      `}</style>
    </div>
  );
}
