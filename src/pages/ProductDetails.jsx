import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { ShoppingCart, Heart, Truck, Check, RefreshCcw, ArrowLeft, Star } from "lucide-react";
import { getPlaceholderImage } from "../utils/placeholder";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("desc");

  // Success state for add button
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });
          
          // Set primary image or first image as default
          if (data.images?.length > 0) {
            const primary = data.images.find(img => img.isPrimary);
            setSelectedImage(primary?.url || data.images[0]?.url);
          } else {
            setSelectedImage(getPlaceholderImage(600, 600, "No Image Available"));
          }

          // Set first variant as default if exists
          if (data.variants?.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
        } else {
          console.error("No such product!");
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div style={{ paddingTop: "140px", paddingBottom: "100px", minHeight: "80vh" }} className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }} className="details-grid-loading">
          <div className="shimmer" style={{ height: "450px", borderRadius: "24px" }}></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="shimmer" style={{ height: "40px", width: "70%", borderRadius: "8px" }}></div>
            <div className="shimmer" style={{ height: "24px", width: "40%", borderRadius: "8px" }}></div>
            <div className="shimmer" style={{ height: "80px", width: "90%", borderRadius: "8px" }}></div>
            <div className="shimmer" style={{ height: "50px", width: "50%", borderRadius: "8px" }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ paddingTop: "140px", paddingBottom: "100px", textAlign: "center", minHeight: "60vh" }}>
        <h2 style={{ marginBottom: "16px" }}>Product Not Found</h2>
        <Link to="/shop" className="btn btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const isOutOfStock = selectedVariant 
    ? Number(selectedVariant.stock) <= 0 
    : Number(product.stock) <= 0;

  const currentPrice = selectedVariant 
    ? Number(selectedVariant.price) 
    : Number(product.salePrice || product.price || 0);

  const originalPrice = selectedVariant
    ? null
    : Number(product.price || 0);

  const hasDiscount = originalPrice && currentPrice < originalPrice;
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedVariant, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <div className="container">
        {/* Back Link */}
        <Link to="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "32px" }}>
          <ArrowLeft size={16} /> Back to Catalog
        </Link>

        {/* Product Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }} className="details-layout-grid">
          
          {/* Left: Images Gallery */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="glass-card" style={{
              width: "100%",
              paddingBottom: "100%",
              position: "relative",
              borderRadius: "24px",
              overflow: "hidden",
              background: "#f8fafc"
            }}>
              <img
                src={selectedImage}
                alt={product.name}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "all 0.3s ease"
                }}
              />
            </div>

            {/* Thumbnails list */}
            {product.images?.length > 1 && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(img.url)}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: selectedImage === img.url ? "2px solid var(--primary)" : "2px solid var(--border-color)",
                      padding: 0,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <img src={img.url} alt={`Thumbnail ${index}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--primary)", display: "block", marginBottom: "8px" }}>
                {product.brand || "General Brand"}
              </span>
              <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: "900", lineHeight: "1.2", marginBottom: "12px" }}>
                {product.name}
              </h1>
              
              {/* Reviews Mock */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "var(--text-muted)" }}>
                <div style={{ display: "flex", color: "#f59e0b" }}>
                  <Star size={16} fill="#f59e0b" />
                  <Star size={16} fill="#f59e0b" />
                  <Star size={16} fill="#f59e0b" />
                  <Star size={16} fill="#f59e0b" />
                  <Star size={16} fill="#f59e0b" />
                </div>
                <span style={{ fontWeight: "700", color: "var(--text-main)", marginLeft: "4px" }}>5.0</span>
                <span>(48 customer reviews)</span>
              </div>
            </div>

            {/* Pricing Section */}
            <div style={{ padding: "20px", borderRadius: "18px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>CURRENT PRICE</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                  <span style={{ fontSize: "32px", fontWeight: "900", color: "var(--text-main)" }}>₹{currentPrice.toLocaleString()}</span>
                  {hasDiscount && (
                    <span style={{ fontSize: "16px", color: "var(--text-muted)", textDecoration: "line-through" }}>₹{originalPrice.toLocaleString()}</span>
                  )}
                </div>
              </div>

              {hasDiscount && (
                <span className="badge badge-sale" style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: "800" }}>
                  SAVE {discountPercent}%
                </span>
              )}
            </div>

            {/* Variants Selector */}
            {product.variants?.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: "800", textTransform: "uppercase", color: "var(--text-muted)" }}>Select Variant / Size</span>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {product.variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "14px",
                        border: selectedVariant?.sku === v.sku ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                        background: selectedVariant?.sku === v.sku ? "var(--primary-glow)" : "var(--bg-card)",
                        color: selectedVariant?.sku === v.sku ? "var(--primary)" : "var(--text-main)",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {v.size} {Number(v.stock) <= 5 && <span style={{ color: "var(--error)", fontSize: "10px" }}>({v.stock} left)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Control Section */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {/* Quantity selectors */}
              <div style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid var(--border-color)",
                borderRadius: "16px",
                padding: "4px",
                background: "var(--bg-card)"
              }}>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ width: "40px", height: "40px", border: "none", background: "none", cursor: "pointer", fontSize: "18px", fontWeight: "700" }}
                >
                  -
                </button>
                <span style={{ width: "32px", textAlign: "center", fontWeight: "700" }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  style={{ width: "40px", height: "40px", border: "none", background: "none", cursor: "pointer", fontSize: "18px", fontWeight: "700" }}
                >
                  +
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`btn ${added ? "btn-secondary" : "btn-primary"}`}
                style={{
                  flexGrow: 1,
                  padding: "16px",
                  borderRadius: "16px",
                  fontSize: "16px",
                  background: isOutOfStock ? "var(--border-color)" : (added ? "var(--success)" : undefined),
                  color: added ? "white" : undefined,
                  cursor: isOutOfStock ? "not-allowed" : "pointer"
                }}
              >
                {isOutOfStock ? (
                  "Sold Out"
                ) : added ? (
                  <>
                    <Check size={18} /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} /> Add to Cart
                  </>
                )}
              </button>

              {/* Wishlist toggle button */}
              <button
                onClick={() => toggleWishlist(product)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  color: isInWishlist(product.id) ? "var(--error)" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  flexShrink: 0
                }}
                className="details-wishlist-btn"
                title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart size={20} fill={isInWishlist(product.id) ? "var(--error)" : "none"} />
              </button>
            </div>

            {/* Shipping Info Card */}
            <div style={{ padding: "16px", border: "1px solid var(--border-color)", borderRadius: "18px", background: "rgba(99, 102, 241, 0.04)" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--primary)" }}>
                <Truck size={18} />
                <span style={{ fontSize: "13px", fontWeight: "700" }}>Shiprocket Courier Serviceability</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", lineHeight: "1.4" }}>
                Add this item to cart and proceed to checkout to check real-time courier shipping charges to your pincode.
              </p>
            </div>

            {/* Description Tab selectors */}
            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "24px", marginBottom: "16px" }}>
                <button
                  onClick={() => setActiveTab("desc")}
                  style={{
                    paddingBottom: "12px",
                    border: "none",
                    background: "none",
                    borderBottom: activeTab === "desc" ? "2px solid var(--primary)" : "none",
                    color: activeTab === "desc" ? "var(--text-main)" : "var(--text-muted)",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab("specs")}
                  style={{
                    paddingBottom: "12px",
                    border: "none",
                    background: "none",
                    borderBottom: activeTab === "specs" ? "2px solid var(--primary)" : "none",
                    color: activeTab === "specs" ? "var(--text-main)" : "var(--text-muted)",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Specifications
                </button>
              </div>

              {activeTab === "desc" ? (
                <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.7", whiteSpace: "pre-line" }}>
                  {product.description || "No description provided for this premium Vistaraa product. It offers excellent style, durability, and satisfies top quality parameters."}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                    <span style={{ fontWeight: "700" }}>HSN Code</span>
                    <span>{product.hsn || "N/A"}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                    <span style={{ fontWeight: "700" }}>Category</span>
                    <span>{product.categoryName || "General"}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                    <span style={{ fontWeight: "700" }}>Subcategory</span>
                    <span>{product.subcategoryName || "N/A"}</span>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .details-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
        .details-wishlist-btn:hover {
          transform: translateY(-2px);
          border-color: var(--card-border-hover);
          color: var(--error) !important;
          box-shadow: var(--shadow-sm);
        }
        .details-wishlist-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
