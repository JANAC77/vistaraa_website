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
  const [profilePic, setProfilePic] = useState("");
  const [uploadingPic, setUploadingPic] = useState(false);

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
            name: currentUser.displayName || data.userName || data.name || "",
            email: currentUser.email || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            pincode: data.pincode || ""
          });
          setProfilePic(data.profilePic || "");
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
          setProfilePic("");
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                "Accept-Language": "en"
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            const addressInfo = data.address || {};

            const postcode = (addressInfo.postcode || "").replace(/\s/g, "");
            const city = addressInfo.city || addressInfo.town || addressInfo.village || addressInfo.county || "";
            const state = addressInfo.state || "";

            const streetParts = [
              addressInfo.suburb,
              addressInfo.neighbourhood,
              addressInfo.road,
              addressInfo.house_number
            ].filter(Boolean);

            const constructedAddress = streetParts.reverse().join(", ") || addressInfo.display_name || "";

            setFormData(prev => ({
              ...prev,
              address: constructedAddress || prev.address,
              city: city || prev.city,
              state: state || prev.state,
              pincode: postcode || prev.pincode
            }));
          } else {
            throw new Error("Failed to retrieve location details.");
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          alert("Could not fetch address details automatically. Please fill in details manually.");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setDetectingLocation(false);
        let errorMsg = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location access was denied. Please enable location permissions in your browser settings.";
        }
        alert(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Max size is 5MB.");
      return;
    }

    setUploadingPic(true);
    const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || "https://vistaraa-server.vercel.app";

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch(`${BACKEND_API_URL}/api/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_JWT_SECRET || "006eb537ffea3dafe0e3a16233c449a1e20510e8f3404b1a456f53cf6ca7f371"}`
        },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          setProfilePic(data.url);
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, { profilePic: data.url }, { merge: true });
          alert("Profile picture uploaded and updated successfully!");
        } else {
          throw new Error("Invalid response format from server");
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to upload image to server.");
      }
    } catch (err) {
      console.error("Profile picture upload failed:", err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingPic(false);
    }
  };

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
        userName: formData.name,
        id: user.uid,
        profilePic: profilePic,
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
            {/* Avatar Circle with picture or initials and hover upload */}
            <div
              onClick={() => document.getElementById("profile-pic-input").click()}
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: profilePic ? "none" : "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 20px var(--primary-glow)",
                color: "white",
                fontSize: "36px",
                fontWeight: "900",
                border: "4px solid var(--bg-card)",
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
              }}
              className="avatar-container"
            >
              {uploadingPic ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "rgba(0,0,0,0.5)" }}>
                  <Loader2 className="animate-spin" size={24} style={{ color: "white" }} />
                </div>
              ) : profilePic ? (
                <>
                  <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div className="avatar-overlay" style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.4)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                    opacity: 0,
                    transition: "opacity 0.2s ease"
                  }}>
                    Change
                  </div>
                </>
              ) : (
                <>
                  {getUserInitials()}
                  <div className="avatar-overlay" style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.4)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                    opacity: 0,
                    transition: "opacity 0.2s ease"
                  }}>
                    Upload
                  </div>
                </>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              id="profile-pic-input"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleProfilePicUpload}
            />

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

              {/* Profile Picture Upload Field */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Profile Picture</label>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => document.getElementById("profile-pic-input").click()}
                    disabled={uploadingPic}
                    className="btn btn-secondary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 24px",
                      borderRadius: "14px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      minHeight: "auto",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-app)",
                      color: "var(--text-main)",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.background = "var(--primary-glow)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-color)";
                      e.currentTarget.style.background = "var(--bg-app)";
                    }}
                  >
                    {uploadingPic ? "Uploading image..." : "Upload New Photo"}
                  </button>
                  {profilePic ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", color: "var(--success)", fontWeight: "700" }}>
                        ✓ Photo Loaded
                      </span>
                      <a href={profilePic} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "600", textDecoration: "underline" }}>
                        View URL
                      </a>
                    </div>
                  ) : (
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      No profile picture uploaded
                    </span>
                  )}
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "8px 0" }} />

              {/* Shipping Address Header & Detect Location */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "12px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--primary)", margin: 0 }}>Default Shipping Address</h3>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="btn btn-secondary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    padding: "6px 14px",
                    borderRadius: "10px",
                    minHeight: "auto",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer",
                    background: "transparent",
                    color: "var(--text-main)",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.color = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.color = "var(--text-main)";
                  }}
                >
                  <MapPin size={14} />
                  {detectingLocation ? "Detecting..." : "Use Current Location"}
                </button>
              </div>

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
        .avatar-container:hover .avatar-overlay {
          opacity: 1 !important;
        }
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
