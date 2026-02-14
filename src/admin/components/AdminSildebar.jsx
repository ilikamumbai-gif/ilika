import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const AdminSidebar = () => {
  const [open, setOpen] = useState(false);

  const linkClass =
    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition hover:bg-pink-50 hover:text-pink-600";

  const activeClass = "bg-pink-100 text-pink-700";

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      end
      onClick={() => setOpen(false)}
      className={({ isActive }) =>
        `${linkClass} ${isActive ? activeClass : ""}`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b bg-white sticky top-0 z-50">
        <h1 className="text-lg font-bold text-pink-600">ILIKA Admin</h1>
        <button onClick={() => setOpen(true)}>
          <Menu />
        </button>
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50
          w-64 bg-white border-r min-h-screen
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* HEADER */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <h1 className="text-xl font-bold text-pink-600">
            ILIKA <span className="text-gray-700">Admin</span>
          </h1>

          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>

        {/* NAV */}
        <nav className="p-4 space-y-1">
          <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/admin/products" icon={Package} label="Products" />
          <NavItem to="/admin/categories" icon={Layers} label="Categories" />
          <NavItem to="/admin/orders" icon={ShoppingCart} label="Orders" />
          <NavItem to="/admin/users" icon={Users} label="Users" />
        </nav>

        {/* FOOTER */}
      
      </aside>
    </>
  );
};

export default AdminSidebar;
