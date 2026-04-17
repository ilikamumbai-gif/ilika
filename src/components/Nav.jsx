import React, { useState, useEffect, useRef } from "react";
import { Search, ShoppingBag, User, ChevronDown, Sparkles, Droplets, Scissors, Wand2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartProvider";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug } from "../utils/slugify";
import { useCategories } from "../admin/context/CategoryContext";


const getMenuFromPath = (pathname = "") => {
  if (pathname.startsWith("/newarrival")) return "newarrival";
  if (pathname.startsWith("/skin")) return "skin";
  if (pathname.startsWith("/hair")) return "hair";
  if (pathname.startsWith("/grooming")) return "grooming";
  return null;
};

// ─────────────────────────────────────────────
// Shared SearchBar — used in both desktop nav
// and the standalone mobile header search slot
// ─────────────────────────────────────────────

export const SearchBar = ({ products = [], onClose, className = "" }) => {
  const [query, setQuery] = useState("");
  const searchRef = useRef();
  const navigate = useNavigate();

  // Filter across name + shortInfo + benefits (limit 6)
  const filtered =
    query.trim().length > 0
      ? products
        .filter((p) => {
          const haystack = [
            p.name,
            p.shortInfo,
            p.categoryName,
            Array.isArray(p.benefits)
              ? p.benefits.join(" ")
              : p.benefits || "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(query.toLowerCase());
        })
        .slice(0, 6)
      : [];

  // Highlight matched text
  const highlightText = (text = "") => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-200">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Enter → /products?q=…
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      navigate(`/products?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      onClose?.();
    }
  };

  // Outside click clears dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="flex items-center border rounded-md px-2 w-full">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search products..."
          className="outline-none px-2 py-2 text-sm w-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {query && (
        <div className="absolute left-0 right-0 bg-white shadow-xl border rounded-xl mt-2 max-h-80 overflow-y-auto z-50">
          {filtered.length ? (
            filtered.map((product) => (
              <Link
                key={product._id}
                to={`/product/${createSlug(product.name)}`}
                state={{ id: product._id }}
                onClick={() => {
                  setQuery("");
                  setTimeout(() => onClose?.(), 0);
                }}
                className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50"
              >
                <img
                  src={product.images?.[0] || product.imageUrl}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-md border shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {highlightText(product.name)}
                  </p>
                  {product.shortInfo && (
                    <p className="text-xs text-gray-400 truncate">
                      {highlightText(product.shortInfo)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 capitalize">
                    {product.categoryName}
                  </p>
                  <p className="text-sm font-semibold text-[#1C371C]">
                    ₹{product.price}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <>
              <p className="px-4 py-3 text-sm text-gray-500">
                No products found
              </p>
              <button
                onClick={() => {
                  navigate(`/products?q=${encodeURIComponent(query.trim())}`);
                  setQuery("");
                  onClose?.();
                }}
                className="w-full text-left px-4 py-2 text-sm text-[#E96A6A] font-medium hover:bg-gray-50 border-t"
              >
                Search all products for "{query}" →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Nav — renders links + icons
// On mobile this is the *drawer* content only
// (search is NOT included here for mobile)
// ─────────────────────────────────────────────
const Nav = ({ mobile, onClose, mobileIcons, mobileSearch }) => {
  const { openCart } = useCart();
  const menuRef = useRef();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(() => getMenuFromPath(location.pathname));
  const { products = [] } = useProducts();
  const { categories = [] } = useCategories();
  const timerRef = useRef(null);

  const newCategory = categories.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "") === "new"
  );

  const newArrivals = newCategory
    ? products
      .filter((p) => p.categoryIds?.includes(newCategory.id))
      .slice(0, 6)
    : [];

  const toggleMenu = (menu) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  useEffect(() => {
    setOpenMenu(getMenuFromPath(location.pathname));
  }, [location.pathname]);

  // Auto-close dropdown after 10 seconds
  useEffect(() => {
    if (openMenu) {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Set new timer to close after 10 seconds
      timerRef.current = setTimeout(() => {
        setOpenMenu(null);
      }, 5000);
    }

    // Cleanup timer on unmount or when openMenu changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [openMenu]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div
      ref={menuRef}
      className={`${mobile
        ? "w-full flex flex-col gap-4 py-3 px-3"
        : "flex items-center justify-between gap-6 xl:gap-10 w-full"
        } heading-2-color`}
    >
      {/* LINKS */}
      <nav
        className={`${mobile
          ? "flex flex-col gap-4 text-base w-full"
          : "flex items-center gap-5 lg:gap-7 text-sm lg:text-base whitespace-nowrap flex-1 min-w-0"
          }`}
      >
        <Link to="/" onClick={onClose} className="whitespace-nowrap">
          Home
        </Link>

        {/* OFFER */}
        <div className="relative inline-block group">
          <Link
            to="/combo"
            onClick={onClose}
            className="
              whitespace-nowrap font-semibold px-3 py-1 rounded-full
              bg-gradient-to-r from-[#ecaca7] via-[#E96A6A] to-[#D45A5A]
              text-white hover:shadow-lg
              transition-all duration-300
              animate-[pulse_2.5s_infinite]
            "
          >
            Offer
          </Link>
          <span
            className="
              absolute -top-2 -right-3 text-[9px] px-2 py-[2px]
              bg-[#E96A6A] text-white rounded-full shadow
              animate-bounce
            "
          >
            FREE
          </span>
        </div>

        {/* NEW ARRIVALS */}
        <div className="relative w-full group">
          <div className="flex items-center justify-between">
            <Link
              to="/newarrival"
              onClick={() => setOpenMenu("newarrival")}
              className="whitespace-nowrap"
            >
              New Arrivals
            </Link>
            <button
              type="button"
              onClick={() => toggleMenu("newarrival")}
              className="cursor-pointer"
              aria-label="Toggle New Arrivals menu"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${openMenu === "newarrival" ? "rotate-180" : ""
                  }`}
              />
            </button>
          </div>
          <div
            className={`${mobile
              ? openMenu === "newarrival"
                ? "block mt-2"
                : "hidden"
              : `absolute left-0 top-full mt-2 bg-white shadow-lg rounded-md min-w-[180px] z-50 ${openMenu === "newarrival" ? "block" : "hidden"
              }`
              }`}
          >
            {newArrivals.map((item, idx) => (
              <Link
                key={item._id || item.id || `${item.name}-${idx}`}
                to={`/product/${createSlug(item.name)}`}
                state={{ id: item._id }}
                onClick={() => setTimeout(() => onClose?.(), 0)}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100"
              >
                {/* PRODUCT IMAGE */}
                <img
                  src={item.images?.[0] || item.imageUrl}
                  alt={item.name}
                  className="w-10 h-10 object-cover rounded-md border"
                />

                {/* PRODUCT NAME */}
              <span className="font-medium truncate max-w-[240px]">
  {item.name}
</span>
              </Link>
            ))}
          </div>
        </div>

        {/* SKIN */}
        <div className="relative w-full group">
          <div className="flex items-center justify-between">
            <Link to="/skin" onClick={() => setOpenMenu("skin")} className="whitespace-nowrap">
              Skin Care
            </Link>
            <button
              type="button"
              onClick={() => toggleMenu("skin")}
              className="cursor-pointer"
              aria-label="Toggle Skin Care menu"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${openMenu === "skin" ? "rotate-180" : ""
                  }`}
              />
            </button>
          </div>
          <div
            className={`${mobile
              ? openMenu === "skin"
                ? "block mt-2"
                : "hidden"
              : `absolute left-0 top-full mt-2 bg-white shadow-lg rounded-md min-w-[180px] z-50 ${openMenu === "skin" ? "block" : "hidden"
              }`
              }`}
          >
            <Link
              to="/skin/face"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-100"
            >
              <Sparkles className="w-4 h-4 text-pink-500" />
              Face Care
            </Link>

            <Link
              to="/skin/body"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-100"
            >
              <Droplets className="w-4 h-4 text-blue-500" />
              Body Care
            </Link>
          </div>
        </div>

        {/* HAIR */}
        <div className="relative w-full group">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              toggleMenu("hair");
            }}
          >
            <Link to="/hair" onClick={onClose} className="whitespace-nowrap">
              Hair Care
            </Link>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${openMenu === "hair" ? "rotate-180" : ""
                }`}
            />
          </div>
          <div
            className={`${mobile
              ? openMenu === "hair"
                ? "block mt-2"
                : "hidden"
              : `absolute left-0 top-full mt-2 bg-white shadow-lg rounded-md min-w-[180px] z-50 ${openMenu === "hair" ? "block" : "hidden"
              }`
              }`}
          >
            <Link
              to="/hair/care"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-100"
            >
              <Scissors className="w-4 h-4 text-gray-600" />
              Hair Care
            </Link>

            <Link
              to="/hair/styling"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-100"
            >
              <Wand2 className="w-4 h-4 text-purple-500" />
              Hair Styling
            </Link>
          </div>
        </div>

        {/* GROOMING */}
        <div className="relative w-full group">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              toggleMenu("grooming");
            }}
          >
            <Link
              to="/grooming"
              onClick={onClose}
              className="whitespace-nowrap"
            >
              Grooming Tools
            </Link>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${openMenu === "grooming" ? "rotate-180" : ""
                }`}
            />
          </div>
          <div
            className={`${mobile
              ? openMenu === "grooming"
                ? "block mt-2"
                : "hidden"
              : `absolute left-0 top-full mt-2 bg-white shadow-lg rounded-md min-w-[180px] z-50 ${openMenu === "grooming" ? "block" : "hidden"
              }`
              }`}
          >
            <Link
              to="/grooming/face"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-100"
            >
              <Sparkles className="w-4 h-4 text-green-500" />
              Face Grooming Tools
            </Link>

            <Link
              to="/grooming/roller"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-100"
            >
              <Wand2 className="w-4 h-4 text-yellow-500" />
              Roller and Gausha
            </Link>

            <Link
              to="/grooming/remover"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-100"
            >
              <Scissors className="w-4 h-4 text-red-500" />
              Hair Removing Tools
            </Link>
          </div>
        </div>

        <Link to="/ctm" onClick={onClose} className="whitespace-nowrap">
          Explore CTM
        </Link>

        <Link to="/blog" onClick={onClose} className="whitespace-nowrap">
          Blog
        </Link>
      </nav>

      {/* ICONS — desktop only (mobile icons live in the Header) */}
      {/* ICONS */}
      {mobile ? (
        /* Mobile: cart + profile inside the drawer */
        <div className="flex items-center gap-4 pt-3 border-t w-full">
          <ShoppingBag
            className="w-6 h-6 shrink-0 cursor-pointer"
            onClick={() => { openCart(); onClose?.(); }}
          />
          <Link to="/user" onClick={onClose} className="shrink-0">
            <User className="w-6 h-6" />
          </Link>
        </div>
      ) : (
        /* Desktop: search + cart + profile */
        <div className="flex items-center gap-4 shrink-0 ">
          <SearchBar
            products={products}
            onClose={onClose}
            className="w-44 lg:w-44 xl:w-44"
          />
          <ShoppingBag
            className="w-6 h-6 shrink-0 cursor-pointer"
            onClick={openCart}
          />
          <Link to="/user" className="shrink-0">
            <User />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Nav;
