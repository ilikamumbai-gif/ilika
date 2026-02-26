import React, { useState, useEffect } from "react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartProvider";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  /* ---------------- ADDRESS SYSTEM ---------------- */

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    pincode: "",
    city: "",
    state: "",
    addressLine: "",
  });

  const handleChange = (e) =>
    setAddress({ ...address, [e.target.name]: e.target.value });

  /* ---------------- FETCH USER ADDRESSES ---------------- */

  useEffect(() => {
    if (!currentUser) return;

    const fetchAddresses = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/users/${currentUser.uid}/address`
        );
        const data = await res.json();
        setAddresses(data);
      } catch (err) {
        console.error("Address fetch failed:", err);
      }
    };

    fetchAddresses();
  }, [currentUser]);

  /* ---------------- SAVE ADDRESS ---------------- */

  const saveAddress = async () => {
    if (!currentUser) {
      alert("Login required");
      return;
    }

    if (!address.name || !address.phone || !address.addressLine) {
      alert("Fill complete address");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/users/${currentUser.uid}/address`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(address),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newAddress = { id: data.id, ...address };

      setAddresses((prev) => [...prev, newAddress]);
      setSelectedAddressId(data.id);
      setShowForm(false);

      setAddress({
        name: "",
        phone: "",
        pincode: "",
        city: "",
        state: "",
        addressLine: "",
      });

    } catch (err) {
      console.error("Save address error:", err);
      alert("Failed to save address");
    }
  };

  /* ---------------- PAYMENT ---------------- */

  const [paymentMethod, setPaymentMethod] = useState("COD");

  /* ---------------- CALCULATIONS ---------------- */

  const subtotal = cartItems.reduce(
    (acc, item) => acc + Number(item.price) * Number(item.quantity),
    0
  );



  const total = subtotal;

  /* ---------------- PLACE ORDER ---------------- */

  const handlePlaceOrder = async () => {
    if (!currentUser) {
      alert("Login required");
      navigate("/login");
      return;
    }

    if (!selectedAddressId) {
      alert("Please select address");
      return;
    }

    // ⭐⭐⭐ MOVE HERE (VERY IMPORTANT)
    const source = localStorage.getItem("traffic_source") || "WEBSITE";

    if (window.fbq && total > 0 && !isNaN(total)) {
      window.fbq("track", "Purchase", {
        value: parseFloat(total.toFixed(2)),
        currency: "INR",
      });
    }

    try {
      /* =========================
         COD FLOW (UNCHANGED)
      ========================= */

      if (paymentMethod === "COD") {
        const res = await fetch(`${API_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.uid,
            userEmail: currentUser.email,
            items: cartItems,
            totalAmount: total,
            shippingAddressId: selectedAddressId,
            paymentMethod: "COD",
            source: source
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        clearCart();
        navigate(`/order-success/${data.orderId}`);
        return;
      }

      /* =========================
         ONLINE PAYMENT FLOW
      ========================= */

      // 1️⃣ Create Razorpay order
      const orderRes = await fetch(
        `${API_URL}/api/payments/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: total }),
        }
      );

      const razorpayOrder = await orderRes.json();
      if (!orderRes.ok) throw new Error(razorpayOrder.error);

      // 2️⃣ Open Razorpay popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        name: "Ilika",
        description: "Order Payment",
        handler: async function (response) {
          try {
            // 1️⃣ Verify payment
            const verifyRes = await fetch(
              `${API_URL}/api/payments/verify`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderData: {
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    items: cartItems,
                    totalAmount: total,
                    shippingAddressId: selectedAddressId,
                    source: source
                  },
                }),
              }
            );

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error);

            /* ==============================
               ✅ FACEBOOK PIXEL PURCHASE EVENT
            ============================== */
            if (window.fbq) {
              window.fbq("track", "Purchase", {
                value: total,
                currency: "INR",
              });
            }

            // 2️⃣ Clear cart
            clearCart();

            // 3️⃣ Redirect to success page
            navigate(`/order-success/${verifyData.orderId}`);

          } catch (err) {
            console.error("Verification error:", err);
            alert("Payment verification failed");
          }
        },
        theme: { color: "#000000" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Order error:", err);
      alert("Failed to process order");
    }
  };

  /* ---------------- EMPTY CART ---------------- */

  if (!cartItems.length)
    return (
      <>
        <MiniDivider />
        <Header />
        <CartDrawer />
        <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
          Your cart is empty
        </div>
        <Footer />
      </>
    );

  return (
    <>
      <MiniDivider />
      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">

          {/* LEFT SIDE */}
          <div className="space-y-6">

            <Heading heading="Select Address" />

            {addresses.map(addr => (
              <label key={addr.id} className="block border rounded-xl p-4 cursor-pointer hover:border-black">
                <input
                  type="radio"
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="mr-2"
                />
                <span className="font-medium">{addr.name}</span>
                <p className="text-sm text-gray-600">{addr.addressLine}</p>
                <p className="text-sm text-gray-600">
                  {addr.city}, {addr.state} - {addr.pincode}
                </p>
                <p className="text-sm text-gray-600">{addr.phone}</p>
              </label>
            ))}

            <button
              onClick={() => setShowForm(!showForm)}
              className="text-black underline"
            >
              + Add New Address
            </button>

            {showForm && (
              <div className="grid sm:grid-cols-2 gap-4 border p-4 rounded-xl">
                <input name="name" placeholder="Full Name" className="border p-3 rounded-lg" onChange={handleChange} />
                <input name="phone" placeholder="Phone Number" className="border p-3 rounded-lg" onChange={handleChange} />
                <input name="pincode" placeholder="Pincode" className="border p-3 rounded-lg" onChange={handleChange} />
                <input name="city" placeholder="City" className="border p-3 rounded-lg" onChange={handleChange} />
                <input name="state" placeholder="State" className="border p-3 rounded-lg sm:col-span-2" onChange={handleChange} />
                <textarea name="addressLine" placeholder="Full Address" rows="3" className="border p-3 rounded-lg sm:col-span-2" onChange={handleChange} />
                <button onClick={saveAddress} className="bg-black text-white py-2 rounded-lg sm:col-span-2">
                  Save Address
                </button>
              </div>
            )}

            {/* PAYMENT METHOD */}
            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-semibold mb-3">Payment Method</h3>

              <label className="flex items-center gap-2 text-sm mb-2">
                <input
                  type="radio"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                Cash on Delivery
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                />
                Pay Online
              </label>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="bg-white border rounded-xl p-5 h-fit sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            {cartItems.map(item => (
              <div key={item.id} className="flex gap-3 border-b pb-3">
                <img
                  src={item.images || item.imageUrl}
                  className="w-16 h-16 rounded-md object-cover"
                />
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="font-medium text-sm">
                  ₹{Number(item.price) * Number(item.quantity)}
                </div>
              </div>
            ))}

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="text-green-900">Free</span></div>

              <hr />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="mt-6 w-full bg-black text-white py-3 rounded-xl hover:bg-gray-900 transition"
            >
              Continue to Payment
            </button>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
};

export default Checkout;
