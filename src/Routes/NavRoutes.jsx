import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { trackPageView } from "../utils/pixel";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminProtectedRoute from "../admin/components/AdminProtectedRoute";
import { AdminAuthProvider } from "../admin/context/AdminAuthContext";
import { useSeo } from "../hooks/useSeo";

const Home = lazy(() => import("../pages/Home"));
const Offer = lazy(() => import("../pages/Offer"));
const Skin = lazy(() => import("../pages/Skin"));
const Hair = lazy(() => import("../pages/Hair"));
const Grooming = lazy(() => import("../pages/Grooming"));
const Ctm = lazy(() => import("../pages/Ctm"));
const Blog = lazy(() => import("../pages/Blog"));
const UserDetail = lazy(() => import("../pages/UserDetail"));
const BlogDetail = lazy(() => import("../pages/BlogDetail"));
const Contact = lazy(() => import("../pages/Contact"));
const Privacy = lazy(() => import("../pages/Privacy"));
const ProductDetail = lazy(() => import("../pages/ProductDetail"));
const Products = lazy(() => import("../pages/Products"));
const Return = lazy(() => import("../pages/Return"));
const TermsCondition = lazy(() => import("../pages/TermsCondition"));
const Login = lazy(() => import("../pages/Login"));
const Signup = lazy(() => import("../pages/Signup"));
const AdminRoutes = lazy(() => import("../admin/routes/AdminRoutes"));
const AdminLogin = lazy(() => import("../admin/pages/AdminLogin"));
const Checkout = lazy(() => import("../pages/CheckOut"));
const OrderSuccess = lazy(() => import("../pages/OrderSuccess"));
const ShippingPolicy = lazy(() => import("../pages/ShippingPolicy"));
const Faq = lazy(() => import("../pages/Faq"));
const NewArrival = lazy(() => import("../pages/NewArrival"));
const CreateCtm = lazy(() => import("../pages/CreateCtm"));
const HairCare = lazy(() => import("../pages/HairCare"));
const HairStyle = lazy(() => import("../pages/HairStyle"));
const Face = lazy(() => import("../pages/Face"));
const Body = lazy(() => import("../pages/Body"));
const FaceGrooming = lazy(() => import("../pages/FaceGrooming"));
const RollerAndGuasha = lazy(() => import("../pages/RollerAndGuasha"));
const HairRemoval = lazy(() => import("../pages/HairRemoval"));
const ShopAll = lazy(() => import("../pages/ShopAll"));
const About = lazy(() => import("../pages/About"));
const Combos = lazy(() => import("../pages/Combos"));
const ComboDetail = lazy(() => import("../pages/ComboDetail"));
const Feedback = lazy(() => import("../pages/Feedback"));
const WarrantyRegistration = lazy(() => import("../pages/WarrantyRegistration"));

const PixelPageTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
};

const getRouteSeo = (pathname = "") => {
  if (pathname === "/") return { title: "Home", description: "Elegant beauty, skincare, haircare, and grooming tools from Ilika." };
  if (pathname === "/offer") return { title: "Offers", description: "Discover latest Ilika offers and beauty deals." };
  if (pathname === "/checkout") return { title: "Checkout", description: "Secure checkout for your Ilika order." };
  if (pathname === "/skin") return { title: "Skin Care", description: "Explore Ilika skin care products and routines." };
  if (pathname === "/hair") return { title: "Hair Care", description: "Shop Ilika hair care and styling essentials." };
  if (pathname === "/grooming") return { title: "Grooming Tools", description: "Premium grooming tools by Ilika." };
  if (pathname === "/newarrival") return { title: "New Arrivals", description: "See the newest Ilika products and launches." };
  if (pathname === "/products") return { title: "All Products", description: "Browse all Ilika beauty and grooming products." };
  if (pathname === "/skin/face") return { title: "Face Care", description: "Face care products from Ilika." };
  if (pathname === "/skin/body") return { title: "Body Care", description: "Body care products from Ilika." };
  if (pathname === "/hair/care") return { title: "Hair Care Collection", description: "Targeted hair care from Ilika." };
  if (pathname === "/hair/styling") return { title: "Hair Styling", description: "Hair styling tools and products by Ilika." };
  if (pathname === "/grooming/roller") return { title: "Roller & Gua Sha", description: "Facial rollers and gua sha tools from Ilika." };
  if (pathname === "/grooming/face") return { title: "Face Grooming", description: "Face grooming tools by Ilika." };
  if (pathname === "/grooming/remover") return { title: "Hair Removal", description: "Hair removal tools from Ilika." };
  if (pathname === "/ctm") return { title: "Explore CTM", description: "Build your CTM skincare routine with Ilika." };
  if (pathname === "/ctmkit") return { title: "Create CTM Kit", description: "Customize your CTM kit with Ilika products." };
  if (pathname === "/blog") return { title: "Blog", description: "Beauty tips, guides, and updates from Ilika." };
  if (pathname.startsWith("/blog/")) return { title: "Blog Details", description: "Read Ilika blog articles and beauty insights." };
  if (pathname.startsWith("/product/")) return { title: "Product Details", description: "Explore product details, benefits, and pricing at Ilika." };
  if (pathname === "/shopall") return { title: "Shop All", description: "Shop the complete Ilika collection." };
  if (pathname === "/user") return { title: "My Account", description: "Manage your Ilika account and orders." };
  if (pathname === "/privacy") return { title: "Privacy Policy", description: "Read Ilika privacy policy." };
  if (pathname === "/termsandcondition") return { title: "Terms & Conditions", description: "Read Ilika terms and conditions." };
  if (pathname === "/return") return { title: "Return Policy", description: "Review Ilika return and refund policy." };
  if (pathname === "/about") return { title: "About Us", description: "Learn more about Ilika." };
  if (pathname === "/contact") return { title: "Contact Us", description: "Get in touch with Ilika support." };
  if (pathname === "/feedback") return { title: "Feedback", description: "Share your feedback with Ilika." };
  if (pathname === "/warranty-registration") return { title: "Warranty Registration", description: "Register import product warranty with Ilika support." };
  if (pathname === "/shippingpolicy") return { title: "Shipping Policy", description: "Read Ilika shipping policy." };
  if (pathname === "/faq") return { title: "FAQ", description: "Frequently asked questions about Ilika." };
  if (pathname.startsWith("/order-success/")) return { title: "Order Success", description: "Your Ilika order has been placed successfully." };
  if (pathname === "/combo") return { title: "Combo Deals", description: "Explore combo packs and bundle offers from Ilika." };
  if (pathname.startsWith("/combo/")) return { title: "Combo Details", description: "View combo pack details and savings at Ilika." };
  if (pathname === "/login") return { title: "Login", description: "Login to your Ilika account." };
  if (pathname === "/signup") return { title: "Sign Up", description: "Create your Ilika account." };
  if (pathname === "/admin/login") return { title: "Admin Login", description: "Ilika admin login portal." };
  if (pathname.startsWith("/admin")) return { title: "Admin Panel", description: "Ilika admin panel." };
  return { title: "Ilika", description: "Ilika beauty and grooming products." };
};

