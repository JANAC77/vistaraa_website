import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, User, Sun, Moon, Menu, X, LogOut } from "lucide-react";
import { useCart } from "../context/CartContext";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Logo from "./Logo";

export default function Navbar() {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("vistaraa_theme") || "light";
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vistaraa_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className={`glass-nav ${scrolled ? "scrolled" : ""}`} style={{ padding: scrolled ? "12px 0" : "18px 0" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none" }}>
          <Logo size={40} />
        </Link>

        {/* Desktop Navigation */}
        <nav style={{ display: "flex", alignItems: "center", gap: "32px" }} className="desktop-menu">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Home
          </NavLink>
          <NavLink to="/shop" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Shop
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Orders
            </NavLink>
          )}
        </nav>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Theme Toggle */}
          <button onClick={toggleTheme} style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "12px",
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center"
          }} title="Toggle Theme">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Cart Icon */}
          <Link to="/cart" style={{
            position: "relative",
            padding: "8px",
            borderRadius: "12px",
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center"
          }}>
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span style={{
                position: "absolute",
                top: "0",
                right: "0",
                background: "var(--accent)",
                color: "white",
                fontSize: "10px",
                fontWeight: "800",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 5px rgba(244, 63, 94, 0.4)"
              }}>
                {cartCount}
              </span>
            )}
          </Link>

          {/* Profile / Auth */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link to="/dashboard" style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "14px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)"
              }}>
                <User size={16} />
                <span style={{ fontSize: "13px", fontWeight: "600", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.displayName || user.email.split("@")[0]}
                </span>
              </Link>
              <button onClick={handleLogout} style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: "var(--error)",
                display: "flex",
                alignItems: "center"
              }} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ padding: "8px 18px", borderRadius: "12px", fontSize: "13px" }}>
              Sign In
            </Link>
          )}

          {/* Mobile Menu Trigger */}
          <button onClick={() => setMobileMenuOpen(true)} className="mobile-trigger" style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            color: "var(--text-main)",
            display: "none"
          }}>
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "var(--bg-app)",
          zIndex: 2000,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          animation: "fadeIn 0.2s ease"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Logo size={36} />
            <button onClick={() => setMobileMenuOpen(false)} style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              color: "var(--text-main)"
            }}>
              <X size={24} />
            </button>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "24px", fontSize: "20px", fontWeight: "700" }}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            {user && <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>}
            {!user && <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>}
          </nav>

          {user && (
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                <User size={20} />
                <div>
                  <p style={{ fontWeight: "700", fontSize: "14px" }}>{user.displayName || "User Account"}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{user.email}</p>
                </div>
              </div>
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn btn-secondary" style={{ color: "var(--error)", borderColor: "rgba(239, 68, 68, 0.2)" }}>
                Logout
              </button>
            </div>
          )}
        </div>
      )}

      {/* Styled Inline Classes for Header links */}
      <style>{`
        .nav-link {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-muted);
          position: relative;
          padding: 4px 0;
        }
        .nav-link:hover {
          color: var(--text-main);
        }
        .nav-link.active {
          color: var(--primary);
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--primary);
          border-radius: 99px;
        }
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-trigger {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}
