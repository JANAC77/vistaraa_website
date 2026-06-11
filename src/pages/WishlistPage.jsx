import React from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowLeft, ShoppingBag } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";

export default function WishlistPage() {
  const { wishlist, wishlistCount } = useWishlist();

  return (
    <div style={{ paddingTop: "120px", paddingBottom: "80px", minHeight: "80vh" }}>
      <div className="container">
        
        {/* Back Link & Header */}
        <div style={{ marginBottom: "32px" }}>
          <Link to="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "16px" }}>
            <ArrowLeft size={16} /> Continue Shopping
          </Link>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <h1 style={{ fontSize: "36px", fontWeight: "800" }}>My Wishlist</h1>
            <span style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "white",
              background: "var(--accent)",
              padding: "4px 12px",
              borderRadius: "20px",
              boxShadow: "0 2px 5px rgba(244, 63, 94, 0.3)"
            }}>
              {wishlistCount} {wishlistCount === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        {wishlistCount > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "24px" }} className="shop-products-grid">
            {wishlist.map((product, index) => (
              <div key={product.id} className={`fade-in-up delay-${(index % 8) + 1}`}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="glass-card" style={{
            textAlign: "center",
            padding: "80px 40px",
            background: "var(--bg-card)",
            borderRadius: "24px",
            border: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            maxWidth: "600px",
            margin: "0 auto"
          }}>
            <div className="empty-heart-container" style={{
              position: "relative",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "floatHeart 3s ease-in-out infinite"
            }}>
              <Heart size={48} color="var(--error)" fill="rgba(239, 68, 68, 0.1)" style={{ animation: "pulseHeart 1.5s ease-in-out infinite" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>Your wishlist is empty</h3>
              <p style={{ color: "var(--text-muted)", maxWidth: "340px", margin: "0 auto", fontSize: "14px", lineHeight: "1.5" }}>
                Tap the heart icon on any product page or product card while browsing to save your favorite products here!
              </p>
            </div>
            <Link to="/shop" className="btn btn-primary" style={{ padding: "14px 32px" }}>
              Explore Products
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes floatHeart {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes pulseHeart {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
      `}</style>
    </div>
  );
}
