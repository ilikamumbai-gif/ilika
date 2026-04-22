import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { trackPageView } from "../utils/pixel";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminProtectedRoute from "../admin/components/AdminProtectedRoute";
import { AdminAuthProvider } from "../admin/context/AdminAuthContext";

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

const PixelPageTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

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
