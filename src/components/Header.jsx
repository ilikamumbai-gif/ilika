import React from "react";
import { Menu, X } from "lucide-react";
import logo from "../assets/Images/logo2.png";
import Nav from "./Nav";
import  { useState } from "react";
import { useNavigate } from "react-router-dom";


const Header = () => {
  const navigate = useNavigate();
   const [open, setOpen] = useState(false);
  return (
   <header className="w-full sticky top-0 z-50 bg-[#e8adad60]/20 backdrop-blur-md">

      <div className="max-w-8xl  flex items-center justify-between px-4  py-3">

        {/* Logo */}
        <div className="h-12 md:h-14 flex items-center" onClick={() => navigate(`/`)}>
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>


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
