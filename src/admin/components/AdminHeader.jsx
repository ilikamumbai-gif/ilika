import React, { useState } from "react";
import { Menu, Bell, ChevronDown, LogOut, User } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";

const AdminHeader = ({ onMenuClick }) => {
  const [openProfile, setOpenProfile] = useState(false);
   const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <header className="w-full h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">

      {/* LEFT: MENU + TITLE */}
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Toggle */}
        <button
          className="lg:hidden p-2 rounded hover:bg-gray-100"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-lg font-semibold text-gray-800">
          Admin Panel
        </h1>
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex items-center gap-4">

        {/* Notifications */}
        <button className="relative p-2 rounded hover:bg-gray-100">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* PROFILE */}
        <div className="relative">
          <button
            onClick={() => setOpenProfile(!openProfile)}
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>

            <span className="hidden sm:block text-sm font-medium text-gray-700">
              Admin
            </span>

            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          {/* DROPDOWN */}
          {openProfile && (
            <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-50">
              <button className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100">
                Profile
              </button>
               <button
        onClick={handleLogout}
        className="text-sm bg-red-500 text-white px-3 py-1 rounded"
      >
        Logout
      </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default AdminHeader;
