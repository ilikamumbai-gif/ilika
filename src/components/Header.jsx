import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "../assets/Images/logo2.webp";
import Nav from "./Nav";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (<header className="w-full sticky top-0 z-50 bg-[#e8adad60]/20 backdrop-blur-md"> <div className="max-w-8xl flex items-center justify-between px-4 py-3">


    {/* Logo */}
    <div
      className="h-12 md:h-14 flex items-center cursor-pointer"
      onClick={() => navigate(`/`)}
    >
      <img
        src={logo}
        alt="Ilika"
        className="h-full w-auto object-contain"
      />
    </div>

    {/* Desktop Nav */}
    <div className="hidden md:block">
      <Nav />
    </div>

    {/* Mobile Menu + Offer */}
    <div className="md:hidden flex items-center gap-2 relative">

      {/* Offer Speech Bubble */}
      {!open && (
        <div
          onClick={() => navigate("/combo")}
          className="
      relative
      bg-gradient-to-r from-[#FAD4C0] via-[#E96A6A] to-[#D45A5A]
      text-white
      text-[11px]
      px-3 py-[5px]
      rounded-lg
      border border-[#E96A6A]
      shadow-md
      animate-[pulse_2s_infinite]
      cursor-pointer
    "
        >
          🌼 Festive Offer

          {/* Arrow pointing to hamburger */}
          <div
            className="
        absolute right-[-6px] top-1/2 -translate-y-1/2
        w-0 h-0
        border-t-[6px] border-b-[6px]
        border-l-[6px]
        border-t-transparent border-b-transparent
        border-l-[#E96A6A]
      "
          />
        </div>
      )}

      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative z-10"
      >
        {open ? <X /> : <Menu />}
      </button>

    </div>
  </div>

    {/* Mobile Menu */}
    {open && (
      <div className="md:hidden px-4 pb-4">
        <Nav mobile onClose={() => setOpen(false)} />
      </div>
    )}
  </header>


  );
};

export default Header;
