import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Compass, Eye, Heart, ShieldCheck, Star, Users } from "lucide-react";

export default function AboutUs() {
  return (
    <div style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      {/* 1. HERO SECTION */}
      <section style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
        color: "white",
        padding: "80px 0",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Background glow overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.1)" }}></div>
        <div style={{ position: "absolute", top: "-50px", left: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", filter: "blur(40px)" }}></div>

        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <span style={{
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(8px)",
            padding: "8px 20px",
            borderRadius: "99px",
            fontSize: "12px",
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: "20px",
            display: "inline-block"
          }}>
            Our Story
          </span>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: "900", lineHeight: "1.2", marginBottom: "20px", color: "white" }}>
            Elevating Daily Living
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "clamp(15px, 2.5vw, 19px)", maxWidth: "700px", marginLeft: "auto", marginRight: "auto", lineHeight: "1.6" }}>
            Vistaraa is a premium curated marketplace dedicated to sourcing state-of-the-art products that combine absolute craftsmanship with eco-conscious execution.
          </p>
        </div>
      </section>

      {/* 2. VISION & MISSION SECTION */}
      <section className="section-padding" style={{ background: "var(--bg-app)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px" }}>
            {/* Vision Card */}
            <div className="glass-card" style={{
              padding: "40px",
              borderRadius: "28px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              <div style={{
                background: "var(--primary-glow)",
                color: "var(--primary)",
                width: "60px",
                height: "60px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Eye size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "12px" }}>Our Vision</h2>
                <p style={{ color: "var(--text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
                  To establish a premier lifestyle destination that empowers individuals to access ethically crafted, highly durable, and uniquely designed items, enriching homes worldwide while supporting artisan creators.
                </p>
              </div>
            </div>

            {/* Mission Card */}
            <div className="glass-card" style={{
              padding: "40px",
              borderRadius: "28px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              <div style={{
                background: "rgba(244, 63, 94, 0.12)",
                color: "var(--accent)",
                width: "60px",
                height: "60px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Compass size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "12px" }}>Our Mission</h2>
                <p style={{ color: "var(--text-muted)", lineHeight: "1.7", fontSize: "15px" }}>
                  We work tirelessly to remove supply-chain clutter, providing direct access to verified sellers, integrating rapid Shiprocket logistics, and assuring Razorpay secure checkout models for effortless purchasing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE VALUES SECTION */}
      <section className="section-padding" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <span style={{ color: "var(--primary)", fontWeight: "800", textTransform: "uppercase", fontSize: "13px", letterSpacing: "0.1em" }}>
              Values We Live By
            </span>
            <h2 style={{ fontSize: "36px", fontWeight: "900", marginTop: "12px" }}>The Pillars of Vistaraa</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "8px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
              Everything we do is guided by a commitment to absolute quality, eco-conscious stewardship, and merchant empowerment.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "30px" }}>
            {/* Value 1 */}
            <div style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ color: "var(--primary)", marginBottom: "16px", display: "inline-flex", padding: "16px", background: "var(--primary-glow)", borderRadius: "50%" }}>
                <Star size={24} fill="var(--primary)" />
              </div>
              <h4 style={{ fontWeight: "800", fontSize: "18px", marginBottom: "10px" }}>Uncompromised Quality</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
                Every single item goes through rigorous quality controls to verify durability and styling parameters.
              </p>
            </div>

            {/* Value 2 */}
            <div style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ color: "#10b981", marginBottom: "16px", display: "inline-flex", padding: "16px", background: "rgba(16,185,129,0.12)", borderRadius: "50%" }}>
                <ShieldCheck size={24} />
              </div>
              <h4 style={{ fontWeight: "800", fontSize: "18px", marginBottom: "10px" }}>Merchant Trust</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
                We support local artisans and vetted merchants, providing them a premium gateway to grow their business.
              </p>
            </div>

            {/* Value 3 */}
            <div style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ color: "var(--accent)", marginBottom: "16px", display: "inline-flex", padding: "16px", background: "rgba(244,63,94,0.12)", borderRadius: "50%" }}>
                <Sparkles size={24} />
              </div>
              <h4 style={{ fontWeight: "800", fontSize: "18px", marginBottom: "10px" }}>Delightful Support</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
                Our 24/7 dedicated support ensures your queries, shipments, and returns are handled instantly.
              </p>
            </div>

            {/* Value 4 */}
            <div style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ color: "#8b5cf6", marginBottom: "16px", display: "inline-flex", padding: "16px", background: "rgba(139,92,246,0.12)", borderRadius: "50%" }}>
                <Users size={24} />
              </div>
              <h4 style={{ fontWeight: "800", fontSize: "18px", marginBottom: "10px" }}>Active Community</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
                We believe in growing with our customers, collecting real feedback, and adapting to your lifestyle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION SECTION */}
      <section className="section-padding" style={{ textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "650px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "16px" }}>Ready to Redefine Your Space?</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "32px", lineHeight: "1.7" }}>
            Explore our curated catalog featuring express delivery rates, secure payment methods, and an array of premium home and fashion items.
          </p>
          <Link to="/shop" className="btn btn-primary" style={{ padding: "16px 36px", borderRadius: "18px" }}>
            Start Shopping
          </Link>
        </div>
      </section>
    </div>
  );
}
