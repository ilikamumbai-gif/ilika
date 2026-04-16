import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Package, Layers, ShoppingCart, Users,
  X, Gift, Star, ClipboardList, Logs, MessageSquare,
  ShieldIcon, FileText, BookOpen, ChevronRight
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/admin",             icon: LayoutDashboard, label: "Dashboard"      },
    ]
  },
  {
    label: "Catalogue",
    items: [
      { to: "/admin/products",    icon: Package,         label: "Products"       },
      { to: "/admin/combos",      icon: Gift,            label: "Combos"         },
      { to: "/admin/categories",  icon: Layers,          label: "Categories"     },
    ]
  },
  {
    label: "Sales",
    items: [
      { to: "/admin/orders",      icon: ClipboardList,   label: "Orders"         },
      { to: "/admin/cart-products",icon: ShoppingCart,   label: "Cart Interest"  },
    ]
  },
  {
    label: "Community",
    items: [
      { to: "/admin/users",       icon: Users,           label: "Users"          },
      { to: "/admin/reviews",     icon: Star,            label: "Reviews"        },
      { to: "/admin/blogs",       icon: BookOpen,        label: "Blogs"          },
      { to: "/admin/blog-comments",icon: MessageSquare,  label: "Blog Comments"  },
    ]
  },
  {
    label: "System",
    items: [
      { to: "/admin/reports",     icon: FileText,        label: "Reports"        },
      { to: "/admin/admins",      icon: ShieldIcon,      label: "Manage Admins"  },
      { to: "/admin/log",         icon: Logs,            label: "Activity Log"   },
    ]
  },
];

const AdminSidebar = ({ open, onClose }) => {
  return (
    <>
      {/* OVERLAY */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen
          w-[260px] flex flex-col overflow-hidden
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        style={{ background: "#fff", borderRight: "1px solid #222" }}
      >
        {/* LOGO */}
        <div className="flex items-center justify-between px-6 h-[64px] shrink-0" style={{ borderBottom: "1px solid #222" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}>
              <span className="text-white font-black text-xs">IL</span>
            </div>
            <div>
              <p className="text-black font-bold text-sm tracking-wide leading-none">ILIKA</p>
              <p className="text-xs leading-none mt-0.5" style={{ color: "#666" }}>Admin Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded" style={{ color: "#666" }}>
            <X size={18} />
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#555" }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/admin"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                      ${isActive
                        ? "text-white"
                        : "text-gray-600 hover:text-black hover:bg-black/5"
                      }`
                    }
                    style={({ isActive }) => isActive ? { background: "linear-gradient(135deg,rgba(233,30,140),rgba(255,107,53))", color: "#fff" } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} />
                      <span>{label}</span>
                    </div>
                    <ChevronRight size={13} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* FOOTER */}
        <div className="px-5 py-4 shrink-0" style={{ borderTop: "1px solid #222" }}>
          <p className="text-xs" style={{ color: "#444" }}>© 2025 Ilika Beauty</p>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
