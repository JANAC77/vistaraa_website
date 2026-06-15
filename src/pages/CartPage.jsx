import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Trash2, ArrowRight, ShoppingCart, Plus, Minus } from "lucide-react";
import { auth } from "../firebase";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    if (auth.currentUser) {
      navigate("/checkout");
    } else {
      navigate("/auth?redirect=checkout");
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ paddingTop: "140px", paddingBottom: "100px", textAlign: "center", minHeight: "70vh" }}>
        <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          <div style={{ background: "var(--border-color)", padding: "24px", borderRadius: "50%", color: "var(--text-muted)" }}>
            <ShoppingCart size={48} />
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "800" }}>Your Cart is Empty</h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "400px" }}>
            Add some premium items to your shopping cart to see them listed here. We offer high-quality clothing, electronics, and accessories.
          </p>
          <Link to="/shop" className="btn btn-primary" style={{ marginTop: "12px" }}>
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <div className="container">
        <h1 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "32px" }}>Shopping Cart</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "40px", alignItems: "start" }} className="cart-layout-grid">
          {/* Left: Items List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {cart.map((item, index) => (
              <div
                key={`${item.id}-${item.variantKey}-${index}`}
                className="glass-card"
                style={{
                  display: "flex",
                  padding: "20px",
                  gap: "20px",
                  alignItems: "center",
                  background: "var(--bg-card)",
                  animationDelay: `${index * 0.05}s`
                }}
              >
                {/* Image */}
                <div style={{ width: "90px", height: "90px", borderRadius: "14px", overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
                  <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>

                {/* Details */}
                <div style={{ flexGrow: 1 }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>{item.name}</h4>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "13px", color: "var(--text-muted)" }}>
                    <span>SKU: {item.sku}</span>
                    {item.variantSize && (
                      <span style={{ fontWeight: "700", color: "var(--primary)" }}>SIZE: {item.variantSize}</span>
                    )}
                  </div>
                  <div style={{ marginTop: "8px", fontWeight: "700" }}>₹{(item.salePrice || 0).toLocaleString()}</div>
                </div>

                {/* Quantity Control */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "2px",
                  background: "var(--bg-app)"
                }}>
                  <button
                    onClick={() => updateQuantity(item.id, item.variantKey, item.quantity - 1)}
                    style={{ width: "32px", height: "32px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ width: "24px", textAlign: "center", fontSize: "14px", fontWeight: "700" }}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.variantKey, item.quantity + 1)}
                    style={{ width: "32px", height: "32px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", width: "100px" }}>
                  <span style={{ fontWeight: "800", fontSize: "16px" }}>₹{((item.salePrice || 0) * (item.quantity || 1)).toLocaleString()}</span>
                  <button
                    onClick={() => removeFromCart(item.id, item.variantKey)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px"
                    }}
                    className="delete-item-btn"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Summary Box */}
          <aside className="glass-card" style={{ padding: "28px", background: "var(--bg-card)", position: "sticky", top: "120px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              Order Summary
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                <span style={{ fontWeight: "700" }}>₹{cartTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Shipping</span>
                <span style={{ color: "var(--success)", fontWeight: "600" }}>Calculated at Checkout</span>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "8px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "800" }}>
                <span>Total Cost</span>
                <span style={{ color: "var(--primary)" }}>₹{cartTotal.toLocaleString()}</span>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  fontSize: "16px",
                  marginTop: "16px",
                }}
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>
            </div>
          </aside>

        </div>
      </div>

      <style>{`
        .delete-item-btn:hover {
          color: var(--error) !important;
        }
        @media (max-width: 768px) {
          .cart-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
