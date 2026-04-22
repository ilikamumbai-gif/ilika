import React from "react";
import {
  Facebook,
  Instagram,
  MapPin,
  Info,
  Phone,
  Youtube,
  MessageCircle
} from "lucide-react";
import logo from "../../public/Images/logo2.webp";
import amazon from "../../public/Images/Amazon.webp";
import flipcart from "../../public/Images/Flipcart.webp";
import meesho from "../../public/Images/Meesho.webp";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="primary-bg-color mt-12">

      {/* TOP STRIP */}
      <div className="MiniDivider-bg-color py-1" />

      {/* MAIN FOOTER */}
      <div className="
        max-w-7xl mx-auto 
        px-4 sm:px-6 lg:px-8 
        py-10
        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
        gap-10 lg:gap-16
      ">

        {/* BRAND */}
        <div className="space-y-5 text-center sm:text-left">
          <img
            src={logo}
            alt="Ilika"
            className="h-11 mx-auto sm:mx-0"
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
        <div className="space-y-8 text-center sm:text-left">

          {/* LINKS */}
          <div className="space-y-3">
            <h4 className="heading-color font-semibold text-lg">
              Quick Links
            </h4>

            <Link to="/about" className="flex items-center justify-center sm:justify-start gap-2 hover:opacity-80">
              <Info size={16} /> About Us
            </Link>

            <Link to="/contact" className="flex items-center justify-center sm:justify-start gap-2 hover:opacity-80">
              <Phone size={16} /> Contact Us
            </Link>
          </div>

          {/* ADDRESS */}
          <div className="space-y-3">
            <h4 className="heading-color font-semibold text-lg flex items-center justify-center sm:justify-start gap-2">
              <MapPin size={16} /> Address
            </h4>

            <p className="text-sm leading-relaxed">
              Office no. 201-202, Hirubai Residency <br />
              Virar (West) - 401303. Maharashtra, India.
            </p>

            <p className="text-sm">+91 91208 79879</p>
          </div>
        </div>

        {/* SOCIAL + MARKETPLACE + CTA */}
        <div className="space-y-6 text-center sm:text-left">

          {/* SOCIAL */}
          <div className="space-y-3">
            <h4 className="heading-color font-semibold text-lg">
              Follow Us
            </h4>

            <div className="flex justify-center sm:justify-start gap-4">
              <a href="#"><Facebook className="w-5 h-5 hover:scale-110 transition" /></a>
              <a href="#"><Youtube className="w-5 h-5 hover:scale-110 transition" /></a>
              <a href="#"><Instagram className="w-5 h-5 hover:scale-110 transition" /></a>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="h-px bg-gray-300/40 w-full" />

          {/* MARKETPLACE */}
          <div className="space-y-3">
            <h4 className="heading-color font-semibold text-lg">
              Also Available On
            </h4>

            <div className="flex justify-center sm:justify-start gap-5 items-center">
              <img src={amazon} alt="Amazon" className="h-7 w-7 hover:scale-110 transition" />
              <img src={flipcart} alt="Flipkart" className="h-7 w-7 hover:scale-110 transition" />
              <img src={meesho} alt="Meesho" className="h-7 w-7 hover:scale-110 transition" />
            </div>
          </div>

          {/* ✨ PREMIUM FEEDBACK BUTTON */}
          <div className="pt-2 flex justify-center sm:justify-start">
            <Link
              to="/feedback"
              className="
                flex items-center gap-2
                px-6 py-3
                text-sm font-semibold
                rounded-full
                bg-gradient-to-r from-[#c97b7b] to-[#e6a4a4]
                text-white
                shadow-md
                hover:scale-105 hover:shadow-lg
                transition-all duration-300
              "
            >
              <MessageCircle size={16} />
              Give Feedback
            </Link>
          </div>

        </div>
      </div>

      {/* BOTTOM */}
      <div className="MiniDivider-bg-color text-xs sm:text-sm py-4">
        <div className="
          max-w-7xl mx-auto px-4
          flex flex-col md:flex-row
          justify-between items-center
          gap-3 text-center md:text-left
        ">
          <p>© 2026 Ilika | Powered by PTCGRAM Private Limited.</p>

          <div className="flex flex-wrap gap-4 justify-center">
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