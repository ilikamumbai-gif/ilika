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

    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users`
        );
        const users = await res.json();

        const loggedUser = users.find(
          (u) => u.uid === currentUser.uid
        );

        if (loggedUser) {
          setUser({
            name: loggedUser.name || "",
            email: loggedUser.email || "",
            phone: loggedUser.phone || "",
            address: loggedUser.address || "",
            orders: loggedUser.orders || 0,
            joined: loggedUser.createdAt
              ? new Date(
                  loggedUser.createdAt._seconds * 1000
                ).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              : "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
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
  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);

    console.log("Updated User:", user);
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
                    <Stat title="Orders" value={user.orders} />
                    <Stat title="Wishlist" value="3" />
                    <Stat title="Addresses" value="1" />
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
