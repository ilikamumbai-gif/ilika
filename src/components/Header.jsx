import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, Sparkles, X } from "lucide-react";
import logo from "/Images/logo2.webp";
import { useProducts } from "../admin/context/ProductContext";
import OptimizedImage from "./OptimizedImage";
import { MiniDividerStrip } from "./MiniDivider";
import { createSlug } from "../utils/slugify";

const Nav = lazy(() => import("./Nav"));
const SearchBar = lazy(() =>
  import("./Nav").then((module) => ({ default: module.SearchBar }))
);

const MINI_DIVIDER_HEIGHT = 24;
const DESKTOP_MAIN_HEADER_HEIGHT = 68;
const DESKTOP_SUBHEADER_HEIGHT = 42;
const MOBILE_MAIN_HEADER_HEIGHT = 72;
const MOBILE_SEARCH_PANEL_HEIGHT = 76;
const BEST_SELLER_PRODUCT_NAMES = [
  "Ilika Automatic Voice Version Face Mask Maker Machine with Collagen Peptide",
  "Ilika Nonvoice Mask Maker Machine with Collagen Peptide",
  "Hot & Cold Facial Pore Blackhead Remover For Men & Women",
  "Beauty Bubble Pro Blackhead Remover For Men & Women",
  "24k Gold Collagen Face Mask for Anti-aging",
  "Ilika 4 in 1 Collagen Face Mask Glow Firm & Hydrate",
  "Hydra Gel Face Moisturizer | For Dry & Dehydrated Skin 50g",
  "High Frequency Therapy Wand with 4 Electrodes For Men & Women",
  "Ilika High-Speed Leafless Hair Dryer For Men & Women",
  "Ilika Airwrap All in 1 Multi-Styler Tools with Leather Box",
  "Herbal Hair Oil | Prevents Dandruff | Strengthens Hair Roots",
  "Black Seed Hair Oil | Prevents Premature Graying | Boosts Hair Growth",
];

const getProductPreviewImage = (product = {}) =>
  product?.variants?.[0]?.images?.[0] ||
  product?.variants?.[0]?.image ||
  product?.images?.[0] ||
  product?.imageUrl ||
  product?.image ||
  "/placeholder.webp";

const normalizeProductName = (value = "") =>
  String(value || "").toLowerCase().replace(/\s+/g, " ").trim();

const baseDesktopSubheaderLinks = [
  { label: "Face Care", to: "/skin/face" },
  { label: "Body Care", to: "/skin/body" },
  { label: "Hair Care", to: "/hair/care" },
  { label: "Hair Styling", to: "/hair/styling" },
  {
    label: "Face Grooming",
    to: "/grooming/face",
    children: [{ label: "Roller & Gua Sha", to: "/grooming/roller", icon: "sparkles" }],
  },
  { label: "Hair Removal", to: "/grooming/remover" },
];