const RouteSeo = () => {
  const { pathname } = useLocation();
  const seo = getRouteSeo(pathname);
  const isAdminPath = pathname.startsWith("/admin");

  useSeo({
    title: `${seo.title} | Ilika`,
    description: seo.description,
    path: pathname,
    robots: isAdminPath ? "noindex, nofollow" : "index, follow",
  });

  return null;
};

const RouteLoader = () => <div className="min-h-screen" aria-busy="true" />;

const renderLazy = (Page) => (
  <Suspense fallback={<RouteLoader />}>
    <Page />
  </Suspense>
);

const NavRoutes = () => {
  return (
    <>
      <PixelPageTracker />
      <RouteSeo />
      <Routes>
        <Route path="/" element={renderLazy(Home)} />
        <Route path="/offer" element={renderLazy(Offer)} />
        <Route path="/checkout" element={renderLazy(Checkout)} />

        <Route path="/skin" element={renderLazy(Skin)} />
        <Route path="/hair" element={renderLazy(Hair)} />
        <Route path="/grooming" element={renderLazy(Grooming)} />
        <Route path="/newarrival" element={renderLazy(NewArrival)} />
        <Route path="/products" element={renderLazy(Products)} />

        <Route path="/skin/face" element={renderLazy(Face)} />
        <Route path="/skin/body" element={renderLazy(Body)} />
        <Route path="/hair/care" element={renderLazy(HairCare)} />
        <Route path="/hair/styling" element={renderLazy(HairStyle)} />
        <Route path="/grooming/roller" element={renderLazy(RollerAndGuasha)} />
        <Route path="/grooming/face" element={renderLazy(FaceGrooming)} />
        <Route path="/grooming/remover" element={renderLazy(HairRemoval)} />

        <Route path="/ctm" element={renderLazy(Ctm)} />
        <Route path="/ctmkit" element={renderLazy(CreateCtm)} />

        <Route path="/blog" element={renderLazy(Blog)} />
        <Route path="/shopall" element={renderLazy(ShopAll)} />

        <Route
          path="/user"
          element={
            <ProtectedRoute>
              {renderLazy(UserDetail)}
            </ProtectedRoute>
          }
        />

        <Route path="/blog/:id" element={renderLazy(BlogDetail)} />
        <Route path="/product/:slug" element={renderLazy(ProductDetail)} />

        <Route path="/privacy" element={renderLazy(Privacy)} />
        <Route path="/termsandcondition" element={renderLazy(TermsCondition)} />
        <Route path="/return" element={renderLazy(Return)} />
        <Route path="/about" element={renderLazy(About)} />
        <Route path="/contact" element={renderLazy(Contact)} />
        <Route path="/feedback" element={renderLazy(Feedback)} />
        <Route path="/warranty-registration" element={renderLazy(WarrantyRegistration)} />
        <Route path="/shippingpolicy" element={renderLazy(ShippingPolicy)} />
        <Route path="/faq" element={renderLazy(Faq)} />
        <Route path="/order-success/:id" element={renderLazy(OrderSuccess)} />
        <Route path="/combo" element={renderLazy(Combos)} />
        <Route path="/combo/:id" element={renderLazy(ComboDetail)} />

        <Route path="/login" element={renderLazy(Login)} />
        <Route path="/signup" element={renderLazy(Signup)} />

        <Route
          path="/admin/login"
          element={<AdminAuthProvider>{renderLazy(AdminLogin)}</AdminAuthProvider>}
        />

        <Route
          path="/admin/*"
          element={
            <AdminAuthProvider>
              <AdminProtectedRoute>
                {renderLazy(AdminRoutes)}
              </AdminProtectedRoute>
            </AdminAuthProvider>
          }
        />
      </Routes>
    </>
  );
};

export default NavRoutes;
