import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase";
import ProductCard from "../components/ProductCard";
import { ArrowRight, Sparkles, Truck, RotateCcw, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { getPlaceholderImage } from "../utils/placeholder";

export default function Home() {
  const [posters, setPosters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);

        // 1. Fetch active posters
        const postersSnap = await getDocs(collection(db, "posters"));
        const postersData = postersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => p.status === "active");
        setPosters(postersData);

        // 2. Fetch active categories
        const categoriesSnap = await getDocs(collection(db, "categories"));
        const categoriesData = categoriesSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => c.isActive !== false); // default to true if undefined
        setCategories(categoriesData.slice(0, 8)); // top 8 categories

        // 3. Fetch latest products
        const productsSnap = await getDocs(query(collection(db, "products"), limit(8)));
        const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLatestProducts(productsData);

      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Slide Auto-scroll effect
  useEffect(() => {
    if (posters.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % posters.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [posters]);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % posters.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + posters.length) % posters.length);
  };

  return (
    <div style={{ paddingBottom: "80px", paddingTop: "80px" }}>
      {/* 1. HERO BANNER SLIDER */}
      <section style={{ position: "relative", height: "70vh", minHeight: "450px", overflow: "hidden", background: "#0f172a" }}>
        {loading ? (
          <div className="shimmer" style={{ width: "100%", height: "100%" }}></div>
        ) : posters.length > 0 ? (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            {posters.map((poster, index) => (
              <div
                key={poster.id}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: index === activeSlide ? 1 : 0,
                  transition: "opacity 0.8s ease-in-out",
                  display: "flex",
                  alignItems: "center",
                  zIndex: index === activeSlide ? 1 : 0
                }}
              >
                {/* Background Poster Image */}
                <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
                  <img
                    src={poster.image}
                    alt={poster.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.65)" }}
                  />
                </div>
                
                {/* Text Content Overlay */}
                <div className="container" style={{ position: "relative", zIndex: 2, color: "white", maxWidth: "800px" }}>
                  <div className="fade-in-up" style={{ padding: "0 20px" }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(255, 255, 255, 0.15)",
                      backdropFilter: "blur(4px)",
                      padding: "8px 16px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "20px"
                    }}>
                      <Sparkles size={14} className="gradient-text" /> Exclusive Selection
                    </span>
                    <h1 style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "clamp(32px, 6vw, 64px)",
                      fontWeight: "900",
                      lineHeight: "1.1",
                      marginBottom: "20px",
                      color: "white"
                    }}>
                      {poster.title}
                    </h1>
                    <p style={{
                      fontSize: "clamp(14px, 2.5vw, 18px)",
                      color: "rgba(255, 255, 255, 0.85)",
                      marginBottom: "32px",
                      fontWeight: "500",
                      lineHeight: "1.6"
                    }}>
                      {poster.subContents}
                    </p>
                    <Link to="/shop" className="btn btn-primary" style={{ padding: "16px 36px", borderRadius: "18px", fontSize: "15px" }}>
                      Explore Collection <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Slider Controls */}
            {posters.length > 1 && (
              <>
                <button onClick={handlePrevSlide} style={{
                  position: "absolute",
                  left: "24px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 3,
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white",
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }} className="slide-ctrl">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={handleNextSlide} style={{
                  position: "absolute",
                  right: "24px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 3,
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white",
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }} className="slide-ctrl">
                  <ChevronRight size={24} />
                </button>

                {/* Slider indicators */}
                <div style={{
                  position: "absolute",
                  bottom: "24px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 3,
                  display: "flex",
                  gap: "8px"
                }}>
                  {posters.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      style={{
                        width: i === activeSlide ? "32px" : "8px",
                        height: "8px",
                        borderRadius: "99px",
                        border: "none",
                        background: i === activeSlide ? "var(--primary)" : "rgba(255, 255, 255, 0.4)",
                        cursor: "pointer",
                        transition: "all 0.3s ease"
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="container" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <div style={{ textAlign: "center" }}>
              <h1 style={{ color: "white", marginBottom: "16px" }}>Welcome to Vistaraa</h1>
              <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>Start exploring our catalog of premium products</p>
              <Link to="/shop" className="btn btn-primary">Shop Now</Link>
            </div>
          </div>
        )}
      </section>

      {/* 2. CORE FEATURES BAR */}
      <section style={{ padding: "40px 0", borderBottom: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
        <div className="container" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ background: "var(--primary-glow)", color: "var(--primary)", padding: "16px", borderRadius: "18px" }}>
              <Truck size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: "700" }}>Express Delivery</h4>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Calculated rates via Shiprocket</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ background: "rgba(244, 63, 94, 0.15)", color: "var(--accent)", padding: "16px", borderRadius: "18px" }}>
              <RotateCcw size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: "700" }}>7-Day Returns</h4>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Easy pickup and refund requests</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)", padding: "16px", borderRadius: "18px" }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: "700" }}>Secure Checkout</h4>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Protected Razorpay gateway</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC CATEGORIES OVERVIEW */}
      <section className="section-padding">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px" }}>
            <div>
              <h2 style={{ fontSize: "32px", fontWeight: "800" }}>Shop by Category</h2>
              <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>Find items catered specifically for you</p>
            </div>
            <Link to="/shop" style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", color: "var(--primary)" }}>
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "24px" }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shimmer" style={{ height: "160px", borderRadius: "20px" }}></div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "24px"
            }}>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.id}`}
                  className="glass-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "24px 16px",
                    textAlign: "center",
                    gap: "12px",
                    background: "var(--bg-card)"
                  }}
                >
                  <div style={{ width: "70px", height: "70px", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--border-color)", background: "#f1f5f9" }}>
                    <img
                      src={cat.image || cat.icon || getPlaceholderImage(100, 100, cat.name)}
                      alt={cat.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", width: "100%", whiteSpace: "nowrap" }}>
                    {cat.name}
                  </h4>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>No categories listed yet.</p>
          )}
        </div>
      </section>

      {/* 4. DYNAMIC PRODUCTS GRID (LATEST PRODUCTS) */}
      <section className="section-padding" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
            <div>
              <h2 style={{ fontSize: "32px", fontWeight: "800" }}>Latest Arrivals</h2>
              <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>Freshly uploaded stock in our catalog</p>
            </div>
            <Link to="/shop" className="btn btn-secondary" style={{ borderRadius: "14px" }}>
              Explore Shop
            </Link>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "30px" }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="shimmer" style={{ height: "380px", borderRadius: "24px" }}></div>
              ))}
            </div>
          ) : latestProducts.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "30px"
            }}>
              {latestProducts.map((product) => (
                <div key={product.id} className="fade-in-up">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ color: "var(--text-muted)" }}>No products available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Inline styles for slides buttons hover */}
      <style>{`
        .slide-ctrl:hover {
          background: rgba(255, 255, 255, 0.25) !important;
          transform: translateY(-50%) scale(1.05) !important;
        }
      `}</style>
    </div>
  );
}
