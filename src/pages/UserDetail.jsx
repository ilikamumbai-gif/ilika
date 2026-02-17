import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import CartDrawer from "../components/CartDrawer";

const UserDetail = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    joined: "",
  });

  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);

  /* ---------------- REDIRECT ---------------- */
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser]);

  /* ---------------- FETCH USER ---------------- */
  useEffect(() => {
    if (!currentUser) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}`);
        const data = await res.json();

        setUser({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          joined: data.createdAt
            ? new Date(data.createdAt._seconds * 1000).toLocaleDateString()
            : "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [currentUser]);

  /* ---------------- FETCH ORDERS ---------------- */
  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}/orders`
        );
        const data = await res.json();

        setOrders(data);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }
    };

    fetchOrders();
  }, [currentUser]);

  /* ---------------- SAVE ADDRESS ---------------- */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          phone: user.phone,
          address: user.address,
        }),
      });

      alert("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) return <p className="p-10 text-center">Loading...</p>;

  return (
    <>
      <MiniDivider />
      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        <section className="max-w-5xl mx-auto px-4 py-8">
          <Heading heading="My Account" />

          <div className="grid lg:grid-cols-3 gap-8">

            {/* LEFT PROFILE */}
            <div className="border rounded-xl p-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-pink-300 flex items-center justify-center text-2xl font-bold">
                {user.name?.charAt(0) || "U"}
              </div>

              <h3 className="mt-3 font-semibold">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-500">{user.phone}</p>

              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 w-full bg-black text-white py-2 rounded-md"
              >
                Edit Profile
              </button>

              <button
                onClick={handleLogout}
                className="mt-2 w-full border py-2 rounded-md"
              >
                Logout
              </button>
            </div>

            {/* RIGHT CONTENT */}
            <div className="lg:col-span-2 space-y-6">

              {/* ADDRESS */}
              <div className="border rounded-xl p-5">
                <h4 className="font-semibold mb-2">Shipping Address</h4>
                <p className="text-sm text-gray-600">
                  {user.address || "No address saved"}
                </p>
              </div>

              {/* ORDER COUNT */}
              <div className="border rounded-xl p-5">
                <h4 className="font-semibold">Total Orders</h4>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>

              {/* ORDER HISTORY */}
              <div className="border rounded-xl p-5">
                <h4 className="font-semibold mb-4">Order History</h4>

                {orders.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    You haven't placed any orders yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt._seconds * 1000).toLocaleDateString()}
                            </p>
                          </div>

                          <span className="text-xs px-2 py-1 bg-yellow-100 rounded-full">
                            {order.status}
                          </span>
                        </div>

                        <div className="mt-2 text-sm">
                          {order.items.slice(0, 2).map((i, idx) => (
                            <p key={idx}>{i.name} × {i.quantity}</p>
                          ))}
                        </div>

                        <div className="mt-2 font-semibold">
                          ₹{order.totalAmount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default UserDetail;
