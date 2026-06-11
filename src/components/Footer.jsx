import React from "react";
import { Link } from "react-router-dom";
import { Send, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer style={{
      background: "var(--text-main)",
      color: "var(--bg-app)",
      padding: "60px 0 30px",
      borderTop: "1px solid var(--border-color)",
    }}>
      <div className="container" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "40px",
        marginBottom: "40px"
      }}>
        {/* Brand Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Logo size={50} />
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            Experience the pinnacle of curated lifestyle shopping. Discover handpicked fashion, cutting-edge electronics, and stunning accessories.
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <a href="#" style={{ color: "var(--text-muted)", hoverColor: "var(--bg-app)" }}><FaFacebook size={20} /></a>
            <a href="#" style={{ color: "var(--text-muted)", hoverColor: "var(--bg-app)" }}><FaTwitter size={20} /></a>
            <a href="#" style={{ color: "var(--text-muted)", hoverColor: "var(--bg-app)" }}><FaInstagram size={20} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h4 style={{ color: "white", fontSize: "16px", fontWeight: "700" }}>Quick Links</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
            <li><Link to="/" style={{ color: "var(--text-muted)" }} className="footer-link">Home</Link></li>
            <li><Link to="/shop" style={{ color: "var(--text-muted)" }} className="footer-link">Shop Catalog</Link></li>
            <li><Link to="/cart" style={{ color: "var(--text-muted)" }} className="footer-link">My Cart</Link></li>
            <li><Link to="/dashboard" style={{ color: "var(--text-muted)" }} className="footer-link">Order Tracking</Link></li>
          </ul>
        </div>

        {/* Customer Support */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h4 style={{ color: "white", fontSize: "16px", fontWeight: "700" }}>Contact Us</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", color: "var(--text-muted)" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={16} />
              <span>Ground Floor, Rajiv Gandhi Nagar, Karatgi, Karnataka - 583229</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Phone size={16} />
              <span>+91 70195 12273</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={16} />
              <span>support@vistaraa.in</span>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h4 style={{ color: "white", fontSize: "16px", fontWeight: "700" }}>Newsletter</h4>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Subscribe to receive updates, access to exclusive deals, and more.</p>
          <div style={{ display: "flex", position: "relative" }}>
            <input type="email" placeholder="Your Email Address" style={{
              width: "100%",
              padding: "12px 48px 12px 16px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              background: "rgba(255, 255, 255, 0.08)",
              color: "white",
              outline: "none",
              fontSize: "14px"
            }} />
            <button style={{
              position: "absolute",
              right: "4px",
              top: "4px",
              bottom: "4px",
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              width: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{
        paddingTop: "24px",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        fontSize: "12px",
        color: "var(--text-muted)"
      }}>
        <span>&copy; {new Date().getFullYear()} Vistaraa Retail Pvt. Ltd. All rights reserved.</span>
        <div style={{ display: "flex", gap: "16px" }}>
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms of Service</a>
          <a href="#" className="footer-link">Shipping & Returns</a>
        </div>
      </div>

      <style>{`
        .footer-link {
          transition: color 0.2s ease;
        }
        .footer-link:hover {
          color: white !important;
        }
      `}</style>
    </footer>
  );
}
