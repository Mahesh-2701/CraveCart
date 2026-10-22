import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast, ToastContainer } from "react-toastify";
import api from "../config/api";
import CartCard from "../components/CartCard";
import AIChatWidget from "../components/AIChatWidget";

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Address and payment state
  const [address, setAddress] = useState(localStorage.getItem("address") || "");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const userId = localStorage.getItem("id");

  const loadCart = () => {
    if (!userId) return;
    api
      .get(`/user/cartdisplay/${userId}`)
      .then((res) => {
        setCartItems(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load cart.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCart();

    // Fetch active coupons
    api
      .get("/coupons")
      .then((res) => setAvailableCoupons(res.data))
      .catch(() => {});
  }, []);

  const removeitem = (id) => {
    api
      .delete(`/user/cartdelete/${id}`)
      .then((res) => {
        toast.success(res.data.message);
        loadCart();
      })
      .catch((err) => toast.error(err.response?.data?.message || "Error removing item"));
  };

  const handlequantityupdate = (id, newquantity) => {
    const updateditems = cartItems.map((item) =>
      item._id === id ? { ...item, quantity: newquantity } : item
    );
    setCartItems(updateditems);
  };

  const subtotal = cartItems.reduce(
    (total, item) => total + (item.price || item.menuid?.price || 0) * (item.quantity || 1),
    0
  );

  const deliveryFee = 60;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  // Apply Coupon
  const handleApplyCoupon = (codeToApply) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    api
      .post("/coupons/apply", { code, subtotal })
      .then((res) => {
        if (res.data.valid) {
          setAppliedCoupon(code);
          setDiscountAmount(res.data.discountAmount);
          toast.success(`Coupon ${code} applied! Saved ₹${res.data.discountAmount}`);
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Invalid coupon code");
      });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
  };

  // Dynamically load Razorpay SDK
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Place Order handler with Razorpay Test Mode integration
  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!address.trim()) {
      toast.error("Please enter a valid delivery address.");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsProcessingPayment(true);

    try {
      if (paymentMethod === "Online") {
        // 1. Initialize Razorpay Gateway Order
        const isScriptLoaded = await loadRazorpayScript();

        const gatewayOrderRes = await api.post("/payment/create-order", {
          items: cartItems.map((c) => ({
            menuid: c.menuid?._id || c.menuid,
            name: c.menuid?.name || "Dish",
            price: c.price,
            quantity: c.quantity || 1,
          })),
          couponCode: appliedCoupon,
        });

        const gatewayData = gatewayOrderRes.data;

        if (isScriptLoaded && window.Razorpay && !gatewayData.isMock) {
          const options = {
            key: gatewayData.keyId,
            amount: gatewayData.amount,
            currency: "INR",
            name: "CraveCart Food Delivery",
            description: `Payment for ${cartItems.length} items (Test Mode)`,
            order_id: gatewayData.orderId,
            prefill: {
              name: localStorage.getItem("name") || "Foodie",
              email: localStorage.getItem("email") || "foodie@cravecart.local",
            },
            theme: { color: "#FF5200" },
            handler: async function (response) {
              await completeOrderPlacement({
                paymentStatus: "Paid",
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
            },
            modal: {
              ondismiss: function () {
                setIsProcessingPayment(false);
                toast.info("Payment cancelled.");
              },
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // Sandbox test simulator fallback
          const confirmPayment = window.confirm(
            `[RAZORPAY TEST SANDBOX]\nSimulate successful payment of ₹${grandTotal}?\n(Click OK for Success, Cancel to abort)`
          );
          if (confirmPayment) {
            await completeOrderPlacement({
              paymentStatus: "Paid",
              razorpayOrderId: gatewayData.orderId,
              razorpayPaymentId: `pay_test_${Date.now()}`,
              razorpaySignature: "mock_signature_valid",
            });
          } else {
            setIsProcessingPayment(false);
          }
        }
      } else {
        // Cash on Delivery
        await completeOrderPlacement({ paymentStatus: "Pending" });
      }
    } catch (err) {
      setIsProcessingPayment(false);
      toast.error(err.response?.data?.message || "Checkout failed. Please try again.");
    }
  };

  const completeOrderPlacement = async (paymentDetails = {}) => {
    try {
      const orderPayload = {
        userid: userId,
        address: address,
        paymentmethod: paymentMethod,
        paymentStatus: paymentDetails.paymentStatus || "Pending",
        razorpayOrderId: paymentDetails.razorpayOrderId || null,
        razorpayPaymentId: paymentDetails.razorpayPaymentId || null,
        razorpaySignature: paymentDetails.razorpaySignature || null,
        couponCode: appliedCoupon,
        price: subtotal,
        quantity: 1,
        items: cartItems.map((c) => ({
          menuid: c.menuid?._id || c.menuid,
          name: c.menuid?.name,
          price: c.price,
          quantity: c.quantity || 1,
          restaurantid: c.menuid?.restaurantid?._id,
        })),
      };

      const orderRes = await api.post(`/user/order/${userId}`, orderPayload);

      // Verify payment with server if online
      if (paymentDetails.razorpayPaymentId) {
        await api.post("/payment/verify", {
          razorpayOrderId: paymentDetails.razorpayOrderId,
          razorpayPaymentId: paymentDetails.razorpayPaymentId,
          razorpaySignature: paymentDetails.razorpaySignature,
          orderId: orderRes.data.orderId,
        });
      }

      // Clear cart
      await api.delete(`/user/cartrefresh/${userId}`);
      setCartItems([]);
      setIsProcessingPayment(false);

      toast.success("Order Placed Successfully! Redirecting to live tracking...");
      setTimeout(() => {
        navigate(`/orders/track/${orderRes.data.orderId}`);
      }, 1200);
    } catch (err) {
      setIsProcessingPayment(false);
      toast.error(err.response?.data?.message || "Order completion error");
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />

      <div className="container my-4 flex-grow-1">
        <h3 className="mb-4 fw-bold d-flex align-items-center gap-2">
          <span>🛒</span> Review Your Cart & Checkout
        </h3>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2 text-muted">Loading your items...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 text-center py-5 p-4">
            <span style={{ fontSize: "54px" }}>🍽️</span>
            <h4 className="mt-3 fw-bold">Your cart is empty</h4>
            <p className="text-muted">Good food is always just a few clicks away!</p>
            <div>
              <button
                className="btn btn-primary-crave px-4 py-2 mt-2"
                onClick={() => navigate("/foods")}
              >
                Browse Menu
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {/* Cart Items List */}
            <div className="col-lg-7">
              <div className="card shadow-sm border-0 rounded-4 p-3 mb-4 bg-white">
                <h5 className="fw-bold mb-3">Order Items ({cartItems.length})</h5>
                <div className="d-flex flex-column gap-3">
                  {cartItems.map((item, index) => (
                    <CartCard
                      key={item._id || index}
                      item={item}
                      removeitem={removeitem}
                      handlequantityupdate={handlequantityupdate}
                    />
                  ))}
                </div>
              </div>

              {/* Delivery Address Form */}
              <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                <h5 className="fw-bold mb-3">📍 Delivery Address</h5>
                <textarea
                  className="form-control rounded-3"
                  rows="3"
                  placeholder="Enter complete delivery street address, house/flat number, landmarks..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Bill Summary & Payment */}
            <div className="col-lg-5">
              {/* Coupons Widget */}
              <div className="card shadow-sm border-0 rounded-4 p-3 mb-4 bg-white">
                <h6 className="fw-bold mb-2">🏷️ Apply Coupon</h6>
                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control text-uppercase font-monospace"
                    placeholder="Enter Coupon (e.g. WELCOME50)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={Boolean(appliedCoupon)}
                  />
                  {appliedCoupon ? (
                    <button className="btn btn-outline-danger" onClick={handleRemoveCoupon}>
                      Remove
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApplyCoupon()}
                      disabled={!couponCode.trim()}
                    >
                      Apply
                    </button>
                  )}
                </div>

                {/* Available Coupon Chips */}
                {availableCoupons.length > 0 && !appliedCoupon && (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {availableCoupons.map((c) => (
                      <span
                        key={c.code}
                        className="badge bg-light text-primary border p-2 cursor-pointer"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleApplyCoupon(c.code)}
                      >
                        ⚡ {c.code} ({c.discountValue}% OFF)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bill Details */}
              <div className="card shadow-sm border-0 rounded-4 p-4 bg-white mb-4">
                <h5 className="fw-bold mb-3">Bill Details</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Item Subtotal</span>
                  <span className="fw-semibold">₹{subtotal}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Delivery Charges</span>
                  <span className="fw-semibold">₹{deliveryFee}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Coupon Discount ({appliedCoupon})</span>
                    <span className="fw-bold">-₹{discountAmount}</span>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fs-5 fw-bold">To Pay</span>
                  <span className="fs-4 fw-bold text-primary">₹{grandTotal}</span>
                </div>

                {/* Payment Selection */}
                <h6 className="fw-bold mb-2">Choose Payment Option</h6>
                <div className="form-check p-3 border rounded-3 mb-2 d-flex align-items-center gap-2">
                  <input
                    className="form-check-input ms-0"
                    type="radio"
                    name="paymentMethod"
                    id="onlinePay"
                    value="Online"
                    checked={paymentMethod === "Online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label w-100" htmlFor="onlinePay">
                    <strong>Razorpay Checkout (UPI, Cards, Net Banking)</strong>
                    <span className="badge bg-success ms-2">Test Mode Active</span>
                  </label>
                </div>
                <div className="form-check p-3 border rounded-3 mb-4 d-flex align-items-center gap-2">
                  <input
                    className="form-check-input ms-0"
                    type="radio"
                    name="paymentMethod"
                    id="codPay"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label className="form-check-label w-100" htmlFor="codPay">
                    <strong>Cash on Delivery (COD)</strong>
                  </label>
                </div>

                <button
                  className="btn btn-primary-crave w-100 py-3 fs-5"
                  onClick={handleCheckout}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing Order...
                    </span>
                  ) : (
                    `Pay ₹${grandTotal} & Place Order`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AIChatWidget />
      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </div>
  );
}
