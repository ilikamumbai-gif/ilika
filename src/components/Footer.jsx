import React from "react";
import {
  Facebook,
  Instagram,
  MapPin,
  Info,
  Phone,
  Youtube,
} from "lucide-react";
import logo from "../../public/Images/logo2.webp";
import amazon from "../../public/Images/Amazon.webp";
import flipcart from "../../public/Images/Flipcart.webp";
import meesho from "../../public/Images/Meesho.webp";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="primary-bg-color mt-10">

      {/* TOP MARQUEE */}
      <div className="MiniDivider-bg-color py-1 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee text-sm font-medium">
          &nbsp;
        </div>
      </div>

      {/* MAIN FOOTER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 
        grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
        gap-y-12 gap-x-16 items-start">

        {/* BRAND */}
        <div className="space-y-5 text-center md:text-left max-w-sm mx-auto md:mx-0">

          {/* ✅ FIXED LOGO */}
          <img
            src={logo}
            alt="Ilika"
            fetchPriority="high"
            className="h-11 w-auto mx-auto sm:mx-0"
          />

          <h3 className="heading-color text-xl font-semibold">
            Beauty Care For Everyone
          </h3>

          <p className="text-sm leading-relaxed max-w-sm mx-auto sm:mx-0">
            Discover Premium & affordable Skin Care and Hair Care essentials
            crafted for every Indian.
          </p>
        </div>

        {/* LINKS + ADDRESS */}
        <div className="space-y-8 text-center md:text-left max-w-xs mx-auto md:mx-0">

          <div className="space-y-2">
            <h4 className="heading-color font-semibold text-lg">Quick Links</h4>

            <Link to="/about" className="flex items-center justify-center sm:justify-start gap-3">
              <Info size={18} /> About Us
            </Link>

            <Link to="/contact" className="flex items-center justify-center sm:justify-start gap-3">
              <Phone size={18} /> Contact Us
            </Link>
          </div>

          <div className="space-y-2">
            <h4 className="heading-color font-semibold text-lg flex items-center justify-center sm:justify-start gap-2">
              <MapPin size={18} /> Address
            </h4>

            <p className="text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
              Office no. 201-202, Hirubai Residency <br />
              Virar (West) - 401303.
              Maharashtra, India.
            </p>
            <p className="text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
              +91 91208 79879
            </p>
          </div>
        </div>

        {/* SOCIAL + MARKETPLACES */}
        <div className="space-y-6 md:space-y-8 text-center md:text-left max-w-xs mx-auto md:mx-0">

          {/* SOCIAL */}
          <div className="space-y-4">
            <h4 className="heading-color font-semibold text-lg">Follow Us</h4>

            <div className="flex justify-center md:justify-start gap-5">
              <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">
                <Facebook className="w-5 h-5 hover:scale-110 transition" />
              </a>

              <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">
                <Youtube className="w-5 h-5 hover:scale-110 transition" />
              </a>

              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
                <Instagram className="w-5 h-5 hover:scale-110 transition" />
              </a>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="h-px bg-gray-300/40 w-2/3 md:w-3/5 mx-auto md:mx-0"></div>

          {/* MARKETPLACES */}
          <div className="space-y-4">
            <h4 className="heading-color font-semibold text-lg">
              Also Available On
            </h4>

            <div className="flex justify-center md:justify-start gap-6 items-center">

              {/* ✅ AMAZON */}
              <img
                src={amazon}
                alt="Amazon"
                loading="lazy"
                width="28"
                height="28"
                className="h-7 w-7 hover:scale-110 transition"
              />

              {/* ✅ FLIPKART */}
              <img
                src={flipcart}
                alt="Flipkart"
                loading="lazy"
                width="28"
                height="28"
                className="h-7 w-7 hover:scale-110 transition"
              />

              {/* ✅ MEESHO */}
              <img
                src={meesho}
                alt="Meesho"
                loading="lazy"
                width="28"
                height="28"
                className="h-7 w-7 hover:scale-110 transition"
              />

            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="MiniDivider-bg-color text-xs sm:text-sm py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left">
          <p>© 2026 Ilika | Powered by PTCGRAM Private Limited. </p>

          <div className="flex flex-wrap gap-5 justify-center">
            <Link to="/termsandcondition">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/return">Returns</Link>
            <Link to="/shippingpolicy">Shipping</Link>
            <Link to="/faq">FAQ</Link>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;