import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ShoppingBag, Heart, User, Sun, Moon, Menu, X, LogOut, ChevronDown, Search, Store } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import Logo from "./Logo";
import { getPlaceholderImage } from "../utils/placeholder";

export default function Navbar() {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Active state logic to prevent highlight conflict between Shop and Categories
  const isCategoriesActive = location.pathname === "/shop" && (searchParams.has("category") || searchParams.has("subcategory"));

  const [user, setUser] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const searchParam = searchParams.get("search") || "";
    setSearchQuery(searchParam);
  }, [searchParams]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    const params = new URLSearchParams(location.search);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    const isAtShop = location.pathname === "/shop";
    navigate(`/shop?${params.toString()}`, { replace: isAtShop });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const params = new URLSearchParams(location.search);
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    } else {
      params.delete("search");
    }
    navigate(`/shop?${params.toString()}`);
  };
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [hoveredCategoryId, setHoveredCategoryId] = useState(null);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  useEffect(() => {
    const fetchCategoriesAndSubs = async () => {
      try {
        const [categoriesSnap, subcategoriesSnap] = await Promise.all([
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "subcategories"))
        ]);
        const categoriesData = categoriesSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => c.isActive !== false);
        const subcategoriesData = subcategoriesSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(categoriesData);
        setSubcategories(subcategoriesData);
      } catch (error) {
        console.error("Error fetching categories/subs in navbar:", error);
      }
    };
    fetchCategoriesAndSubs();
  }, []);

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
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("vistaraa_theme", "light");
  }, []);

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

          <NavLink to="/about" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            About Us
          </NavLink>

          <NavLink to="/contact" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Contact Us
          </NavLink>

          {/* Categories Dropdown */}
          <div
            className="nav-dropdown-container"
            onMouseEnter={() => setCategoriesDropdownOpen(true)}
            onMouseLeave={() => setCategoriesDropdownOpen(false)}
            style={{ position: "relative", cursor: "pointer", display: "inline-block" }}
          >
            <Link
              to="/shop"
              className={isCategoriesActive ? "nav-link active" : "nav-link"}
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
              onClick={() => setCategoriesDropdownOpen(false)}
            >
              Categories <ChevronDown size={14} style={{
                transform: categoriesDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease"
              }} />
            </Link>

            {categoriesDropdownOpen && categories.length > 0 && (
              <div className="mega-menu-card">
                {/* Shop All Header Link */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Link
                    to="/shop"
                    onClick={() => setCategoriesDropdownOpen(false)}
                    className="mega-menu-shop-all"
                    style={{
                      fontSize: "14px",
                      fontWeight: "800",
                      color: "var(--primary)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    Shop All Products &rarr;
                  </Link>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: 0 }} />

                {/* Grid Layout: Left categories (3 columns), Right promo card */}
                {(() => {
                  const categoryColumns = [[], [], []];
                  categories.forEach((cat, index) => {
                    categoryColumns[index % 3].push(cat);
                  });

                  return (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1.2fr",
                      gap: "32px",
                      alignItems: "flex-start",
                      paddingTop: "4px"
                    }}>
                      {categoryColumns.map((colCategories, colIndex) => (
                        <div key={colIndex} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                          {colCategories.map((cat) => {
                            const catSubs = subcategories.filter(sub => sub.categoryId === cat.id);
                            return (
                              <div key={cat.id} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
                                {/* Parent Category Title */}
                                <Link
                                  to={`/shop?category=${cat.id}`}
                                  onClick={() => setCategoriesDropdownOpen(false)}
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "800",
                                    color: "var(--primary)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    borderLeft: "3px solid var(--primary)",
                                    paddingLeft: "8px"
                                  }}
                                  className="mega-menu-cat-title"
                                >
                                  <div style={{
                                    width: "22px",
                                    height: "22px",
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    background: "#f1f5f9",
                                    border: "1px solid var(--border-color)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                  }}>
                                    <img
                                      src={cat.image || cat.icon || getPlaceholderImage(50, 50, cat.name)}
                                      alt={cat.name}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  </div>
                                  <span>{cat.name}</span>
                                </Link>

                                {/* Subcategories List */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                  {catSubs.map((sub) => (
                                    <Link
                                      key={sub.id}
                                      to={`/shop?category=${cat.id}&subcategory=${sub.id}`}
                                      onClick={() => setCategoriesDropdownOpen(false)}
                                      style={{
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        color: "var(--text-muted)",
                                        display: "block"
                                      }}
                                      className="mega-menu-sub-link"
                                    >
                                      {sub.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {/* Right side Featured Promo Card */}
                      <div className="glass-card" style={{
                        padding: "24px",
                        borderRadius: "18px",
                        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(244, 63, 94, 0.04) 100%)",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        height: "100%",
                        justifyContent: "center",
                        textAlign: "left"
                      }}>
                        <div>
                          <span style={{
                            background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                            color: "white",
                            fontSize: "9px",
                            fontWeight: "900",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            display: "inline-block",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            marginBottom: "12px"
                          }}>
                            Featured Selection
                          </span>
                          <h4 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px", lineHeight: "1.3" }}>
                            Explore the Vistaraa Collection
                          </h4>
                          <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                            Handpicked premium products featuring outstanding quality, designed to elevate your daily lifestyle.
                          </p>
                        </div>

                        <Link
                          to="/shop"
                          onClick={() => setCategoriesDropdownOpen(false)}
                          className="btn btn-secondary"
                          style={{
                            padding: "10px 16px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            alignSelf: "flex-start",
                            fontWeight: "700"
                          }}
                        >
                          Shop Now &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

        </nav>

        {/* Desktop Search Bar */}
        <form onSubmit={handleSearchSubmit} className="desktop-search" style={{ position: "relative", width: "240px", margin: "0 20px" }}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="form-input"
            style={{
              paddingLeft: "40px",
              paddingRight: searchQuery ? "36px" : "16px",
              borderRadius: "14px",
              fontSize: "13px",
              height: "40px",
              background: "var(--bg-app)",
              border: "1px solid var(--border-color)",
              width: "100%",
              outline: "none"
            }}
          />
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                borderRadius: "50%"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-main)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Seller Portal Link */}
          <a
            href="https://vistaraa-seller-one.vercel.app/login"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "relative",
              padding: "8px 14px",
              borderRadius: "14px",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "transform 0.2s ease, color 0.2s ease",
              border: "1px solid var(--border-color)",
              background: "rgba(139, 92, 246, 0.04)"
            }}
            title="Seller Portal"
            className="nav-action-btn nav-seller-btn"
          >
            <Store size={16} />
            <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }} className="seller-text">Seller Portal</span>
          </a>

          {/* Wishlist Icon */}
          <Link to="/wishlist" style={{
            position: "relative",
            padding: "8px",
            borderRadius: "12px",
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center"
          }} title="My Wishlist">
            <Heart size={20} />
            {wishlistCount > 0 && (
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
                {wishlistCount}
              </span>
            )}
          </Link>

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
            <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  cursor: "pointer",
                  color: "var(--text-main)",
                  fontWeight: "600"
                }}
              >
                <User size={16} />
                <span style={{ fontSize: "13px", fontWeight: "600", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.displayName || user.email.split("@")[0]}
                </span>
                <ChevronDown size={14} style={{ transform: profileDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              </button>

              {profileDropdownOpen && (
                <div className="glass-card profile-dropdown" style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  width: "280px",
                  background: "var(--bg-card)",
                  borderRadius: "20px",
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  animation: "fadeInUpProfile 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                }}>
                  {/* User Header Section */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "16px",
                      fontWeight: "800",
                      flexShrink: 0
                    }}>
                      {(user.displayName || user.email)[0].toUpperCase()}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", textAlign: "left" }}>
                      <span style={{ fontWeight: "800", fontSize: "14px", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {user.displayName || user.email.split("@")[0]}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: 0 }} />

                  {/* Dropdown Menu Items */}
                  <div style={{ display: "flex", flexDirection: "column", padding: "10px 0" }}>
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 20px",
                        fontSize: "13px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-main)",
                        transition: "all 0.2s"
                      }}
                      className="dropdown-item"
                    >
                      <User size={16} style={{ color: "var(--primary)" }} />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 20px",
                        fontSize: "13px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-main)",
                        transition: "all 0.2s"
                      }}
                      className="dropdown-item"
                    >
                      <ShoppingBag size={16} style={{ color: "var(--primary)" }} />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setProfileDropdownOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 20px",
                        fontSize: "13px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-main)",
                        transition: "all 0.2s"
                      }}
                      className="dropdown-item"
                    >
                      <Heart size={16} style={{ color: "var(--accent)" }} />
                      <span>Wishlist</span>
                    </Link>
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: 0 }} />

                  {/* Sign Out Button */}
                  <div style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => { setProfileDropdownOpen(false); handleLogout(); }}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "12px",
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.15)",
                        color: "var(--error)",
                        fontWeight: "700",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      className="dropdown-signout-btn"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>

                </div>
              )}
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
            {/* Mobile Search Bar */}
            <form onSubmit={handleSearchSubmit} style={{ position: "relative", width: "100%", marginBottom: "8px" }}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="form-input"
                style={{
                  paddingLeft: "42px",
                  paddingRight: searchQuery ? "38px" : "16px",
                  borderRadius: "14px",
                  fontSize: "14px",
                  height: "44px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  width: "100%",
                  outline: "none"
                }}
              />
              <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    borderRadius: "50%"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-main)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                >
                  <X size={16} />
                </button>
              )}
            </form>

            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>

            {/* Mobile Categories Collapsible */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                <span>Categories</span>
                <ChevronDown size={20} style={{
                  transform: mobileCategoriesOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease"
                }} />
              </button>

              {mobileCategoriesOpen && categories.length > 0 && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  paddingLeft: "16px",
                  borderLeft: "2px solid var(--border-color)",
                  marginTop: "8px",
                  animation: "fadeIn 0.2s ease"
                }}>
                  {/* Shop All Products inside mobile Categories */}
                  <Link
                    to="/shop"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontSize: "16px", fontWeight: "700", color: "var(--primary)" }}
                  >
                    Shop All Products
                  </Link>
                  <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "0", opacity: 0.5 }} />

                  {categories.map((cat) => {
                    const catSubs = subcategories.filter(sub => sub.categoryId === cat.id);
                    return (
                      <div key={cat.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <Link
                          to={`/shop?category=${cat.id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "var(--text-main)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}
                        >
                          <div style={{
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            background: "#f1f5f9",
                            border: "1px solid var(--border-color)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}>
                            <img
                              src={cat.image || cat.icon || getPlaceholderImage(60, 60, cat.name)}
                              alt={cat.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                          <span>{cat.name}</span>
                        </Link>
                        {catSubs.length > 0 && (
                          <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            paddingLeft: "12px",
                            borderLeft: "1px dashed var(--border-color)",
                            marginLeft: "4px",
                            marginTop: "2px"
                          }}>
                            {catSubs.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/shop?category=${cat.id}&subcategory=${sub.id}`}
                                onClick={() => setMobileMenuOpen(false)}
                                style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-muted)" }}
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              Wishlist {wishlistCount > 0 && <span style={{ fontSize: "14px", color: "var(--accent)", fontWeight: "800" }}>({wishlistCount})</span>}
            </Link>
            <a
              href="https://vistaraa-seller-one.vercel.app/login"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              Seller Portal
            </a>
            {user && <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>}
            {user && <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>My Profile</Link>}
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
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--primary);
          border-radius: 99px;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-link:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }
        .nav-link.active {
          color: var(--primary);
        }
        .nav-link.active::after {
          transform: scaleX(1);
          transform-origin: left;
        }
        .dropdown-item {
          transition: all 0.2s ease;
        }
        .dropdown-item:hover {
          background: var(--primary-glow);
          color: var(--primary) !important;
          transform: translateX(4px);
        }
        .mega-menu-card {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 960px;
          max-width: 95vw;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: 24px;
          box-shadow: var(--shadow-lg);
          padding: 24px 32px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 8px;
          animation: fadeInUpShort 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        [data-theme='dark'] .mega-menu-card {
          background: #11121a;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .mega-menu-shop-all {
          transition: opacity 0.2s ease;
        }
        .mega-menu-shop-all:hover {
          opacity: 0.8;
        }
        .mega-menu-cat-title {
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .mega-menu-cat-title:hover {
          color: var(--primary) !important;
          border-color: var(--primary) !important;
        }
        .mega-menu-sub-link {
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .mega-menu-sub-link:hover {
          color: var(--primary) !important;
          transform: translateX(3px);
        }
        @keyframes fadeInUpShort {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes fadeInLeftShort {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeInUpProfile {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dropdown-item {
          transition: all 0.2s ease;
        }
        .dropdown-item:hover {
          background: var(--border-color) !important;
          padding-left: 26px !important;
          color: var(--primary) !important;
        }
        .dropdown-signout-btn:hover {
          background: rgba(239, 68, 68, 0.15) !important;
          transform: scale(0.98);
        }
        .nav-action-btn:hover {
          color: var(--primary) !important;
          transform: translateY(-2px);
        }
        @media (max-width: 992px) {
          .seller-text {
            display: none !important;
          }
          .nav-seller-btn {
            padding: 8px !important;
          }
        }
        @media (max-width: 768px) {
          .desktop-menu, .desktop-search {
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
