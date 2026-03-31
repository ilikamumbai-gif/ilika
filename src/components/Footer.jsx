import React from "react";
import {
  Mail,
  Facebook,
  Instagram,
  MapPin,
  Info,
  Phone,
  Youtube,
} from "lucide-react";
import logo from "../assets/Images/logo2.webp";
import amazon from "../../public/Images/Amazon.webp"
import flipcart from "../../public/Images/Flipcart.webp"
import meesho from "../../public/Images/Meesho.webp"
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="primary-bg-color mt-20">

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
          <img src={logo} alt="Ilika" className="h-11 mx-auto sm:mx-0" />

          <h3 className="heading-color text-xl font-semibold">
            Beauty Care For Everyone
          </h3>

          <p className="text-sm leading-relaxed max-w-sm mx-auto sm:mx-0">
            Discover Premium & affordable Skin Care and Hair Care essentials
            crafted for every Indian. We celebrate your unique elegance.
          </p>
        </div>


        {/* LINKS + ADDRESS */}
        <div className="space-y-8 text-center md:text-left max-w-xs mx-auto md:mx-0">

          <div className="space-y-3">
            <h4 className="heading-color font-semibold text-lg">Quick Links</h4>

            <Link to="/about" className="flex items-center justify-center sm:justify-start gap-3 hover:opacity-70">
              <Info size={18} />
              About Us
            </Link>

            <Link to="/contact" className="flex items-center justify-center sm:justify-start gap-3 hover:opacity-70">
              <Phone size={18} />
              Contact Us
            </Link>
          </div>

          <div className="space-y-2">
            <h4 className="heading-color font-semibold text-lg flex items-center justify-center sm:justify-start gap-2">
              <MapPin size={18} /> Address
            </h4>

            <p className="text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
              Office no. 322, Padmi Bai Tower <br />
              Virar (East) 401305 <br />
              Maharashtra, India
            </p>
          </div>

        </div>


        {/* SOCIAL + MARKETPLACES */}
        <div className="space-y-6 md:space-y-8 text-center md:text-left max-w-xs mx-auto md:mx-0">
          {/* FOLLOW US */}
          <div className="space-y-4">
            <h4 className="heading-color font-semibold text-lg">Follow Us</h4>

            <div className="flex justify-center md:justify-start gap-5">
              {/* <Mail className="w-5 h-5 hover:scale-110 transition cursor-pointer" /> */}

              <a href="https://www.facebook.com/profile.php?id=100083395125995" target="_blank">
                <Facebook className="w-5 h-5 hover:scale-110 transition" />
              </a>

              <a href="https://www.youtube.com/@ilikamumbai" target="_blank">
                <Youtube className="w-5 h-5 hover:scale-110 transition" />
              </a>

              <a href="https://www.instagram.com/ilikamumbai/" target="_blank">
                <Instagram className="w-5 h-5 hover:scale-110 transition" />
              </a>
            </div>
          </div>


          {/* EXTRA SPACING DIVIDER */}
          <div className="h-px bg-gray-300/40 w-2/3 md:w-3/5 mx-auto md:mx-0"></div>


          {/* MARKETPLACES */}
          <div className="space-y-4">
            <h4 className="heading-color font-semibold text-lg">
              Also Available On
            </h4>

            <div className="flex justify-center md:justify-start gap-6 items-center">
              <a href="https://www.amazon.in/stores/Ilik%C3%A4/page/4BEEF7C7-AFF6-4530-B62B-3A07943B7277?lp_asin=B0G1HMC41K&ref_=ast_bln" target="_blank">
                <img
                  src={amazon}
                  alt="Amazon"
                  className="h-7 hover:scale-110 transition"
                />
              </a>

              <a href="https://www.flipkart.com/search?q=ilika%20skin%20care&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=off&as=off" target="_blank">
                <img
                  src={flipcart}
                  alt="Flipkart"
                  className="h-7 hover:scale-110 transition"
                />
              </a>
              <a href="https://www.meesho.com/ILIKASKINCARE" target="_blank">

                <img
                  src={meesho}
                  alt="Messho"
                  className="h-7 hover:scale-110 transition"
                />
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="MiniDivider-bg-color text-xs sm:text-sm py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left">
          <p>© 2026 Ilika | Powered by PTCGRAM Private Limited</p>

          <div className="flex flex-wrap gap-5 justify-center">
            <Link to="/termsandcondition" className="hover:underline">Terms</Link>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/return" className="hover:underline">Returns/Refund</Link>
            <Link to="/shippingpolicy" className="hover:underline">Shipping</Link>
            <Link to="/faq" className="hover:underline">FAQ</Link>
          </div>

        </div>
      </div>

    </footer>
  );
};

export default Footer;