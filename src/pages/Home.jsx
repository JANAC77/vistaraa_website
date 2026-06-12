import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, limit, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import ProductCard from "../components/ProductCard";
import { ArrowRight, Sparkles, Truck, RotateCcw, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { getPlaceholderImage } from "../utils/placeholder";

export default function Home() {
  const [posters, setPosters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recommended, setRecommended] = useState([]);
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

        // 4. Fetch recently viewed products from localStorage
        const viewedIds = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
        let viewedProducts = [];
        if (viewedIds.length > 0) {
          const promises = viewedIds.map(id => getDoc(doc(db, "products", id)));
          const snaps = await Promise.all(promises);
          viewedProducts = snaps
            .filter(s => s.exists())
            .map(s => ({ id: s.id, ...s.data() }));
          setRecentlyViewed(viewedProducts);
        }

        // 5. Fetch recommended products
        // Recommendation logic:
        // A. If user viewed some categories, fetch other products in those categories.
        // B. Otherwise, fetch products on sale or general products.
        const viewedCategories = [...new Set(viewedProducts.map(p => p.category).filter(Boolean))];
        let recommendedProducts = [];

        if (viewedCategories.length > 0) {
          const recommendedSnap = await getDocs(
            query(
              collection(db, "products"),
              where("category", "in", viewedCategories.slice(0, 10)),
              limit(10)
            )
          );
          recommendedProducts = recommendedSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => !viewedIds.includes(p.id)); // exclude already viewed
        }

        // If we don't have enough recommendations, backfill with general products
        if (recommendedProducts.length < 4) {
          const generalSnap = await getDocs(query(collection(db, "products"), limit(12)));
          const generalProducts = generalSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => !viewedIds.includes(p.id)); // exclude already viewed

          // Combine recommendations and filter duplicates
          const combined = [...recommendedProducts];
          for (const item of generalProducts) {
            if (!combined.some(c => c.id === item.id)) {
              combined.push(item);
            }
            if (combined.length >= 8) break;
          }
          recommendedProducts = combined;
        }

        setRecommended(recommendedProducts.slice(0, 8));

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
    <div style={{ paddingBottom: "80px", paddingTop: "80px", position: "relative", overflow: "hidden", background: "var(--bg-app)" }}>
      {/* Background ambient mesh gradient blobs for a highly colorful page */}
      <div style={{
        position: "absolute",
        top: "8%",
        left: "-120px",
        width: "350px",
        height: "350px",
        borderRadius: "50%",
        background: "rgba(124, 58, 237, 0.15)",
        filter: "blur(130px)",
        pointerEvents: "none",
        zIndex: 0
      }}></div>
      <div style={{
        position: "absolute",
        top: "28%",
        right: "-150px",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "rgba(219, 39, 119, 0.14)",
        filter: "blur(150px)",
        pointerEvents: "none",
        zIndex: 0
      }}></div>
      <div style={{
        position: "absolute",
        top: "60%",
        left: "-150px",
        width: "380px",
        height: "380px",
        borderRadius: "50%",
        background: "rgba(6, 182, 212, 0.12)",
        filter: "blur(140px)",
        pointerEvents: "none",
        zIndex: 0
      }}></div>
      <div style={{
        position: "absolute",
        bottom: "5%",
        right: "-120px",
        width: "350px",
        height: "350px",
        borderRadius: "50%",
        background: "rgba(245, 158, 11, 0.12)",
        filter: "blur(130px)",
        pointerEvents: "none",
        zIndex: 0
      }}></div>

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
                {/* Background Poster Image & Gradient Overlay */}
                <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
                  <img
                    src={poster.image}
                    alt={poster.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }}
                  />
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(circle at 20% 50%, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.35) 50%, rgba(9, 10, 15, 0.85) 100%)"
                  }}></div>
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
                      <Sparkles size={14} color="var(--accent)" fill="var(--accent)" style={{ opacity: 0.85 }} /> Exclusive Selection
                    </span>
                    <h1 style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "clamp(32px, 6vw, 64px)",
                      fontWeight: "900",
                      lineHeight: "1.1",
                      marginBottom: "20px",
                      color: "white",
                      letterSpacing: "-0.03em"
                    }}>
                      {poster.title}
                    </h1>
                    <p style={{
                      fontSize: "clamp(14px, 2.5vw, 18px)",
                      color: "rgba(255, 255, 255, 0.8)",
                      marginBottom: "32px",
                      fontWeight: "500",
                      lineHeight: "1.6",
                      letterSpacing: "0.01em"
                    }}>
                      {poster.subContents}
                    </p>
                    <Link to="/shop" className="btn btn-primary" style={{ 
                      padding: "16px 36px", 
                      borderRadius: "18px", 
                      fontSize: "15px",
                      background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                      border: "none",
                      boxShadow: "0 10px 25px var(--primary-glow)",
                      fontWeight: "800"
                    }}>
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
      <section style={{ padding: "40px 0", borderBottom: "1px solid var(--border-color)", background: "var(--bg-app)", position: "relative", zIndex: 1 }}>
        <div className="container" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "24px"
        }}>
          {/* Card 1 */}
          <div className="feature-card" style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.02) 100%)",
            padding: "24px",
            borderRadius: "20px",
            border: "1px solid rgba(139, 92, 246, 0.15)",
            boxShadow: "0 10px 20px rgba(139, 92, 246, 0.03)",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{
              background: "var(--primary-glow)",
              color: "var(--primary)",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Truck size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: "800", fontSize: "15px", color: "var(--text-main)" }}>Express Delivery</h4>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Calculated rates via Shiprocket</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="feature-card" style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            background: "linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(236, 72, 153, 0.02) 100%)",
            padding: "24px",
            borderRadius: "20px",
            border: "1px solid rgba(244, 63, 94, 0.15)",
            boxShadow: "0 10px 20px rgba(244, 63, 94, 0.03)",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{
              background: "rgba(244, 63, 94, 0.1)",
              color: "var(--accent)",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <RotateCcw size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: "800", fontSize: "15px", color: "var(--text-main)" }}>7-Day Returns</h4>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Easy pickup and refund requests</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="feature-card" style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.02) 100%)",
            padding: "24px",
            borderRadius: "20px",
            border: "1px solid rgba(16, 185, 129, 0.15)",
            boxShadow: "0 10px 20px rgba(16, 185, 129, 0.03)",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{
              background: "rgba(16, 185, 129, 0.1)",
              color: "var(--success)",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: "800", fontSize: "15px", color: "var(--text-main)" }}>Secure Checkout</h4>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Protected Razorpay gateway</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC CATEGORIES OVERVIEW */}
      <section className="section-padding">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px" }}>
            <div>
              <h2 style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-main)" }}>Shop by Category</h2>
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
              {categories.map((cat, index) => {
                const categoryGradients = [
                  "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(244, 63, 94, 0.03) 100%)", // Purple-Pink
                  "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(6, 182, 212, 0.03) 100%)", // Blue-Cyan
                  "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%)", // Green-Yellow
                  "linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(244, 63, 94, 0.03) 100%)", // Pink-Rose
                  "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.03) 100%)", // Orange-Red
                  "linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%)", // Indigo-Purple
                  "linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)", // Cyan-Green
                  "linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(236, 72, 153, 0.03) 100%)"  // Purple-Pink
                ];
                const gradient = categoryGradients[index % categoryGradients.length];

                return (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${cat.id}`}
                    className={`category-card fade-in-up delay-${(index % 8) + 1}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "24px 16px",
                      textAlign: "center",
                      gap: "14px",
                      background: gradient,
                      border: "1px solid var(--border-color)",
                      borderRadius: "24px",
                      boxShadow: "0 8px 16px rgba(0,0,0,0.02)",
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      textDecoration: "none",
                      color: "inherit"
                    }}
                  >
                    <div style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid var(--border-color)",
                      background: "#f1f5f9",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.03)"
                    }} className="category-img-container">
                      <img
                        src={cat.image || cat.icon || getPlaceholderImage(100, 100, cat.name)}
                        alt={cat.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }}
                      />
                    </div>
                    <h4 style={{ fontSize: "13px", fontWeight: "800", overflow: "hidden", textOverflow: "ellipsis", width: "100%", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      {cat.name}
                    </h4>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>No categories listed yet.</p>
          )}
        </div>
      </section>

      {/* 4. DYNAMIC PRODUCTS GRID (LATEST PRODUCTS) */}
      <section className="section-padding" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", position: "relative", zIndex: 1 }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
            <div>
              <h2 style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-main)" }}>Latest Arrivals</h2>
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
              {latestProducts.map((product, index) => (
                <div key={product.id} className={`fade-in-up delay-${(index % 8) + 1}`}>
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

      {/* 5. RECENTLY VIEWED PRODUCTS (CONDITIONAL) */}
      {recentlyViewed.length > 0 && (
        <section className="section-padding" style={{ position: "relative", zIndex: 1 }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
              <div>
                <h2 style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-main)" }}>Recently Viewed</h2>
                <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>Items you have inspected recently</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("recently_viewed");
                  setRecentlyViewed([]);
                }}
                className="btn btn-secondary"
                style={{ borderRadius: "14px", padding: "10px 20px", fontSize: "13px" }}
              >
                Clear History
              </button>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "30px"
            }}>
              {recentlyViewed.map((product, index) => (
                <div key={`recent-${product.id}`} className={`fade-in-up delay-${(index % 8) + 1}`}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. RECOMMENDED PRODUCTS */}
      <section className="section-padding" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", position: "relative", zIndex: 1 }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
            <div>
              <h2 style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-main)" }}>Recommended for You</h2>
              <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>Curated selections matching your interests</p>
            </div>
            <Link to="/shop" className="btn btn-secondary" style={{ borderRadius: "14px" }}>
              Explore More
            </Link>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "30px" }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="shimmer" style={{ height: "380px", borderRadius: "24px" }}></div>
              ))}
            </div>
          ) : recommended.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "30px"
            }}>
              {recommended.map((product, index) => (
                <div key={`rec-${product.id}`} className={`fade-in-up delay-${(index % 8) + 1}`}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ color: "var(--text-muted)" }}>No recommendations available at the moment.</p>
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
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary-glow) !important;
        }
        .category-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary) !important;
        }
        .category-card:hover .category-img-container {
          transform: scale(1.05);
          border-color: var(--primary) !important;
        }
        .hover-link {
          transition: all 0.25s ease;
        }
        .hover-link:hover {
          color: var(--accent) !important;
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}
