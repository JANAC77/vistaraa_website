import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { auth, db } from "../firebase";
import { collection, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { ShieldCheck, Truck, CreditCard, ArrowLeft, CheckCircle, MapPin } from "lucide-react";
import { getPlaceholderImage } from "../utils/placeholder";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || "https://vistaraa-server.vercel.app";

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowItem = location.state?.buyNowItem;

  const checkoutItems = buyNowItem ? [buyNowItem] : cart;
  const checkoutTotal = buyNowItem ? (buyNowItem.salePrice * buyNowItem.quantity) : cartTotal;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("Prepaid"); // "Prepaid" or "COD"
  const [loading, setLoading] = useState(false);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [shippingCharges, setShippingCharges] = useState(null); // null means not calculated
  const [shippingError, setShippingError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    // Redirect to auth if not logged in
    const user = auth.currentUser;
    if (!user) {
      navigate("/auth?redirect=checkout");
      return;
    }

    // Autofill user details if available
    setFormData(prev => ({
      ...prev,
      name: user.displayName || "",
      email: user.email || ""
    }));

    // Fetch extra details from Firestore to autofill shipping address
    const fetchProfileDetails = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setFormData(prev => ({
            ...prev,
            name: user.displayName || data.name || prev.name,
            phone: data.phone || prev.phone,
            address: data.address || prev.address,
            city: data.city || prev.city,
            state: data.state || prev.state,
            pincode: data.pincode || prev.pincode
          }));
        }
      } catch (err) {
        console.error("Error fetching profile details for checkout:", err);
      }
    };
    fetchProfileDetails();
  }, [navigate]);

  if (checkoutItems.length === 0 && !orderPlaced) {
    return (
      <div style={{ paddingTop: "140px", paddingBottom: "100px", textAlign: "center" }}>
        <h2>Your Checkout is Empty</h2>
        <button onClick={() => navigate("/shop")} className="btn btn-primary" style={{ marginTop: "16px" }}>Back to Shop</button>
      </div>
    );
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "pincode") {
      setShippingCharges(null);
      setShippingError("");
    }
  };

  // 1. PINCODE SHIPPING API CALCULATION
  const handleVerifyPincode = async (targetMethod = paymentMethod, targetPincode = formData.pincode) => {
    const pincode = targetPincode;
    if (!pincode || pincode.length < 6) {
      setShippingError("Please enter a valid 6-digit pincode.");
      return;
    }

    setCheckingPincode(true);
    setShippingError("");

    // Calculate total weight of cart items (0.5kg default per item)
    const totalWeight = checkoutItems.reduce((acc, curr) => acc + (0.5 * curr.quantity), 0);

    try {
      // API call to backend shipping calculation endpoint
      const response = await fetch(`${BACKEND_API_URL}/api/shipping-charges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_JWT_SECRET || "006eb537ffea3dafe0e3a16233c449a1e20510e8f3404b1a456f53cf6ca7f371"}`
        },
        body: JSON.stringify({
          delivery_pincode: pincode,
          weight: totalWeight,
          cod: targetMethod === "COD",
          pickup_pincode: "583227"
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Parse Shiprocket courier response to get average shipping rates
        if (data.data?.available_courier_companies?.length > 0) {
          const rates = data.data.available_courier_companies.map(c => Number(c.rate));
          const avgRate = Math.min(...rates); // Select cheapest rate
          setShippingCharges(Math.round(avgRate));
        } else {
          // If pincode is not serviceable by Shiprocket
          setShippingError("Pincode is not serviceable. Defaulting to standard shipping.");
          setShippingCharges(targetMethod === "COD" ? 130 : 80); // Fallback shipping charge
        }
      } else {
        throw new Error("API Offline or Pincode verification failed.");
      }
    } catch (error) {
      console.warn("Pincode API failed. Fallback to standard shipping:", error);
      // Fallback calculation: standard rate
      setShippingCharges(targetMethod === "COD" ? 130 : 80);
    } finally {
      setCheckingPincode(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (formData.pincode && formData.pincode.length === 6) {
      handleVerifyPincode(method);
    } else {
      setShippingCharges(null);
      setShippingError("");
    }
  };

  // 1.1 GEOLOCATION & REVERSE GEOCODING API
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

            // Automatically verify shipping charges if 6-digit pincode is fetched
            if (postcode && postcode.length === 6) {
              handleVerifyPincode(paymentMethod, postcode);
            }
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

  // Load Razorpay Script Helper
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Helper to save order details to Firestore and sync to backend API
  const saveOrderDetails = async (orderId, paymentId = "COD", paymentStatus = "COD") => {
    const { name, phone, email, address, city, state, pincode } = formData;
    const finalAmount = checkoutTotal + shippingCharges;
    const user = auth.currentUser;

    const newOrderRef = doc(collection(db, "users", user.uid, "orders"), orderId);

    const totalQuantity = checkoutItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);

    const orderData = {
      // Legacy website compatibility fields
      id: orderId,
      order_id: orderId,
      user_id: user.uid,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      address: address,
      city: city,
      state: state,
      pinCode: pincode,
      totalAmount: Number(finalAmount) || 0.0,
      shippingCharges: Number(shippingCharges) || 0.0,
      paymentId: paymentId,
      status: paymentStatus,
      orderStatus: "placed",
      shiprocketStatus: "NEW",
      createdAt: serverTimestamp(),
      orderDate: serverTimestamp(),

      // Mobile app (Flutter Dart OrderModel) compatibility fields
      orderId: orderId,
      userId: user.uid,
      quantity: totalQuantity,
      phoneNumber: parseInt(phone.replace(/\D/g, ""), 10) || 0,
      latitude: 0.0,
      longitude: 0.0,
      deliveryCharges: Number(shippingCharges) || 0.0,
      paymentMethod: paymentMethod, // "Prepaid" or "COD"

      // Products mapping compatible with OrderProductModel
      products: checkoutItems.map(item => ({
        // Legacy website properties
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0.0,
        salePrice: Number(item.salePrice || item.price) || 0.0,
        sku: item.sku || "",
        variantSize: item.variantSize || null,
        image: item.image || null,
        quantity: Number(item.quantity) || 1,

        // Dart model properties
        productid: item.id,
        images: item.image ? [item.image] : []
      }))
    };

    // 1. Write order to user's Firestore orders collection
    await setDoc(newOrderRef, orderData);

    // 2. Try to sync order with backend / Shiprocket API flow
    try {
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const d = new Date();
      const orderDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

      await fetch(`${BACKEND_API_URL}/api/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_JWT_SECRET || "006eb537ffea3dafe0e3a16233c449a1e20510e8f3404b1a456f53cf6ca7f371"}`
        },
        body: JSON.stringify({
          order_id: orderId,
          user_id: user.uid,
          order_date: orderDateStr,
          pickup_location: "warehouse",
          billing_customer_name: firstName,
          billing_last_name: lastName,
          billing_address: address,
          billing_city: city,
          billing_pincode: Number(pincode) || pincode,
          billing_state: state,
          billing_country: "India",
          billing_email: email.trim().length > 0 ? email : "customer@example.com",
          billing_phone: phone,
          shipping_is_billing: true,
          order_items: checkoutItems.map(item => ({
            name: item.name,
            sku: item.sku || item.id,
            units: item.quantity,
            selling_price: item.salePrice
          })),
          payment_method: paymentStatus === "COD" ? "COD" : "Prepaid",
          sub_total: checkoutTotal,
          length: 10,
          breadth: 10,
          height: 10,
          weight: 0.5
        })
      });
    } catch (syncError) {
      console.warn("Could not sync with Shiprocket API immediately. Admin will sync manually.", syncError);
    }

    // 3. Complete checkout states
    setPlacedOrderId(orderId);
    setOrderPlaced(true);
    if (!buyNowItem) {
      clearCart();
    }
  };

  // 2. CHECKOUT & ORDER CREATION FLOW
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const { name, phone, email, address, city, state, pincode } = formData;

    if (!name || !phone || !email || !address || !city || !state || !pincode) {
      alert("Please fill in all shipping details.");
      return;
    }

    if (shippingCharges === null) {
      alert("Please verify your pincode to calculate shipping fees before checkout.");
      return;
    }

    setLoading(true);
    const finalAmount = checkoutTotal + shippingCharges;
    const orderId = `VIST-${Date.now()}`;

    if (paymentMethod === "COD") {
      try {
        await saveOrderDetails(orderId, "COD", "COD");
      } catch (dbError) {
        console.error("Firestore Order Saving Failed:", dbError);
        alert("Order placement failed. Please try again or contact support.");
      } finally {
        setLoading(false);
      }
    } else {
      // Load Razorpay SDK
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert("Failed to load Razorpay payment gateway. Please check your internet connection.");
        setLoading(false);
        return;
      }

      // Razorpay checkout modal configurations
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Razorpay Key ID from environment
        amount: finalAmount * 100, // Razorpay expects paise (₹1 = 100 paise)
        currency: "INR",
        name: "Vistaraa Retail",
        description: "Order Placement Checkout",
        image: "/logo.png",
        handler: async function (response) {
          // Payment successful callback execution
          try {
            await saveOrderDetails(orderId, response.razorpay_payment_id, "Prepaid");
          } catch (dbError) {
            console.error("Firestore Order Saving Failed:", dbError);
            alert("Order payment succeeded but saving to database failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        notes: {
          address: address
        },
        theme: {
          color: "#6366f1"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert("Payment failed: " + response.error.description);
        setLoading(false);
      });
      rzp.open();
    }
  };

  // 3. ORDER PLACED SUCCESS INTERFACE
  if (orderPlaced) {
    return (
      <div style={{ paddingTop: "140px", paddingBottom: "100px", minHeight: "80vh", display: "flex", alignItems: "center" }}>
        <div className="container" style={{ display: "flex", justifyContent: "center" }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "540px", padding: "40px", textAlign: "center", background: "var(--bg-card)" }}>
            <div style={{ color: "var(--success)", marginBottom: "20px", display: "inline-block" }}>
              <CheckCircle size={64} />
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>Order Placed!</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
              {paymentMethod === "COD"
                ? "Thank you for shopping with Vistaraa. Your cash on delivery order has been registered and is being processed."
                : "Thank you for shopping with Vistaraa. Your payment was processed successfully."}
            </p>
            <div style={{ background: "var(--bg-app)", padding: "16px", borderRadius: "16px", border: "1px solid var(--border-color)", textAlign: "left", fontSize: "14px", marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--text-muted)" }}>Order Reference</span>
                <span style={{ fontWeight: "700" }}>{placedOrderId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--text-muted)" }}>Delivery Address</span>
                <span style={{ fontWeight: "700", textAlign: "right", maxWidth: "200px" }}>{formData.address}, {formData.city}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Payment Method</span>
                <span style={{ fontWeight: "700" }}>
                  {paymentMethod === "COD" ? "Cash on Delivery" : "Razorpay Prepaid"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <button onClick={() => navigate("/dashboard")} className="btn btn-primary" style={{ flexGrow: 1 }}>
                Track Order
              </button>
              <button onClick={() => navigate("/shop")} className="btn btn-secondary" style={{ flexGrow: 1 }}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <div className="container">

        {/* Back Link */}
        <button onClick={() => navigate("/cart")} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "32px", border: "none", background: "none", cursor: "pointer" }}>
          <ArrowLeft size={16} /> Return to Cart
        </button>

        <h1 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "32px" }}>Checkout</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "40px", alignItems: "start" }} className="checkout-layout-grid">
          {/* Left: Shipping Form */}
          <div className="glass-card" style={{ padding: "32px", background: "var(--bg-card)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>Shipping Details</h3>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="btn btn-secondary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  minHeight: "auto",
                  border: "1px solid var(--border-color)",
                  cursor: "pointer",
                  background: "transparent",
                  color: "var(--text)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.color = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.color = "var(--text)";
                }}
              >
                <MapPin size={15} />
                {detectingLocation ? "Detecting Location..." : "Use Current Location"}
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="form-row-2">
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Full Name" className="form-input" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="10-digit Phone" className="form-input" />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="email@address.com" className="form-input" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Delivery Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} required placeholder="Street address, building, suite" className="form-input" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 150px", gap: "20px" }} className="form-row-3">
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} required placeholder="City" className="form-input" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} required placeholder="State" className="form-input" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Pincode</label>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} required placeholder="6-digit Pincode" className="form-input" maxLength="6" />
                </div>
              </div>

              {/* Pincode checking action */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => handleVerifyPincode()}
                  disabled={checkingPincode || formData.pincode.length < 6}
                  className="btn btn-secondary"
                  style={{ minWidth: "160px" }}
                >
                  {checkingPincode ? "Calculating..." : "Verify Pincode"}
                </button>

                <div style={{ fontSize: "13px" }}>
                  {shippingCharges !== null && (
                    <span style={{ color: "var(--success)", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle size={16} /> Shipping Rate: ₹{shippingCharges}
                    </span>
                  )}
                  {shippingError && (
                    <span style={{ color: "var(--warning)", fontWeight: "600" }}>{shippingError}</span>
                  )}
                  {shippingCharges === null && !shippingError && (
                    <span style={{ color: "var(--text-muted)" }}>Verify pincode for shipping rate calculation.</span>
                  )}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "24px", marginTop: "10px" }}>
                <h4 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "16px" }}>Payment Method</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-row-2">

                  {/* Prepaid Card */}
                  <div
                    onClick={() => handlePaymentMethodChange("Prepaid")}
                    style={{
                      border: paymentMethod === "Prepaid" ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                      background: paymentMethod === "Prepaid" ? "var(--primary-glow)" : "transparent",
                      borderRadius: "16px",
                      padding: "20px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <CreditCard size={20} style={{ color: paymentMethod === "Prepaid" ? "var(--primary)" : "var(--text-muted)" }} />
                        <span style={{ fontWeight: "700", fontSize: "15px" }}>Prepay Online</span>
                      </div>
                      <div style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        border: paymentMethod === "Prepaid" ? "5px solid var(--primary)" : "2px solid var(--border-color)",
                        background: "var(--bg-card)",
                        transition: "all 0.2s ease"
                      }} />
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: "1.4" }}>
                      Pay securely using cards, UPI, net banking, or wallets via Razorpay.
                    </p>
                  </div>

                  {/* COD Card */}
                  <div
                    onClick={() => handlePaymentMethodChange("COD")}
                    style={{
                      border: paymentMethod === "COD" ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                      background: paymentMethod === "COD" ? "var(--primary-glow)" : "transparent",
                      borderRadius: "16px",
                      padding: "20px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Truck size={20} style={{ color: paymentMethod === "COD" ? "var(--primary)" : "var(--text-muted)" }} />
                        <span style={{ fontWeight: "700", fontSize: "15px" }}>Cash on Delivery</span>
                      </div>
                      <div style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        border: paymentMethod === "COD" ? "5px solid var(--primary)" : "2px solid var(--border-color)",
                        background: "var(--bg-card)",
                        transition: "all 0.2s ease"
                      }} />
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: "1.4" }}>
                      Pay in Cash or UPI on delivery. ₹50 additional shipping fees apply for COD orders.
                    </p>
                  </div>

                </div>
              </div>

            </form>
          </div>

          {/* Right: Checkout Pricing Panel */}
          <aside className="glass-card" style={{ padding: "28px", background: "var(--bg-card)" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              Billing Summary
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Items Subtotal</span>
                <span style={{ fontWeight: "700" }}>₹{checkoutTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Shipping Fee</span>
                <span style={{ fontWeight: "700" }}>
                  {shippingCharges !== null ? `₹${shippingCharges}` : "Verify Pincode"}
                </span>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "8px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "800" }}>
                <span>Final Amount</span>
                <span style={{ color: "var(--primary)" }}>
                  ₹{(checkoutTotal + (shippingCharges || 0)).toLocaleString()}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "12px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px", margin: "8px 0" }}>
                <ShieldCheck size={18} style={{ color: "var(--success)" }} />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {paymentMethod === "COD"
                    ? "Order checkout configuration: Cash on Delivery"
                    : "Secure Prepaid checkout using Razorpay"}
                </span>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading || shippingCharges === null}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  fontSize: "16px",
                  background: shippingCharges === null ? "var(--border-color)" : undefined,
                  cursor: shippingCharges === null ? "not-allowed" : "pointer"
                }}
              >
                {loading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                    <div className="animate-spin" style={{ width: "16px", height: "16px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }}></div>
                    <span>{paymentMethod === "COD" ? "Placing Order..." : "Processing Payment..."}</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                    {paymentMethod === "COD" ? <Truck size={18} /> : <CreditCard size={18} />}
                    <span>{paymentMethod === "COD" ? "Place COD Order" : "Pay with Razorpay"}</span>
                  </div>
                )}
              </button>
            </div>
          </aside>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .checkout-layout-grid {
            grid-template-columns: 1fr !important;
          }
          .form-row-2, .form-row-3 {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
