import React, { useState, useRef } from "react";
import { Menu, X, Search } from "lucide-react";
import logo from "../assets/Images/logo2.webp";
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
      <div className="max-w-8xl flex items-center justify-between gap-3 px-4 py-3">

        {/* Logo */}
        <div
          className="h-12 md:h-14 flex items-center cursor-pointer shrink-0"
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="Ilika" className="h-full w-auto object-contain" />
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex flex-1 min-w-0">
          <Nav />
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2">

          {/* Search icon — tapping expands the bar */}
          <button onClick={() => setSearchOpen((v) => !v)} className="shrink-0">
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
                🌼 Festive Offer
                <div className="
                  absolute right-[-6px] top-1/2 -translate-y-1/2
                  w-0 h-0
                  border-t-[6px] border-b-[6px] border-l-[6px]
                  border-t-transparent border-b-transparent border-l-[#E96A6A]
                " />
              </div>
            )}

            <button onClick={() => setOpen(!open)} className="relative z-10">
              {open ? <X /> : <Menu />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile expanding search bar */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <SearchBar
            products={products}
            onClose={() => { setSearchOpen(false); setOpen(false); }}
            className="w-full"
          />
        </div>
      )}

      {/* Mobile drawer — links + cart + profile remain inside */}
      {open && (
        <div className="md:hidden px-4 pb-4">
          <Nav mobile onClose={() => setOpen(false)} />
        </div>
      )}

    </header>
  );
};

export default Header;