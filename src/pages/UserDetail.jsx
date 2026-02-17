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
  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    joined: "",
  });

  /* Redirect if not logged in */
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  /* Fetch User + Address + Orders */
  useEffect(() => {
    if (!currentUser) return;

    const fetchAllData = async () => {
      try {
        /* USER PROFILE */
        const userRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
        const users = await userRes.json();
        const loggedUser = users.find(u => u.uid === currentUser.uid);

        if (loggedUser) {
          setUser({
            ...loggedUser,
            joined: loggedUser.createdAt?._seconds
              ? new Date(loggedUser.createdAt._seconds * 1000).toLocaleDateString()
              : "",
          });
        }

        /* ADDRESSES */
        const addrRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}/address`
        );
        setAddresses(await addrRes.json());

        /* USER ORDERS */
        const orderRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}/orders`
        );
        const orderData = await orderRes.json();

        const formattedOrders = orderData.map(o => ({
          ...o,
          date: o.createdAt?._seconds
            ? new Date(o.createdAt._seconds * 1000).toLocaleDateString()
            : new Date(o.createdAt).toLocaleDateString(),
        }));

        setOrders(formattedOrders);

      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchAllData();
  }, [currentUser]);

  /* Profile Update */
  const handleSave = async (e) => {
    e.preventDefault();

    await fetch(`${import.meta.env.VITE_API_URL}/api/users/${currentUser.uid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });

    setIsEditing(false);
  };

  /* Logout */
  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
                <div className="secondary-bg-color rounded-2xl p-6 text-center">

                  <div className="w-24 h-24 mx-auto rounded-full bg-[#E7A6A1] flex items-center justify-center text-3xl font-semibold">
                    {user.name?.charAt(0) || "U"}
                  </div>

                  <h3 className="mt-4 text-lg font-semibold">{user.name}</h3>
                  <p className="text-sm">{user.email}</p>
                  <p className="text-sm">{user.phone}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Member since {user.joined}
                  </p>

                  {!isEditing && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-5 w-full bg-[#E7A6A1] py-2 rounded-md text-sm"
                      >
                        Edit Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="mt-3 w-full border py-2 rounded-md text-sm"
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT SECTION */}
              <div className="lg:col-span-2">

                {!isEditing ? (
                  <div className="space-y-6">

                    {/* ADDRESS */}
                    <div className="border rounded-xl p-5">
                      <h4 className="font-semibold mb-2">Shipping Address</h4>
                      <p className="text-sm">{user.address || "No address saved"}</p>
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-2 gap-4">
                      <Stat title="Orders" value={orders.length} />
                      <Stat title="Addresses" value={addresses.length} />
                    </div>





                    <Link
                      to="/"
                      className="inline-block bg-black text-white px-6 py-2 rounded-md text-sm"
                    >
                      Browse Products
                    </Link>

                  </div>


                ) : (
                  <form onSubmit={handleSave} className="border rounded-2xl p-6 space-y-4">
                    <Input label="Full Name" name="name" value={user.name} onChange={e => setUser({ ...user, name: e.target.value })} />
                    <Input label="Email" name="email" value={user.email} onChange={e => setUser({ ...user, email: e.target.value })} />
                    <Input label="Phone" name="phone" value={user.phone} onChange={e => setUser({ ...user, phone: e.target.value })} />

                    <textarea
                      value={user.address}
                      onChange={e => setUser({ ...user, address: e.target.value })}
                      className="w-full border rounded-md p-2"
                    />

                    <button className="bg-[#E7A6A1] px-6 py-2 rounded-md text-sm">
                      Save Changes
                    </button>
                  </form>
                )}

              </div>
            </div>
            {/* ================= ORDERS ================= */}
            <Heading heading="Your Order"/>
            <div className="space-y-4 ">
              {orders.map((order) => {

                const statusColor =
                  order.status === "Delivered"
                    ? "bg-green-100 text-green-700"
                    : order.status === "Cancelled"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-700";

                const formattedDate = new Date(order.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <div
                    key={order.id}
                    className="border rounded-xl p-4 flex flex-col gap-4 hover:shadow-md transition"
                  >

                    {/* TOP ROW */}
                    <div className="flex justify-between items-start flex-wrap gap-3">

                      <div>
                        <p className="font-medium text-sm">
                          Order #{order.id.slice(-6)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Placed on {formattedDate}
                        </p>
                      </div>

                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${statusColor}`}>
                        {order.status || "Processing"}
                      </span>

                    </div>

                    {/* PRODUCTS PREVIEW */}
                    {order.items && (
                      <div className="flex items-center gap-3 overflow-x-auto pb-1">

                        {order.items.slice(0, 4).map((item, i) => (
                          <img
                            key={i}
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 object-cover rounded-lg border"
                          />
                        ))}

                        {order.items.length > 4 && (
                          <div className="w-14 h-14 flex items-center justify-center text-xs bg-gray-100 rounded-lg border">
                            +{order.items.length - 4}
                          </div>
                        )}

                      </div>
                    )}

                    {/* BOTTOM ROW */}
                    <div className="flex justify-between items-center">

                      <p className="text-xs text-gray-500">
                        {order.items?.length || 1} item(s)
                      </p>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="font-semibold text-[#1C371C] text-lg">
                          ₹{order.totalAmount}
                        </p>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

/* Reusable components */
const Stat = ({ title, value }) => (
  <div className="border rounded-xl p-4 text-center">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-xl font-semibold">{value}</p>
  </div>
);

const Input = ({ label, ...props }) => (
  <div>
    <label className="text-sm font-medium">{label}</label>
    <input {...props} className="w-full border rounded-md p-2 text-sm" />
  </div>
);

export default UserDetail;
