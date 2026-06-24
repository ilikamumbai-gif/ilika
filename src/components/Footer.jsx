import React, { useState } from "react";
import {
  MapPin,
  Info,
  Phone,
  MessageCircle,
  Mail,
  ShoppingBag,
  ShieldCheck,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import OptimizedImage from "./OptimizedImage";

const logo = "/Images/logo2.webp";
const amazon = "/Images/Amazon.webp";
const flipcart = "/Images/Flipcart.webp";
const meesho = "/Images/Meesho.webp";
const facebook = "/Images/facebook.png";
const youtube = "/Images/Youtube.png";
const instagram = "/Images/instagram.png";

const quickLinks = [
  { label: "New Arrivals", to: "/newarrival", icon: ShoppingBag },
  { label: "Shop All", to: "/shopall", icon: ShoppingBag },
  { label: "Offers", to: "/offer", icon: ShoppingBag },
  { label: "Social Feed", to: "/social-feed", icon: BookOpen },
  { label: "Track Order", to: "/track-order", icon: ShieldCheck },
];

const companyLinks = [
  { label: "About Us", to: "/about", icon: Info },
  { label: "Blog", to: "/blog", icon: BookOpen },
  { label: "Contact Us", to: "/contact", icon: Phone },
  { label: "Give Feedback", to: "/feedback", icon: MessageCircle },
];

const supportLinks = [
  { label: "Warranty Registration", to: "/warranty-registration" },
  { label: "Warranty Claim", to: "/warranty-claim" },
  { label: "Raise Complaint", to: "/raise-complaint" },
  { label: "Terms & Conditions", to: "/termsandcondition" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Returns Policy", to: "/return" },
  { label: "Shipping Policy", to: "/shippingpolicy" },
  { label: "FAQ", to: "/faq" },
];

const marketplaces = [
  {
    href: "https://www.amazon.in/stores/Ilik%C3%A4/page/4BEEF7C7-AFF6-4530-B62B-3A07943B7277?lp_asin=B0CLLG8RKP&ref_=ast_bln",
    src: amazon,
    alt: "Amazon",
  },
  {
    href: "https://www.flipkart.com/ilika-black-seed-hair-oil-prevents-premature-greying-soft-nourished/p/itmd21f91c22dfab?pid=HOLHFPX4WETW7YPK&lid=LSTHOLHFPX4WETW7YPKGOLVRA&hl_lid=&marketplace=FLIPKART&fm=eyJ3dHAiOiJyZWNvIiwicHJwdCI6InBwIiwibWlkIjoiZmFjdEJhc2VkUmVjb21tZW5kYXRpb24vcmVjZW50bHlWaWV3ZWQifQ%3D%3D&pageUID=1779183762586",
    src: flipcart,
    alt: "Flipkart",
  },
  {
    href: "https://www.meesho.com/ILIKASKINCARE",
    src: meesho,
    alt: "Meesho",
  },
];

const socials = [
  {
    href: "https://www.facebook.com/profile.php?id=100075034603295",
    src: facebook,
    alt: "Facebook",
  },
  {
    href: "https://www.youtube.com/channel/UC-oOVpDlsRaNrEi1a4dMOTg",
    src: youtube,
    alt: "YouTube",
  },
  {
    href: "https://www.instagram.com/ilikamumbai/",
    src: instagram,
    alt: "Instagram",
  },
];

const FooterLink = ({ to, icon: Icon, children, mobile = false }) => (
  <Link
    to={to}
    className={`flex items-center gap-2 text-inherit transition hover:translate-x-1 hover:opacity-80 ${
      mobile ? "text-[15px] leading-6" : "text-sm"
    }`}
  >
    {Icon ? <Icon size={mobile ? 16 : 15} className="shrink-0 opacity-80" /> : null}
    <span>{children}</span>
  </Link>
);

const Footer = ({ theme = "default" }) => {
  const isBlackTheme = theme === "black";
  const [openSection, setOpenSection] = useState("");

  const footerBg = isBlackTheme ? "bg-[#1f1235] text-[#f3ebff]" : "text-[#4c2020]";
  const accentText = isBlackTheme ? "text-[#d5bcff]" : "text-[#b25555]";
  const mutedText = isBlackTheme ? "text-[#decff8]" : "text-[#7a4a4a]";
  const borderTone = isBlackTheme ? "border-white/15" : "border-[#e2c1c1]";

  const mobileSections = [
    {
      key: "quick",
      title: "Quick Links",
      content: (
        <div className="space-y-3 pb-1 pt-4">
          {quickLinks.map((link) => (
            <FooterLink key={link.to} to={link.to} icon={link.icon} mobile>
              {link.label}
            </FooterLink>
          ))}
        </div>
      ),
    },
    {
      key: "company",
      title: "Company",
      content: (
        <div className="space-y-3 pb-1 pt-4">
          {companyLinks.map((link) => (
            <FooterLink key={link.to} to={link.to} icon={link.icon} mobile>
              {link.label}
            </FooterLink>
          ))}
        </div>
      ),
    },
    {
      key: "support",
      title: "Support",
      content: (
        <div className="space-y-3 pb-1 pt-4">
          {supportLinks.map((link) => (
            <FooterLink key={link.to} to={link.to} mobile>
              {link.label}
            </FooterLink>
          ))}
        </div>
      ),
    },
    {
      key: "contact",
      title: "Get In Touch",
      content: (
        <div className="space-y-3 pb-1 pt-4 text-sm leading-6">
          <div>
            <p className={isBlackTheme ? "font-semibold text-white" : "font-semibold text-[#6f1e1e]"}>
              Corporate Office Address
            </p>
            <p className={`mt-1 ${mutedText}`}>
              Office no. 201-202, Hirubai Residency
              <br />
              Virar (West) - 401303, Maharashtra, India.
            </p>
          </div>

          <a href="mailto:customersupport.ilika@gmail.com" className="flex items-start gap-3 transition hover:opacity-80">
            <Mail size={16} className="mt-1 shrink-0" />
            <span>customersupport.ilika@gmail.com</span>
          </a>

          <a href="tel:+919120879879" className="flex items-start gap-3 transition hover:opacity-80">
            <Phone size={16} className="mt-1 shrink-0" />
            <span>+91 92701 14738</span>
          </a>

          <div className="flex items-start gap-3">
            <MapPin size={16} className="mt-1 shrink-0" />
            <span>Monday - Saturday, 10:00 AM to 6:30 PM IST</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <footer
      className={footerBg}
      style={isBlackTheme ? undefined : { backgroundColor: "rgba(162, 29, 29, 0.17)" }}
    >
      <div className={isBlackTheme ? "bg-[#9569d0] py-1" : "MiniDivider-bg-color py-1"} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-5 xl:hidden">
          <div className="px-1 pt-1 text-center">
            <OptimizedImage
              src={logo}
              alt="Ilika"
              width="auto"
              height={48}
              className="mx-auto h-12"
            />
            <p className={`mx-auto mt-4 max-w-xs text-sm leading-7 ${mutedText}`}>
              Discover premium yet affordable skin care, hair care, and grooming
              essentials designed to make everyday beauty feel elegant, bright, and easy.
            </p>

            <p className={`mt-5 text-[15px] font-semibold uppercase tracking-[0.08em] ${accentText}`}>
              Also Available On
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {marketplaces.map(({ href, src, alt }) => (
                <a key={alt} href={href} target="_blank" rel="noopener noreferrer" aria-label={alt}>
                  <OptimizedImage
                    src={src}
                    alt={alt}
                    width={34}
                    height={34}
                    className="h-9 w-9 rounded-md bg-white p-1 transition hover:scale-110"
                  />
                </a>
              ))}
            </div>
          </div>

          <div className="border-t border-white/35">
            {mobileSections.map((section) => {
              const isOpen = openSection === section.key;

              return (
                <div key={section.key} className="border-b border-white/35">
                  <button
                    type="button"
                    onClick={() => setOpenSection(isOpen ? "" : section.key)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className={`text-[15px] font-semibold uppercase tracking-[0.08em] ${accentText}`}>
                      {section.title}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen ? <div className="pb-3">{section.content}</div> : null}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            {socials.map(({ href, src, alt }) => (
              <a key={alt} href={href} target="_blank" rel="noopener noreferrer" aria-label={alt}>
                <OptimizedImage
                  src={src}
                  alt={alt}
                  width={34}
                  height={34}
                  className="h-9 w-9 rounded-full bg-white p-1 transition hover:scale-110"
                />
              </a>
            ))}
          </div>
        </div>

        <div className="hidden xl:grid xl:grid-cols-5 xl:gap-6">
          <div className="space-y-3">
            <OptimizedImage src={logo} alt="Ilika" width="auto" height={44} className="h-11" />

            <p className={`max-w-sm text-xs leading-6 ${mutedText}`}>
              Discover premium yet affordable skin care, hair care, and grooming
              essentials designed to make everyday beauty feel elegant, bright, and easy.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className={`text-sm font-semibold uppercase tracking-[0.18em] ${accentText}`}>
              Quick Links
            </h4>
            <div className="grid grid-cols-1 gap-y-2">
              {quickLinks.map((link) => (
                <FooterLink key={link.to} to={link.to} icon={link.icon}>
                  {link.label}
                </FooterLink>
              ))}
            </div>

            <div className="space-y-1.5 pt-3">
              <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${accentText}`}>
                Also Available On
              </p>
              <div className="flex gap-3">
                {marketplaces.map(({ href, src, alt }) => (
                  <a key={alt} href={href} target="_blank" rel="noopener noreferrer" aria-label={alt}>
                    <OptimizedImage
                      src={src}
                      alt={alt}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-md bg-white p-1 transition hover:scale-110"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className={`text-sm font-semibold uppercase tracking-[0.18em] ${accentText}`}>
              Company
            </h4>
            <div className="grid grid-cols-1 gap-y-2">
              {companyLinks.map((link) => (
                <FooterLink key={link.to} to={link.to} icon={link.icon}>
                  {link.label}
                </FooterLink>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className={`text-sm font-semibold uppercase tracking-[0.18em] ${accentText}`}>
              Support
            </h4>
            <div className="grid grid-cols-1 gap-y-2">
              {supportLinks.map((link) => (
                <FooterLink key={link.to} to={link.to}>
                  {link.label}
                </FooterLink>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className={`text-sm font-semibold uppercase tracking-[0.18em] ${accentText}`}>
              Get In Touch
            </h4>

            <div className="mt-3 space-y-2.5 text-xs leading-5">
              <div>
                <p className={isBlackTheme ? "font-semibold text-white" : "font-semibold text-[#6f1e1e]"}>
                  Corporate Office Address
                </p>
                <p className={mutedText}>
                  Office no. 201-202, Hirubai Residency
                  <br />
                  Virar (West) - 401303, Maharashtra, India.
                </p>
              </div>

              <a href="mailto:customersupport.ilika@gmail.com" className="flex items-center gap-2 transition hover:opacity-80">
                <Mail size={13} className="shrink-0" />
                <span>customersupport.ilika@gmail.com</span>
              </a>

              <a href="tel:+919120879879" className="flex items-center gap-2 transition hover:opacity-80">
                <Phone size={13} className="shrink-0" />
                <span>+91 92701 14738</span>
              </a>

              <div className="flex items-center gap-2">
                <MapPin size={13} className="shrink-0" />
                <span>Monday - Saturday, 10:00 AM to 6:30 PM IST</span>
              </div>

              <div className="flex gap-3 pt-1">
                {socials.map(({ href, src, alt }) => (
                  <a key={alt} href={href} target="_blank" rel="noopener noreferrer" aria-label={alt}>
                    <OptimizedImage
                      src={src}
                      alt={alt}
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full bg-white p-1 transition hover:scale-110"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-6 flex flex-col gap-2 border-t ${borderTone} pt-4 text-xs sm:flex-row sm:items-center sm:justify-between`}>
          <p className={mutedText}>© 2026 Corporate Office Address | Powered by PTCGRAM Private Limited</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

