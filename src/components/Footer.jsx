
import React from "react";
import {
  Mail,
  Facebook,
  Instagram,
  Camera,
  MapPin,
  Info,
  Contact,
  Phone,
  Youtube,
} from "lucide-react";
import logo from "../assets/Images/logo2.png";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
   <footer className="w-full primary-bg-color pt-8 overflow-hidden mt-auto">


      {/* TOP DIAGONAL MARQUEE STRIP */}
      {/* TOP MARQUEE STRIP */}
      <div className="MiniDivider-bg-color py-2 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee text-sm font-medium">
          Best To Use ! Best To Use ! Best To Use ! Best To Use ! Best To Use !
          Best To Use ! Best To Use ! Best To Use ! Best To Use ! Best To Use !
          Best To Use ! Best To Use ! Best To Use ! Best To Use ! Best To Use !
          Best To Use ! Best To Use ! Best To Use ! Best To Use ! Best To Use !
          Best To Use ! Best To Use ! Best To Use !
        </div>
      </div>

      {/* MAIN FOOTER */}
     <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">


        {/* LEFT */}
        <div className="space-y-4 text-center md:text-left">
          <img src={logo} alt="Ilika" className="h-10 mx-auto md:mx-0" />

          <h3 className="heading-color text-lg sm:text-xl font-semibold">
            Beauty Care For Everyone 
          </h3>

          <p className="text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
            Discover Premium & affordable Skin Care and Hair Care essentials
            crafted for every Indian. <br />
            We celebrate your unique and elegant.
          </p>
        </div>

        {/* CENTER */}
        <div className="space-y-6 text-center md:text-left">
          <Link
            to="/about"
            className="hover:text-black flex justify-center md:justify-start items-center gap-3 "
          >
            <Info />
            <span className="heading-color font-semibold">About Us</span>
          </Link>

          <Link
            to="/contact"
            className="hover:text-black flex justify-center md:justify-start items-center gap-3"
          >
            <Phone />
            <span className="heading-color font-semibold">Contact Us</span>
          </Link>
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">

            <MapPin className="mt-1" />
            <div>
              <h4 className="heading-color font-semibold">Address:</h4>
              <p className="text-sm">
                Office no. 322, Padmi Bai Tower, <br />
                Virar (East) 401305, <br />
                Maharashtra, India.
              </p>
            </div>
          </div>


        </div>

        {/* RIGHT (SOCIAL ICONS) */}
        <div className="flex flex-wrap md:flex-col gap-6 items-center md:items-end justify-center">

          <Mail className="w-6 h-6 cursor-pointer hover:scale-110 transition" />
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Facebook className="w-6 h-6 cursor-pointer hover:scale-110 transition" />
          </a>

          <a
            href="https://youtubee.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Youtube className="w-6 h-6 cursor-pointer hover:scale-110 transition" />
          </a>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Instagram className="w-6 h-6 cursor-pointer hover:scale-110 transition" />
          </a>

        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="MiniDivider-bg-color content-text text-xs sm:text-sm py-4">
      <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row justify-between items-center gap-4 text-center lg:text-left">

          <p className="text-center md:text-left">
            © 2025 Ilika | Design with Love in India
          </p>

          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              to="/termsandcondition"
              className="flex justify-center md:justify-start items-center gap-3"
            >
              <span className="cursor-pointer hover:underline">Terms & Conditions</span>
            </Link>
            <Link
              to="/privacy"
              className="flex justify-center md:justify-start items-center gap-3"
            >
              <span className="cursor-pointer hover:underline">Privacy</span>
            </Link>
            <Link
              to="/return"
              className="flex justify-center md:justify-start items-center gap-3"
            >
              <span className="cursor-pointer hover:underline">Returns</span>
            </Link>
            <Link
              to="/shippingpolicy"
              className="flex justify-center md:justify-start items-center gap-3"
            >
              <span className="cursor-pointer hover:underline">Shipping</span>
            </Link>
            
            <Link to="/faq" className="flex justify-center md:justify-start items-center gap-3">
            <span className="cursor-pointer hover:underline">
              FAQ
            </span>
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