const Header = ({ forceWhiteBg = false, topOffset = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerLift, setHeaderLift] = useState(0);
  const { products = [] } = useProducts();
  const desktopSubheaderLinks = useMemo(() => {
    const productMap = new Map(
      products
        .filter((product) => product?.isActive !== false)
        .map((product) => [normalizeProductName(product?.name), product])
    );

    const bestSellerChildren = BEST_SELLER_PRODUCT_NAMES.map((name) => {
      const product = productMap.get(normalizeProductName(name));
      if (!product) return null;
      return {
        label: product.name,
        to: `/product/${createSlug(product.name || "")}`,
        state: { id: product._id || product.id },
        image: getProductPreviewImage(product),
      };
    }).filter(Boolean);

    return [
      ...baseDesktopSubheaderLinks,
      {
        label: "Best Seller",
        to: "/products",
        children: bestSellerChildren.length
          ? bestSellerChildren
          : [{ label: "View All Products", to: "/products" }],
      },
    ];
  }, [products]);
  const mobileHeaderHeight =
    MOBILE_MAIN_HEADER_HEIGHT +
    (searchOpen ? MOBILE_SEARCH_PANEL_HEIGHT : 0);
  const desktopHeaderHeight = DESKTOP_MAIN_HEADER_HEIGHT + DESKTOP_SUBHEADER_HEIGHT;
  const fixedTopOffset = Math.max(topOffset, MINI_DIVIDER_HEIGHT);
  const stackHeight = Math.max(mobileHeaderHeight, desktopHeaderHeight) + fixedTopOffset;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const nextLift = Math.min(window.scrollY || 0, MINI_DIVIDER_HEIGHT);
      setHeaderLift(nextLift);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="w-full">
      <div
        className="fixed left-0 right-0 top-0 z-50 w-full overflow-visible"
        style={{
          height: `${stackHeight}px`,
        }}
      >
        <div
          className="transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(-${headerLift}px)`,
            willChange: "transform",
          }}
        >
          <MiniDividerStrip />

          <div
            className={`w-full border-b border-[#e7ddd7] bg-white ${
              forceWhiteBg ? "bg-white" : "bg-white"
            }`}
          >
            <div className="flex w-full items-center justify-between px-3 py-2.5 sm:px-4">
              <div
                className="flex h-11 shrink-0 cursor-pointer items-center px-1 py-1 lg:order-1 lg:h-12"
                onClick={() => navigate("/")}
              >
                <OptimizedImage
                  priority
                  src={logo}
                  alt="Ilika"
                  width={220}
                  height={56}
                  className="h-9 w-auto object-contain sm:h-11 xl:h-12"
                />
              </div>

              <div className="hidden h-12 min-w-0 flex-1 items-center lg:flex lg:order-2">
                <Suspense fallback={null}>
                  <Nav />
                </Suspense>
              </div>

              <div className="flex items-center gap-1.5 text-[#231815] sm:gap-2 lg:hidden">
                {!open && (
                  <button
                    type="button"
                    onClick={() => navigate("/combo")}
                    className="inline-flex h-8 items-center rounded-none border-0 bg-[#231815] px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_10px_24px_rgba(35,24,21,0.18)] appearance-none"
                  >
                    Offer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen((value) => !value);
                    setOpen(false);
                  }}
                  aria-label={searchOpen ? "Close search" : "Open search"}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-none border-0 bg-white text-[#231815] shadow-none appearance-none"
                >
                  {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </button>

                <div className="relative flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen((value) => !value);
                      setSearchOpen(false);
                    }}
                    aria-label={open ? "Close menu" : "Open menu"}
                    className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-none border-0 bg-white text-[#231815] shadow-none appearance-none"
                  >
                    {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </button>
                </div>
              </div>
            </div>

            {searchOpen && (
              <div className="border-t border-[#f0e4df] bg-[#fffaf8] px-3 pb-3 pt-3 shadow-[0_12px_30px_rgba(35,24,21,0.08)] sm:px-4 lg:hidden">
                <Suspense fallback={<div className="h-10 w-full" />}>
                  <SearchBar
                    products={products}
                    autoFocus={searchOpen}
                    onClose={() => {
                      setSearchOpen(false);
                      setOpen(false);
                    }}
                    className="w-full"
                  />
                </Suspense>
              </div>
            )}

            {open && (
              <div className="border-t border-[#f0e4df] bg-[#fffaf8] px-3 pb-5 pt-4 shadow-[0_18px_36px_rgba(35,24,21,0.1)] max-h-[calc(100vh-92px)] overflow-y-auto overscroll-contain sm:px-4 lg:hidden">
                <Suspense fallback={<div className="h-10" />}>
                  <Nav mobile onClose={() => setOpen(false)} subheaderLinks={desktopSubheaderLinks} />
                </Suspense>
              </div>
            )}

            <div
              className="hidden border-b border-[#e2c1c1] lg:block"
              style={{ backgroundColor: "#2b2a29fc" }}
            >
              <div className="mx-auto flex h-[42px] max-w-[1280px] items-center justify-center gap-1 overflow-visible px-6 xl:px-8">
                {desktopSubheaderLinks.map((item) => {
                  const isActive =
                    location.pathname === item.to ||
                    location.pathname.startsWith(`${item.to}/`) ||
                    item.children?.some(
                      (child) =>
                        location.pathname === child.to ||
                        location.pathname.startsWith(`${child.to}/`)
                    );

                  if (item.children?.length) {
                    return (
                      <div key={item.to} className="group relative z-[60] flex h-full items-center">
                        <Link
                          to={item.to}
                          state={item.state}
                          className={`relative shrink-0 px-4 py-1 text-[14px] font-semibold transition duration-200 ${
                            isActive ? "text-[#ffffff]" : "text-white/90 hover:text-white"
                          }`}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {item.label}
                            <span className="text-[10px] leading-none">v</span>
                          </span>
                          <span
                            className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[#b34140] transition-opacity duration-200 ${
                              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`}
                          />
                        </Link>

                        <div className="pointer-events-none absolute left-[calc(100%-3rem)] top-full z-[70] min-w-[200px] pt-1 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                          <div className={`rounded-xl border border-[#ead5d5] bg-white p-1.5 shadow-[0_14px_30px_rgba(35,24,21,0.12)] ${
                            item.label === "Best Seller" ? "w-[280px]" : "w-[210px]"
                          }`}>
                            {item.children.map((child) => {
                              const childActive =
                                location.pathname === child.to ||
                                location.pathname.startsWith(`${child.to}/`);

                              return (
                                <Link
                                  key={child.to}
                                  to={child.to}
                                  state={child.state}
                                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold leading-tight transition ${
                                    childActive
                                      ? "bg-[#fff1ed] text-[#b34140]"
                                      : "text-[#6d5a55] hover:bg-[#fff7f4] hover:text-[#b34140]"
                                  }`}
                                >
                                  {child.icon === "sparkles" ? (
                                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff2ea] text-[#b34140]">
                                      <Sparkles className="h-3.5 w-3.5" />
                                    </span>
                                  ) : null}

                                  {child.image ? (
                                    <img
                                      loading="lazy"
                                      src={child.image}
                                      alt={child.label}
                                      className="h-9 w-9 shrink-0 rounded-lg border border-[#f1dfd9] object-cover"
                                    />
                                  ) : null}

                                  <span className={`block ${child.image ? "min-w-0 truncate whitespace-nowrap" : ""}`}>
                                    {child.label}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      state={item.state}
                      className={`group relative shrink-0 px-4 py-1 text-[14px] font-semibold transition duration-200 ${
                        item.accent
                          ? "text-white hover:text-white"
                          : isActive
                            ? "text-white"
                            : "text-white/90 hover:text-white"
                      }`}
                    >
                      {item.label}
                      {(!item.accent || isActive) && (
                        <span
                          className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[#b34140] transition-opacity duration-200 ${
                            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          height: `${mobileHeaderHeight + fixedTopOffset}px`,
        }}
        className="lg:hidden"
      />
      <div
        style={{
          height: `${desktopHeaderHeight + fixedTopOffset}px`,
        }}
        className="hidden lg:block"
      />
    </header>
  );
};

export default Header;
