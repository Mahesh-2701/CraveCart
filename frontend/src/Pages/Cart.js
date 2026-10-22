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
      } else {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      }
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
        <div className="d-flex align-items-center gap-2 mb-4">
          <span className="badge rounded-circle bg-primary bg-opacity-10 text-primary p-2">
            <i className="bi bi-cart3 fs-5"></i>
          </span>
          <div>
            <h3 className="mb-0 fw-bold font-heading text-dark">Checkout & Review</h3>
            <small className="text-muted">Ensure your delivery details and items are correct</small>
          </div>
        </div>

        {loading ? (
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card shadow-xs border-0 rounded-4 p-4 bg-white">
                <div className="skeleton rounded-3 mb-3" style={{ height: "80px" }}></div>
                <div className="skeleton rounded-3 mb-3" style={{ height: "80px" }}></div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card shadow-xs border-0 rounded-4 p-4 bg-white">
                <div className="skeleton rounded-3 mb-3" style={{ height: "180px" }}></div>
              </div>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="card shadow-xs border-0 rounded-4 text-center py-5 p-4 bg-white my-4">
            <div className="mx-auto text-muted mb-3 p-3 bg-light rounded-circle" style={{ width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="bi bi-bag-x fs-1 text-primary"></i>
            </div>
            <h4 className="mt-2 fw-bold font-heading text-dark">Your cart is empty</h4>
            <p className="text-muted small mx-auto" style={{ maxWidth: "380px" }}>
              Explore our chef-curated selection of dishes and popular restaurants to fill your cart.
            </p>
            <div>
              <button
                className="btn btn-crave-primary px-4 py-2 mt-2"
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
              <div className="card shadow-xs border-0 rounded-4 p-4 mb-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold font-heading mb-0 text-dark">Order Items ({cartItems.length})</h5>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-primary text-decoration-none fw-semibold"
                    onClick={() => navigate("/foods")}
                  >
                    + Add More Items
                  </button>
                </div>
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
              <div className="card shadow-xs border-0 rounded-4 p-4 bg-white">
                <h5 className="fw-bold font-heading mb-3 d-flex align-items-center gap-2 text-dark">
                  <i className="bi bi-geo-alt text-danger"></i> Delivery Destination
                </h5>
                <textarea
                  className="crave-input rounded-3"
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
              <div className="card shadow-xs border-0 rounded-4 p-4 mb-4 bg-white">
                <h6 className="fw-bold font-heading mb-2 text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-ticket-perforated text-warning"></i> Offers & Coupons
                </h6>
                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control text-uppercase font-monospace border rounded-start-pill ps-3"
                    placeholder="Enter Coupon (e.g. WELCOME50)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={Boolean(appliedCoupon)}
                  />
                  {appliedCoupon ? (
                    <button
                      className="btn btn-outline-danger rounded-end-pill px-3"
                      onClick={handleRemoveCoupon}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      className="btn btn-crave-primary rounded-end-pill px-3"
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
                        className="badge bg-light text-primary border p-2 cursor-pointer rounded-pill d-inline-flex align-items-center gap-1"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleApplyCoupon(c.code)}
                      >
                        <i className="bi bi-lightning-charge-fill text-warning"></i> {c.code} ({c.discountValue}% OFF)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bill Details */}
              <div className="card shadow-xs border-0 rounded-4 p-4 bg-white mb-4">
                <h5 className="fw-bold font-heading mb-3 text-dark">Payment Breakdown</h5>
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
                <hr className="my-3" />
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fs-5 fw-bold font-heading text-dark">To Pay</span>
                  <span className="fs-3 fw-bold font-heading text-primary">₹{grandTotal}</span>
                </div>

                {/* Payment Selection */}
                <h6 className="fw-bold font-heading mb-2 text-dark">Select Payment Method</h6>
                <div
                  className={`p-3 border rounded-3 mb-2 d-flex align-items-center gap-3 transition-all cursor-pointer ${
                    paymentMethod === "Online" ? "border-primary bg-primary bg-opacity-10" : "bg-light"
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setPaymentMethod("Online")}
                >
                  <input
                    className="form-check-input ms-0 my-0"
                    type="radio"
                    name="paymentMethod"
                    id="onlinePay"
                    value="Online"
                    checked={paymentMethod === "Online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="flex-grow-1">
                    <div className="fw-bold font-heading text-dark d-flex align-items-center gap-2">
                      <i className="bi bi-credit-card-2-front text-primary"></i>
                      <span>Razorpay (UPI, Cards, NetBanking)</span>
                    </div>
                    <small className="text-muted">Instant checkout with real-time webhooks</small>
                  </div>
                </div>

                <div
                  className={`p-3 border rounded-3 mb-4 d-flex align-items-center gap-3 transition-all cursor-pointer ${
                    paymentMethod === "COD" ? "border-primary bg-primary bg-opacity-10" : "bg-light"
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setPaymentMethod("COD")}
                >
                  <input
                    className="form-check-input ms-0 my-0"
                    type="radio"
                    name="paymentMethod"
                    id="codPay"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="flex-grow-1">
                    <div className="fw-bold font-heading text-dark d-flex align-items-center gap-2">
                      <i className="bi bi-cash-stack text-success"></i>
                      <span>Cash on Delivery (COD)</span>
                    </div>
                    <small className="text-muted">Pay in cash upon doorstep arrival</small>
                  </div>
                </div>

                <button
                  className="btn btn-crave-primary w-100 py-3 fs-5 font-heading"
                  onClick={handleCheckout}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Securing Order...
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
