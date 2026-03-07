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

      
    </header>
  );
};

export default AdminHeader;
