import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Mail, Lock, User, ArrowRight, ShieldAlert } from "lucide-react";
import Logo from "../components/Logo";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { name, email, password, confirmPassword } = formData;

    if (!email || !password) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Proactively check and create Firestore user document if it doesn't exist
        // to ensure they show up in the Admin Panel and Mobile App
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            id: user.uid,
            userName: user.displayName || email.split("@")[0],
            email: email,
            status: "active",
            createdAt: serverTimestamp()
          }, { merge: true });
        }
      } else {
        // Register
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Update user profile name
        await updateProfile(user, {
          displayName: name
        });
        // Save user details to Firestore 'users' collection so they show up in the Admin Panel and Mobile App
        await setDoc(doc(db, "users", user.uid), {
          id: user.uid,
          userName: name,
          email: email,
          status: "active",
          createdAt: serverTimestamp()
        }, { merge: true });
      }
      // Redirect on success
      navigate(redirect);
    } catch (err) {
      console.error("Authentication failed:", err);
      let errMsg = "Authentication failed. Please check your credentials.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "This email address is already in use.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Password is too weak. Must be at least 6 characters.";
      } else if (err.code === "auth/invalid-credential") {
        errMsg = "Invalid email or password.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save or update user details in firestore 'users' collection to align with mobile app & admin panel
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          userName: user.displayName || user.email.split("@")[0],
          email: user.email,
          status: "active",
          createdAt: serverTimestamp()
        }, { merge: true });
      } else {
        await setDoc(userDocRef, {
          userName: user.displayName || userDocSnap.data().userName,
          email: user.email
        }, { merge: true });
      }

      navigate(redirect);
    } catch (err) {
      console.error("Google Sign-In failed:", err);
      setError("Google Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: "140px", paddingBottom: "100px", minHeight: "90vh", display: "flex", alignItems: "center" }}>
      <div className="container" style={{ display: "flex", justifyContent: "center" }}>

        <div className="glass-card" style={{
          width: "100%",
          maxWidth: "460px",
          padding: "40px",
          background: "var(--bg-card)"
        }}>
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <Logo size={50} />
          </div>

          {/* Form Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              {isLogin ? "Sign in to access your Vistaraa account" : "Register to track orders and save details"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--error)",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "24px"
            }}>
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Name field (Register only) */}
            {!isLogin && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Full Name</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                    className="form-input"
                    style={{ paddingLeft: "44px" }}
                    disabled={loading}
                  />
                  <User size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@domain.com"
                  required
                  className="form-input"
                  style={{ paddingLeft: "44px" }}
                  disabled={loading}
                />
                <Mail size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  required
                  className="form-input"
                  style={{ paddingLeft: "44px" }}
                  disabled={loading}
                />
                <Lock size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    required
                    className="form-input"
                    style={{ paddingLeft: "44px" }}
                    disabled={loading}
                  />
                  <Lock size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: "14px",
                borderRadius: "16px",
                fontSize: "15px",
                marginTop: "12px",
                width: "100%"
              }}
            >
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <div className="animate-spin" style={{ width: "16px", height: "16px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }}></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                  <span>{isLogin ? "Sign In" : "Register"}</span>
                  <ArrowRight size={16} />
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", margin: "24px 0", gap: "10px" }}>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border-color)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>OR</span>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border-color)" }} />
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="btn btn-secondary"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "16px",
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              background: "transparent",
              border: "1px solid var(--border-color)",
              color: "var(--text)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.background = "var(--primary-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-color)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: "2px" }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Toggle link */}
          <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--text-muted)" }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              style={{
                background: "none",
                border: "none",
                color: "var(--primary)",
                fontWeight: "700",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              {isLogin ? "Create one" : "Sign In"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
