import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, getDocs, doc, setDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Package, RotateCcw, Clock, CheckCircle, ShieldAlert, X, IndianRupee, Camera, Eye } from "lucide-react";
import { getPlaceholderImage } from "../utils/placeholder";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Return Request Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnReason, setReturnReason] = useState("Damaged Product");
  const [comments, setComments] = useState("");
  const [bankDetails, setBankDetails] = useState({
    name: "",
    accNo: "",
    bankName: "",
    ifsc: ""
  });
  const [imageLink, setImageLink] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/auth");
        return;
      }
      setUser(currentUser);
      await fetchOrders(currentUser.uid);
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchOrders = async (uid) => {
    try {
      setLoading(true);
      const ordersRef = collection(db, "users", uid, "orders");
      // Fallback query without orderBy if index is not ready
      let snap;
      try {
        snap = await getDocs(query(ordersRef, orderBy("createdAt", "desc")));
      } catch (err) {
        console.warn("Index not ready yet, falling back to unordered fetch:", err);
        snap = await getDocs(ordersRef);
      }

      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort manually as fallback
      data.sort((a, b) => {
        const tA = a.createdAt ? (a.createdAt.seconds ? a.createdAt.seconds * 1000 : Number(a.createdAt)) : 0;
        const tB = b.createdAt ? (b.createdAt.seconds ? b.createdAt.seconds * 1000 : Number(b.createdAt)) : 0;
        return tB - tA;
      });

      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkReturnEligibility = (order) => {
    if (order.orderStatus === "return_requested" || order.status === "return_requested" || order.status === "REFUNDED" || order.status === "RETURN_APPROVED") {
      return false;
    }

    // Check 7 day limit since creation
    const orderTime = order.createdAt ? (order.createdAt.seconds ? order.createdAt.seconds * 1000 : Number(order.createdAt)) : Date.now();
    const diffDays = Math.ceil((Date.now() - orderTime) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const handleReturnInputChange = (e) => {
    setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!bankDetails.name || !bankDetails.accNo || !bankDetails.bankName || !bankDetails.ifsc) {
      alert("Please fill in all refund bank account details.");
      return;
    }

    setSubmittingReturn(true);

    try {
      const returnRequestRef = doc(db, "users", user.uid, "return_requests", selectedOrder.id);

      const returnData = {
        orderId: selectedOrder.id,
        reason: returnReason,
        manualReason: comments,
        bankDetails: {
          name: bankDetails.name,
          accNo: bankDetails.accNo,
          bankName: bankDetails.bankName,
          ifsc: bankDetails.ifsc
        },
        images: imageLink ? [imageLink] : [getPlaceholderImage(400, 400, "Customer Proof")],
        status: "pending",
        totalAmount: selectedOrder.totalAmount,
        createdAt: serverTimestamp()
      };

      // 1. Write return request to users/{userId}/return_requests/{orderId}
      await setDoc(returnRequestRef, returnData);

      // 2. Update order status in user orders collection
      const orderRef = doc(db, "users", user.uid, "orders", selectedOrder.id);
      await updateDoc(orderRef, {
        orderStatus: "return_requested",
        status: "RETURN_REQUESTED"
      });

      alert("Return request submitted successfully. Our admin team will inspect the proof details.");
      setSelectedOrder(null);

      // Clear inputs
      setReturnReason("Damaged Product");
      setComments("");
      setBankDetails({ name: "", accNo: "", bankName: "", ifsc: "" });
      setImageLink("");

      // Refresh order list
      await fetchOrders(user.uid);
    } catch (error) {
      console.error("Return submission failed:", error);
      alert("Failed to submit return request. Please try again.");
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div style={{ paddingTop: "120px", paddingBottom: "80px", minHeight: "90vh" }}>
      <div className="container">

        {/* User Info Welcome Banner */}
        <div className="glass-card" style={{ padding: "32px", marginBottom: "40px", background: "var(--bg-card)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800" }}>Hello, {user?.displayName || user?.email?.split("@")[0]}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Manage your account, view shipments, and process refunds.</p>
          </div>
          <div style={{ padding: "10px 20px", borderRadius: "14px", border: "1px solid var(--border-color)", fontSize: "13px", fontWeight: "600", color: "var(--text-muted)" }}>
            Registered email: <span style={{ color: "var(--text-main)", fontWeight: "700" }}>{user?.email}</span>
          </div>
        </div>

        <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "24px" }}>Your Order History</h2>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="shimmer" style={{ height: "180px", borderRadius: "24px" }}></div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {orders.map((order) => {
              const dateObj = order.createdAt?.seconds
                ? new Date(order.createdAt.seconds * 1000)
                : (order.createdAt ? new Date(order.createdAt) : new Date());

              const isEligibleForReturn = checkReturnEligibility(order);

              return (
                <div key={order.id} className="glass-card" style={{ padding: "28px", background: "var(--bg-card)", display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Order Header Summary */}
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "var(--text-muted)" }}>Order Reference</span>
                        <p style={{ fontWeight: "700", fontSize: "14px" }}>{order.id}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "var(--text-muted)" }}>Date Placed</span>
                        <p style={{ fontWeight: "700", fontSize: "14px" }}>{dateObj.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "var(--text-muted)" }}>Total Paid</span>
                        <p style={{ fontWeight: "800", fontSize: "14px", color: "var(--primary)" }}>₹{Number(order.totalAmount).toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <span className={`badge ${order.status === "REFUNDED" ? "badge-out" :
                          (order.status === "RETURN_APPROVED" ? "badge-new" :
                            (order.orderStatus === "return_requested" ? "badge-sale" : "badge-new"))
                        }`} style={{ fontSize: "11px", padding: "6px 12px", borderRadius: "8px" }}>
                        {order.status || order.orderStatus || "Placed"}
                      </span>
                    </div>
                  </div>

                  {/* Order Products List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {order.products?.map((prod, i) => (
                      <div key={i} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <div style={{ width: "60px", height: "60px", borderRadius: "10px", overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
                          {/* Image lookup from cart items placeholder or static */}
                          <img src={prod.image || getPlaceholderImage(100, 100, "Vistaraa")} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div style={{ flexGrow: 1 }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "700" }}>{prod.name}</h4>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            Quantity: {prod.quantity} {prod.variantSize && `| Size: ${prod.variantSize}`}
                          </span>
                        </div>
                        <span style={{ fontWeight: "700", fontSize: "14px" }}>₹{Number(prod.salePrice || prod.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions & Shipping Details Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-color)", fontSize: "13px" }}>
                    <div style={{ color: "var(--text-muted)" }}>
                      Shipment Destination: <span style={{ color: "var(--text-main)", fontWeight: "600" }}>{order.address}, {order.city} - {order.pinCode || order.pincode}</span>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                      {isEligibleForReturn ? (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="btn btn-secondary"
                          style={{
                            padding: "8px 18px",
                            borderRadius: "10px",
                            fontSize: "12px",
                            color: "var(--accent)",
                            borderColor: "rgba(244, 63, 94, 0.2)"
                          }}
                        >
                          <RotateCcw size={14} /> Request Return
                        </button>
                      ) : order.orderStatus === "return_requested" ? (
                        <span style={{ color: "var(--warning)", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={14} /> Return Under Review
                        </span>
                      ) : order.status === "REFUNDED" ? (
                        <span style={{ color: "var(--success)", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle size={14} /> Refund Disbursed
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "60px 40px",
            background: "var(--bg-card)",
            borderRadius: "24px",
            border: "1px solid var(--border-color)"
          }}>
            <Package size={44} style={{ color: "var(--text-muted)", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: "700" }}>No Orders Found</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>You have not placed any orders yet. Visit our shop to browse premium collections.</p>
            <button onClick={() => navigate("/shop")} className="btn btn-primary" style={{ marginTop: "16px" }}>Go to Shop</button>
          </div>
        )}
      </div>

      {/* RETURN REQUEST POPUP MODAL */}
      {selectedOrder && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div className="glass-card" style={{
            width: "100%",
            maxWidth: "600px",
            background: "var(--bg-card)",
            padding: "32px",
            maxHeight: "90vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: "800" }}>Request Return</h3>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Order Reference: #{selectedOrder.id}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Return Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                    outline: "none"
                  }}
                >
                  <option value="Damaged Product">Damaged Product / Broken Box</option>
                  <option value="Wrong Item Delivered">Wrong Item / Size Delivered</option>
                  <option value="Defective / Quality issues">Defective / Poor Quality issues</option>
                  <option value="Item not as described">Item not matching descriptions</option>
                  <option value="Other">Other / Size exchange request</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Detailed Comments</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Explain the issue details..."
                  rows="3"
                  className="form-input"
                  style={{ resize: "none" }}
                  required
                />
              </div>

              {/* Photo Proof */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>Image URL Proof (Required)</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="url"
                    value={imageLink}
                    onChange={(e) => setImageLink(e.target.value)}
                    placeholder="https://example.com/damaged-item.jpg"
                    required
                    className="form-input"
                    style={{ paddingLeft: "44px" }}
                  />
                  <Camera size={16} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Please upload the photo to an image hoster (e.g. Imgur, Postimages) and paste the URL here.</span>
              </div>

              {/* Bank Account Details */}
              <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "18px", padding: "20px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--success)", fontWeight: "700", fontSize: "14px", marginBottom: "16px" }}>
                  <IndianRupee size={18} />
                  <span>Refund Bank Account Details</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>Beneficiary Holder Name</label>
                    <input type="text" name="name" value={bankDetails.name} onChange={handleReturnInputChange} required placeholder="Account Holder" className="form-input" style={{ padding: "10px 14px", fontSize: "13px" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>Account Number</label>
                    <input type="text" name="accNo" value={bankDetails.accNo} onChange={handleReturnInputChange} required placeholder="Account Number" className="form-input" style={{ padding: "10px 14px", fontSize: "13px" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>Bank Name</label>
                    <input type="text" name="bankName" value={bankDetails.bankName} onChange={handleReturnInputChange} required placeholder="e.g. HDFC Bank" className="form-input" style={{ padding: "10px 14px", fontSize: "13px" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>IFSC Code</label>
                    <input type="text" name="ifsc" value={bankDetails.ifsc} onChange={handleReturnInputChange} required placeholder="e.g. HDFC0001234" className="form-input" style={{ padding: "10px 14px", fontSize: "13px" }} />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "16px", marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <button type="button" onClick={() => setSelectedOrder(null)} className="btn btn-secondary" style={{ flexGrow: 1 }} disabled={submittingReturn}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="btn btn-primary"
                  style={{ flexGrow: 1 }}
                >
                  {submittingReturn ? "Submitting..." : "Submit Request"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
