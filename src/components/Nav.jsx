import React, { useState, useEffect, useRef } from "react";
import { Search, ShoppingBag, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartProvider";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug } from "../utils/slugify";

const isActivePath = (pathname = "", target = "") => {
  if (target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
};

const normalizeSearchText = (value = "") =>
  String(value || "").toLowerCase().replace(/\s+/g, "");

const getDefaultVariant = (product = {}) => {
  if (!product?.hasVariants || !Array.isArray(product?.variants) || !product.variants.length) {
    return null;
  }
  return product.variants[0] || null;
};

const getProductPreviewImage = (product = {}) => {
  const variant = getDefaultVariant(product);
  return (
    variant?.images?.[0] ||
    variant?.image ||
    product?.images?.[0] ||
    product?.imageUrl ||
    product?.image ||
    "/placeholder.webp"
  );
};

const getProductPreviewPrice = (product = {}) => {
  const variant = getDefaultVariant(product);
  const raw = variant?.price ?? product?.price ?? 0;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const SearchBar = ({ products = [], onClose, className = "", autoFocus = false }) => {
  const [query, setQuery] = useState("");
  const searchRef = useRef();
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filtered =
    query.trim().length > 0
      ? products
        .filter((p) => {
          if (p?.isActive === false) return false;
          const haystack = [
            p.name,
            p.shortInfo,
            p.categoryName,
            Array.isArray(p.benefits) ? p.benefits.join(" ") : p.benefits || "",
          ].join(" ");
          return normalizeSearchText(haystack).includes(normalizeSearchText(query));
        })
        .slice(0, 6)
      : [];

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      navigate(`/products?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      onClose?.();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!autoFocus) return;
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [autoFocus]);

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="flex items-center border rounded-md px-2 w-full bg-white">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          className="w-full bg-white px-2 py-2 text-sm text-[#2c2523] placeholder:text-gray-400 caret-[#7a3535] outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {query && (
        <div className="absolute left-0 right-0 bg-white shadow-xl border rounded-xl mt-2 max-h-80 overflow-y-auto z-50">
          {filtered.length ? (
            filtered.map((product) => {
              const productId = product._id || product.id;
              const previewImage = getProductPreviewImage(product);
              const previewPrice = getProductPreviewPrice(product);
              return (
                <Link
                  key={productId}
                  to={`/product/${createSlug(product.name)}`}
                  state={{ id: productId }}
                  onClick={() => {
                    setQuery("");
                    setTimeout(() => onClose?.(), 0);
                  }}
                  className="flex items-center gap-3 px-3 py-3 text-[#2c2523] hover:bg-gray-50"
                >
                  <img
                    loading="lazy"
                    src={previewImage}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-md border shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#2c2523]">
                      {highlightText(product.name)}
                    </p>
                    {product.shortInfo && (
                      <p className="truncate text-xs text-gray-500">
                        {highlightText(product.shortInfo)}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 capitalize">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const categorySlug = createSlug(product.categoryName || "");
                          if (!categorySlug) return;
                          setQuery("");
                          onClose?.();
                          navigate(`/category/${categorySlug}`);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          e.stopPropagation();
                          const categorySlug = createSlug(product.categoryName || "");
                          if (!categorySlug) return;
                          setQuery("");
                          onClose?.();
                          navigate(`/category/${categorySlug}`);
                        }}
                        className="underline cursor-pointer"
                      >
                        {product.categoryName}
                      </span>
                    </p>
                    <p className="text-sm font-semibold text-[#1C371C]">
                      Rs{previewPrice}
                    </p>
                  </div>
                </Link>
              );
            })
          ) : (
            <>
              <p className="px-4 py-3 text-sm text-gray-600">
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
                Search all products for "{query}" -&gt;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const Nav = ({ mobile, onClose, subheaderLinks = [] }) => {
  const { openCart } = useCart();
  const searchWrapRef = useRef();
  const location = useLocation();
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const { products = [] } = useProducts();
  const mobileLinks = [
    { label: "Home", to: "/" },
    { label: "New Arrival", to: "/newarrival" },
    { label: "Explore CTM", to: "/ctm" },
    { label: "Mask Maker Machine", to: "/voice-mask-maker" },
  ];

  const desktopNavItemClass = (active) =>
    `relative inline-flex items-center whitespace-nowrap pb-1 text-[#3c302c] transition duration-300 hover:text-[#b34140] ${
      active ? "text-[#b34140]" : ""
    }`;

  const mobileNavItemClass = (active) =>
    `flex min-h-[48px] items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium transition ${
      active
        ? "bg-[#fff1ed] text-[#b34140] shadow-[0_10px_24px_rgba(179,65,64,0.10)]"
        : "bg-white text-[#3c302c] hover:bg-[#fff5f2]"
    }`;

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setDesktopSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div
      className={`${mobile
        ? "w-full flex flex-col gap-5 py-1 text-[#231815]"
        : "grid grid-cols-[minmax(0,1fr)_auto] items-center w-full min-w-0 gap-4 text-[#231815]"
      } heading-2-color`}
    >
      <nav
        className={`${mobile
          ? "flex flex-col gap-5 text-base w-full"
          : "order-1 flex items-center justify-center justify-self-center gap-3 lg:gap-5 xl:gap-6 text-[14px] lg:text-[15px] xl:text-[16px] whitespace-nowrap min-w-0 w-full"
        }`}
      >
        {mobile ? (
          <>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a7b72]">
                Explore
              </p>

              <div className="rounded-2xl border border-[#f1dfd9] bg-white p-2 shadow-[0_12px_28px_rgba(35,24,21,0.06)]">
                {mobileLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={mobileNavItemClass(isActivePath(location.pathname, item.to))}
                  >
                    <span>{item.label}</span>
                    <span className="text-lg leading-none text-[#c4a59a]">&gt;</span>
                  </Link>
                ))}
              </div>
            </div>

            {!!subheaderLinks.length && (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a7b72]">
                  Shop By Category
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {subheaderLinks.map((item) => {
                    const isActive =
                      location.pathname === item.to ||
                      location.pathname.startsWith(`${item.to}/`);

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={`rounded-xl border px-3 py-3 text-center text-[13px] font-semibold transition ${
                          isActive
                            ? "border-[#eab7aa] bg-[#fff1ed] text-[#b34140]"
                            : "border-[#f1dfd9] bg-white text-[#5d4a45]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-[#f1dfd9] bg-gradient-to-br from-[#fff7f4] to-white p-4 text-[#3c302c] shadow-[0_14px_34px_rgba(35,24,21,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b34140]">
                Limited Offer
              </p>
              <p className="mt-1 text-base font-semibold">Combo deals made for special customers.</p>
              <p className="mt-1 text-sm text-[#7b6660]">
                Jump straight to the current offer and checkout faster.
              </p>
              <Link
                to="/combo"
                onClick={onClose}
                className="mt-4 inline-flex rounded-full bg-[#231815] px-4 py-2 text-sm font-semibold text-white"
              >
                Shop Offer
              </Link>
            </div>
          </>
        ) : (
          <>
            <Link to="/" onClick={onClose} className={desktopNavItemClass(isActivePath(location.pathname, "/"))}>
              Home
            </Link>

            <div className="relative inline-block group">
              <Link
                to="/combo"
                onClick={onClose}
                className="
                  whitespace-nowrap font-semibold px-3 py-1 rounded-full
                  bg-black
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

            <Link to="/newarrival" onClick={onClose} className={desktopNavItemClass(isActivePath(location.pathname, "/newarrival"))}>
              New Arrival
            </Link>

            <Link to="/ctm" onClick={onClose} className={desktopNavItemClass(isActivePath(location.pathname, "/ctm"))}>
              Explore CTM
            </Link>

            <Link to="/voice-mask-maker" onClick={onClose} className={desktopNavItemClass(isActivePath(location.pathname, "/voice-mask-maker"))}>
              Mask Maker Machine
            </Link>
          </>
        )}
      </nav>

      {mobile ? (
        <div className="grid grid-cols-2 gap-3 w-full border-t border-[#f1dfd9] pt-4 text-[#231815]">
          <button
            type="button"
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#f1dfd9] bg-white px-3 py-3 text-sm font-semibold shadow-[0_10px_24px_rgba(35,24,21,0.05)]"
            onClick={() => {
              openCart();
              onClose?.();
            }}
          >
            <ShoppingBag className="w-5 h-5 shrink-0" />
            Cart
          </button>
          <Link
            to="/user"
            onClick={onClose}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#f1dfd9] bg-white px-3 py-3 text-sm font-semibold shadow-[0_10px_24px_rgba(35,24,21,0.05)]"
          >
            <User className="w-5 h-5 shrink-0" />
            Profile
          </Link>
        </div>
      ) : (
        <div className="order-2 flex items-center justify-end gap-3 xl:gap-4 shrink-0 justify-self-end text-[#231815]">
          <div ref={searchWrapRef} className="relative flex shrink-0 items-center">
            <button
              type="button"
              aria-label="Toggle search"
              onClick={() => setDesktopSearchOpen((value) => !value)}
              className="inline-flex items-center justify-center shrink-0 text-[#231815] transition hover:text-black"
            >
              <Search className="w-5 h-5" />
            </button>

            {desktopSearchOpen && (
              <div className="absolute right-0 top-full z-[70] mt-3 w-[280px] rounded-2xl border border-[#eadfda] bg-white p-3 shadow-[0_18px_45px_rgba(35,24,21,0.16)] xl:w-[320px]">
                <SearchBar
                  products={products}
                  autoFocus={desktopSearchOpen}
                  onClose={() => {
                    setDesktopSearchOpen(false);
                    onClose?.();
                  }}
                  className="w-full"
                />
              </div>
            )}
          </div>
          <Link to="/user" className="shrink-0 text-[#231815] transition hover:text-black">
            <User />
          </Link>
          <ShoppingBag
            className="w-6 h-6 shrink-0 cursor-pointer text-[#231815] transition hover:text-black"
            onClick={openCart}
          />
        </div>
      )}
    </div>
  );
};

export default Nav;
