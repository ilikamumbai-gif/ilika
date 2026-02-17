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

  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newAddress, setNewAddress] = useState("");
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    orders: 0,
    joined: "",
  });

  /* ===============================
     REDIRECT IF NOT LOGGED IN
  ================================ */
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  /* ===============================
     FETCH LOGGED IN USER FROM DB
  ================================ */
  useEffect(() => {
    if (!currentUser) return;

    const fetchAllData = async () => {
      try {
        // PROFILE
        const userRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
        const users = await userRes.json();

        const loggedUser = users.find(u => u.uid === currentUser.uid);
        if (loggedUser) setUser(loggedUser);

        // ADDRESSES
        const addrRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}/address`
        );
        const addrData = await addrRes.json();
        setAddresses(addrData);

        // ORDERS
        const orderRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/orders/${currentUser.uid}`
        );
        const orderData = await   orderRes.json();
        setOrders(orderData);

      } catch (err) {
        console.error(err);
      }
    };

    fetchAllData();
  }, [currentUser]);


  /* ===============================
     HANDLE INPUT CHANGE
  ================================ */
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  /* ===============================
     SAVE EDIT (UI ONLY)
  ================================ */
  const handleSave = async (e) => {
    e.preventDefault();

    await fetch(`${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });

    setIsEditing(false);
  };
  const addAddress = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}/address`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newAddress })
      }
    );

    const data = await res.json();
    setAddresses(prev => [{ id: data.id, text: newAddress }, ...prev]);
    setNewAddress("");
  };
  const updateAddress = async (id, text) => {
    await fetch(
      `${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}/address/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      }
    );

    setAddresses(prev =>
      prev.map(a => a.id === id ? { ...a, text } : a)
    );

    setEditingAddressId(null);
  };


  /* ===============================
     LOGOUT
  ================================ */
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <MiniDivider />

      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        <section className="primary-bg-color">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Heading heading="My Account" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* LEFT CARD */}
              <div className="self-start">
                <div className="secondary-bg-color rounded-2xl p-6 text-center min-[h-380]">
                  <div className="w-24 h-24 mx-auto rounded-full bg-[#E7A6A1] flex items-center justify-center text-3xl font-semibold">
                    {user.name?.charAt(0) || "U"}
                  </div>

                  <h3 className="mt-4 text-lg font-semibold heading-color">
                    {user.name}
                  </h3>
                  <p className="text-sm content-text">{user.email}</p>
                  <p className="text-sm content-text">{user.phone}</p>

                  <p className="text-xs text-gray-500 mt-2">
                    Member since {user.joined}
                  </p>

                  {!isEditing && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-5 w-full bg-[#E7A6A1] py-2 rounded-md text-sm font-medium hover:bg-[#dd8f8a] transition"
                      >
                        Edit Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="mt-3 w-full border border-black py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition"
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT SECTION */}
              <div className="lg:col-span-2">

                {/* VIEW MODE */}
                {!isEditing && (
                  <div className="space-y-6">
                    <div className="border rounded-xl p-5">
                      <h4 className="font-semibold heading-color mb-2">
                        Shipping Address
                      </h4>
                      <p className="text-sm content-text leading-relaxed">
                        {user.address}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Stat title="Orders" value={orders.length} />

                     
                      <Stat title="Addresses" value={user.address.length} />
                    </div>
                    <div className="border rounded-xl p-5">
                      <h4 className="font-semibold mb-3">My Orders</h4>

                      {orders.length === 0 && <p>No orders yet</p>}

                      {orders.map(order => (
                        <div key={order.id} className="border-b py-3">
                          <p className="text-sm font-medium">
                            Order #{order.id.slice(-6)}
                          </p>
                          <p className="text-sm">₹ {order.totalAmount}</p>
                          <p className="text-xs text-gray-500">{order.status}</p>
                        </div>
                      ))}
                    </div>


                    <div className="pt-6">
                      <Link
                        to="/"
                        className="w-full sm:w-auto bg-black text-white px-6 py-2 rounded-md text-sm hover:opacity-90 transition"
                      >
                        Browse Products
                      </Link>
                    </div>
                  </div>
                )}

                {/* EDIT MODE */}
                {isEditing && (
                  <form
                    onSubmit={handleSave}
                    className="border rounded-2xl p-6 space-y-4"
                  >
                    <h4 className="text-lg font-semibold heading-color mb-4">
                      Edit Profile
                    </h4>

                    <Input
                      label="Full Name"
                      name="name"
                      value={user.name}
                      onChange={handleChange}
                    />

                    <Input
                      label="Email"
                      name="email"
                      value={user.email}
                      onChange={handleChange}
                    />

                    <Input
                      label="Phone"
                      name="phone"
                      value={user.phone}
                      onChange={handleChange}
                    />

                    <div>
                      <label className="text-sm font-medium">
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={user.address}
                        onChange={handleChange}
                        rows="3"
                        className="w-full mt-1 border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                      <button
                        type="submit"
                        className="bg-[#E7A6A1] px-6 py-2 rounded-md text-sm font-medium hover:bg-[#dd8f8a] transition"
                      >
                        Save Changes
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="border px-6 py-2 rounded-md text-sm hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
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

/* 🔹 Small Reusable Components */

const Stat = ({ title, value }) => (
  <div className="border rounded-xl p-4 text-center">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-xl font-semibold heading-color">{value}</p>
  </div>
);

const Input = ({ label, ...props }) => (
  <div>
    <label className="text-sm font-medium">{label}</label>
    <input
      {...props}
      className="w-full mt-1 border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
    />
  </div>
);

export default UserDetail;
