import React, { useState, useEffect, useRef } from "react";
import { Search, ShoppingBag, User, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartProvider";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug } from "../utils/slugify";

const Nav = ({ mobile, onClose, mobileIcons, mobileSearch }) => {
  const { openCart } = useCart();
  const menuRef = useRef();
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const searchRef = useRef();
  const { products = [] } = useProducts();

  const newArrivals = [...products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);
  // ✅ Updated search filter (name + category + limit 6)
  const filtered =
    query.trim().length > 0
      ? products
        .filter((p) =>
          (p.name + " " + (p.categoryName || ""))
            .toLowerCase()
            .includes(query.toLowerCase())
        )
        .slice(0, 6)
      : [];

  const toggleMenu = (menu) => {
    if (mobile) {
      setOpenMenu(openMenu === menu ? null : menu);
    } else {
      setOpenMenu(prev => (prev === menu ? null : menu));
    }
  };

  // ✅ Highlight search match
  const highlightText = (text) => {
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

  // ✅ Outside click close search
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        {/* <Link to="/offer" onClick={onClose} className="whitespace-nowrap">
          Offer
        </Link> */}

        {/* NEW ARRIVALS */}
        <div className="relative w-full group">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              toggleMenu("newarrival");
            }}
          >
            <Link
              to="/newarrival"
              onClick={onClose}
              className="whitespace-nowrap"
            >
              New Arrivals
            </Link>

            <ChevronDown
              className={`w-4 h-4 transition-transform ${openMenu === "newarrival" ? "rotate-180" : ""
                }`}
            />
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
            {newArrivals.map((item) => (
              <Link
                key={item._id}
                to={`/product/${createSlug(item.name)}`}
                state={{ id: item._id }}
                onClick={() => {
                  setTimeout(() => onClose?.(), 0);
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100"
              >
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* SKIN */}
        <div className="relative w-full group">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              toggleMenu("skin");
            }}
          >
            <Link to="/skin" onClick={onClose} className="whitespace-nowrap">
              Skin Care
            </Link>

            <ChevronDown
              className={`w-4 h-4 transition-transform ${openMenu === "skin" ? "rotate-180" : ""
                }`}
            />
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
              className="block px-4 py-3 text-sm hover:bg-gray-100"
            >
              Face
            </Link>
            <Link
              to="/skin/body"
              onClick={onClose}
              className="block px-4 py-3 text-sm hover:bg-gray-100"
            >
              Body
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
              className="block px-4 py-3 text-sm hover:bg-gray-100"
            >
              Hair Care
            </Link>
            <Link
              to="/hair/styling"
              onClick={onClose}
              className="block px-4 py-3 text-sm hover:bg-gray-100"
            >
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
              className="block px-4 py-3 text-sm hover:bg-gray-100"
            >
              Face Grooming Tools
            </Link>
            <Link
              to="/grooming/roller"
              onClick={onClose}
              className="block px-4 py-3 text-sm hover:bg-gray-100"
            >
              Roller and Gausha
            </Link>
            <Link
              to="/grooming/remover"
              onClick={onClose}
              className="block px-4 py-3 text-sm hover:bg-gray-100"
            >
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

      {/* ICONS */}
      <div
        className={`flex items-center gap-4 ${mobile ? "w-full pt-3 border-t" : "shrink-0"
          }`}
      >
        {/* SEARCH */}
        <div
          className={`relative ${mobile ? "flex-1" : "w-44 lg:w-56 xl:w-64"
            }`}
          ref={searchRef}
        >
          <div className="flex items-center border rounded-md px-2 w-full">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              className="outline-none px-2 py-2 text-sm w-full"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
                      className="w-12 h-12 object-cover rounded-md border"
                    />

                    <div>
                      <p className="text-sm font-medium">
                        {highlightText(product.name)}
                      </p>

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
                <p className="px-4 py-3 text-sm text-gray-500">
                  No products found
                </p>
              )}
            </div>
          )}
        </div>

        <ShoppingBag
          className="w-6 h-6 shrink-0 cursor-pointer"
          onClick={openCart}
        />

        <Link to="/user" className="shrink-0">
          <User />
        </Link>
      </div>
    </div>
  );
};

export default Nav;
