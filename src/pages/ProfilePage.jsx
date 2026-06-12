import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile, signOut } from "firebase/auth";
import { User, Mail, Phone, MapPin, Building, Save, Check, ShoppingBag, Heart, LogOut, ArrowLeft, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/auth?redirect=profile");
        return;
      }
      setUser(currentUser);
      
      // Load user profile details from Firestore
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setFormData({
            name: currentUser.displayName || data.name || "",
            email: currentUser.email || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            pincode: data.pincode || ""
          });
        } else {
          // If no doc exists, fallback to auth data
          setFormData({
            name: currentUser.displayName || "",
            email: currentUser.email || "",
            phone: "",
            address: "",
            city: "",
            state: "",
            pincode: ""
          });
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaveSuccess(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Name is required");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Update Firebase Auth Profile Name
      if (user.displayName !== formData.name) {
        await updateProfile(user, {
          displayName: formData.name
        });
      }

      // 2. Save detailed info to Firestore users collection
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        email: user.email,
        updatedAt: new Date()
      }, { merge: true });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to update profile details.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await signOut(auth);
        navigate("/");
      } catch (err) {
        console.error("Logout failed:", err);
      }
    }
  };

  const getUserInitials = () => {
    if (!formData.name) return "U";
    return formData.name
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ paddingTop: "140px", paddingBottom: "100px", minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <Loader2 className="animate-spin" size={40} style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: "600", color: "var(--text-muted)" }}>Loading profile details...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "120px", paddingBottom: "80px", minHeight: "90vh" }}>
      <div className="container">
        
        {/* Back Link */}
        <Link to="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "32px" }}>
          <ArrowLeft size={16} /> Back to Catalog
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "40px", alignItems: "start" }} className="profile-layout-grid">
          
          {/* Left: Avatar Card & Quick Navigation */}
          <div className="glass-card" style={{ padding: "32px", background: "var(--bg-card)", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
            {/* Avatar Circle with purple gradient ring */}
            <div style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px var(--primary-glow)",
              color: "white",
              fontSize: "36px",
              fontWeight: "900",
              border: "4px solid var(--bg-card)"
            }}>
              {getUserInitials()}
            </div>

            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "4px" }}>{formData.name || "Vistaraa User"}</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>{formData.email}</p>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", width: "100%", margin: 0 }} />

            {/* Quick Links Nav */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
              <Link to="/dashboard" style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "14px",
                color: "var(--text-main)",
                fontWeight: "600",
                background: "var(--bg-app)",
                transition: "all 0.2s"
              }} className="profile-nav-link">
                <ShoppingBag size={18} style={{ color: "var(--primary)" }} />
                <span>My Orders</span>
              </Link>

              <Link to="/wishlist" style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "14px",
                color: "var(--text-main)",
                fontWeight: "600",
                background: "var(--bg-app)",
                transition: "all 0.2s"
              }} className="profile-nav-link">
                <Heart size={18} style={{ color: "var(--accent)" }} />
                <span>My Wishlist</span>
              </Link>

              <button onClick={handleLogout} style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "14px",
                color: "var(--error)",
                fontWeight: "600",
                background: "rgba(239, 68, 68, 0.05)",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.2s"
              }} className="profile-nav-link">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Right: Form inputs and details */}
          <div className="glass-card" style={{ padding: "40px", background: "var(--bg-card)" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px" }}>Account Details</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "32px" }}>Update your default shipping details and account configurations.</p>

            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Row 1: Name and Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="profile-form-row">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Full Name</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                      style={{ paddingLeft: "44px" }}
                      placeholder="Your Name"
                    />
                    <User size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Email Address (Read Only)</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="form-input"
                      style={{ paddingLeft: "44px", background: "var(--bg-app)", cursor: "not-allowed" }}
                    />
                    <Mail size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  </div>
                </div>
              </div>

              {/* Row 2: Phone Number */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Phone Number</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ paddingLeft: "44px" }}
                    placeholder="+91 XXXXXXXXXX"
                  />
                  <Phone size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "8px 0" }} />

              {/* Shipping Address Header */}
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--primary)" }}>Default Shipping Address</h3>

              {/* Address Street field */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Street Address</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ paddingLeft: "44px" }}
                    placeholder="Apartment, Street Name, Landmark"
                  />
                  <MapPin size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                </div>
              </div>

              {/* Row 3: City, State, Pincode */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }} className="profile-form-address-row">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>City</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="form-input"
                      style={{ paddingLeft: "40px" }}
                      placeholder="City"
                    />
                    <Building size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="State"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    maxLength="6"
                    className="form-input"
                    placeholder="Pincode"
                  />
                </div>
              </div>

              {/* Save profile actions */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "16px", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ padding: "12px 30px", borderRadius: "16px" }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Saving Changes...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check size={16} />
                      <span>Saved successfully!</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Profile Details</span>
                    </>
                  )}
                </button>
                
                {saveSuccess && (
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--success)" }} className="fade-in">
                    Your account profile has been successfully saved to your record.
                  </span>
                )}
              </div>

            </form>
          </div>

        </div>

      </div>
      
      <style>{`
        .profile-nav-link:hover {
          background: var(--border-color) !important;
          transform: translateX(4px);
        }
        @media (max-width: 900px) {
          .profile-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
        @media (max-width: 600px) {
          .profile-form-row, .profile-form-address-row {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
