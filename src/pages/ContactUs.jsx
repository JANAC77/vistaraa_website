import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, Check, AlertCircle } from "lucide-react";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || "https://vistaraa-server.vercel.app";

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // "success" or "error"

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus("error");
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/contact-us`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

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
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.1)" }}></div>
        <div style={{ position: "absolute", bottom: "-50px", right: "-50px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", filter: "blur(45px)" }}></div>
        
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
            Get In Touch
          </span>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: "900", lineHeight: "1.2", marginBottom: "20px", color: "white" }}>
            Contact Our Team
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "clamp(15px, 2.5vw, 19px)", maxWidth: "700px", marginLeft: "auto", marginRight: "auto", lineHeight: "1.6" }}>
            Have a question, feedback, or custom support query? Write to us, and our representative will respond within 24 hours.
          </p>
        </div>
      </section>

      {/* 2. CONTACT GRID */}
      <section className="section-padding">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "60px", alignItems: "start" }} className="contact-grid">
            
            {/* Left: Contact Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              <div>
                <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "12px" }}>Contact Information</h2>
                <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
                  Reach out to us directly via our support channels, or visit our retail operations center in Karnataka.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Support Card 1 */}
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{
                    background: "var(--primary-glow)",
                    color: "var(--primary)",
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>Call Support</h4>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>+91 70195 12273</p>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Mon - Sat, 10 AM to 6 PM</span>
                  </div>
                </div>

                {/* Support Card 2 */}
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{
                    background: "rgba(244, 63, 94, 0.12)",
                    color: "var(--accent)",
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>Email Queries</h4>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>support@vistaraa.in</p>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Response guaranteed within 24 hours</span>
                  </div>
                </div>

                {/* Support Card 3 */}
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#10b981",
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>Operations Center</h4>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.5" }}>
                      Vistaraa Retail Pvt. Ltd.<br />
                      Ground Floor, Rajiv Gandhi Nagar,<br />
                      Karatgi, Karnataka - 583229
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Glassmorphic Contact Form */}
            <div className="glass-card" style={{
              padding: "40px",
              borderRadius: "28px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-md)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
                <MessageSquare size={20} style={{ color: "var(--primary)" }} />
                <h3 style={{ fontSize: "22px", fontWeight: "800" }}>Send Us a Message</h3>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Form status notices */}
                {status === "success" && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    color: "#10b981",
                    padding: "14px 18px",
                    borderRadius: "14px",
                    fontSize: "14px"
                  }}>
                    <Check size={18} /> Message sent successfully! We'll be in touch soon.
                  </div>
                )}
                {status === "error" && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "var(--error)",
                    padding: "14px 18px",
                    borderRadius: "14px",
                    fontSize: "14px"
                  }}>
                    <AlertCircle size={18} /> Please fill out all required fields before submitting.
                  </div>
                )}

                {/* Name field */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="name" style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>YOUR NAME *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    required
                    style={{
                      padding: "14px 18px",
                      borderRadius: "14px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-app)",
                      outline: "none",
                      fontSize: "14px"
                    }}
                  />
                </div>

                {/* Email field */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="email" style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    required
                    style={{
                      padding: "14px 18px",
                      borderRadius: "14px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-app)",
                      outline: "none",
                      fontSize: "14px"
                    }}
                  />
                </div>

                {/* Message field */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="message" style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>YOUR MESSAGE *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Write your message here..."
                    required
                    style={{
                      padding: "14px 18px",
                      borderRadius: "14px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-app)",
                      outline: "none",
                      fontSize: "14px",
                      resize: "vertical"
                    }}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    cursor: submitting ? "not-allowed" : "pointer"
                  }}
                >
                  {submitting ? (
                    "Sending Message..."
                  ) : (
                    <>
                      Send Message <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </div>
  );
}
