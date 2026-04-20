import React, { useState } from "react";
import { Menu, X, Search } from "lucide-react";
import logo from "/Images/logo2.webp";
import Nav, { SearchBar } from "./Nav";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../admin/context/ProductContext";

const Header = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { products = [] } = useProducts();

  return (
    <header className="w-full sticky top-0 z-50 bg-[#e8adad60]/20 backdrop-blur-md">

      {/* ── Main header row ── */}
      <div className="flex items-center justify-between px-4 py-3 w-full">

        {/* Logo — always on the left */}
        <div
          className="h-12 md:h-14 flex items-center cursor-pointer shrink-0"
          onClick={() => navigate("/")}
        >
          <img  fetchPriority="high"   src={logo} alt="Ilika" className="h-14 w-auto object-contain" />
        </div>

        {/* Desktop Nav — pushed to the right via ml-auto */}
        <div className="hidden md:flex items-center h-14 ml-auto">
          <Nav />
        </div>

        {/* Mobile controls — only visible on mobile */}
        <div className="flex md:hidden items-center gap-2">

          {/* Search toggle */}
          <button
            onClick={() => {
              setSearchOpen((v) => !v);
              setOpen(false);
            }}
            className="shrink-0 p-1"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Offer bubble + Hamburger */}
          <div className="flex items-center gap-2 relative shrink-0">
            {!open && (
              <div
                onClick={() => navigate("/combo")}
                className="
                  relative
                  bg-gradient-to-r from-[#FAD4C0] via-[#E96A6A] to-[#D45A5A]
                  text-white text-[11px] px-3 py-[5px]
                  rounded-lg border border-[#E96A6A] shadow-md
                  animate-[pulse_2s_infinite] cursor-pointer whitespace-nowrap
                "
              >
                🌼 Offer
                <div className="
                  absolute right-[-6px] top-1/2 -translate-y-1/2
                  w-0 h-0
                  border-t-[6px] border-b-[6px] border-l-[6px]
                  border-t-transparent border-b-transparent border-l-[#E96A6A]
                " />
              </div>
            )}

            <button
              onClick={() => {
                setOpen((v) => !v);
                setSearchOpen(false);
              }}
              className="relative z-10 p-1"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile expanding search bar */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <SearchBar
            products={products}
            onClose={() => {
              setSearchOpen(false);
              setOpen(false);
            }}
            className="w-full"
          />
        </div>
      )}

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden px-4 pb-4 border-t border-gray-100">
          <Nav mobile onClose={() => setOpen(false)} />
        </div>
      )}

    </header>
  );
};

export default Header;