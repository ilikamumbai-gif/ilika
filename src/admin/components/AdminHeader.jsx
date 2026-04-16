import React, { useState } from "react";
import { Menu, LogOut, User, ChevronDown, Bell } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";

const AdminHeader = ({ onMenuClick }) => {
  const [openProfile, setOpenProfile] = useState(false);
  const { logout, admin } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <header
      className="w-full h-[64px] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30"
      style={{ background: "#fff", borderBottom: "1px solid #EBEBEB" }}
    >
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs text-gray-400">Welcome back 👋</p>
          <p className="text-sm font-semibold text-gray-800 leading-tight">
            {admin?.username ? `@${admin.username}` : "Admin"}
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
          <Bell size={18} className="text-gray-500" />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenProfile(!openProfile)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}
            >
              {admin?.username?.[0]?.toUpperCase() || "A"}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {admin?.username || "Admin"}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {openProfile && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenProfile(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border z-20 overflow-hidden"
                style={{ border: "1px solid #EBEBEB" }}
              >
                <div className="px-4 py-3" style={{ borderBottom: "1px solid #F0F0F0" }}>
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{admin?.username || "Admin"}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
