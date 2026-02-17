import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Offer from "../pages/Offer";
import Skin from "../pages/Skin";
import Hair from "../pages/Hair";
import Grooming from "../pages/Grooming";
import Ctm from "../pages/Ctm";
import Blog from "../pages/Blog";
import UserDetail from "../pages/UserDetail";
import BlogDetail from "../pages/BlogDetail";
import Contact from "../pages/Contact";
import About from "../pages/About";
import Privacy from "../pages/Privacy";
import ProductDetail from "../pages/ProductDetail";
import Return from "../pages/Return";
import TermsCondition from "../pages/TermsCondition";

import Login from "../pages/Login";
import Signup from "../pages/Signup";

import ProtectedRoute from "../components/ProtectedRoute";

// ADMIN
import AdminRoutes from "../admin/routes/AdminRoutes";
import AdminLogin from "../admin/pages/AdminLogin";
import AdminProtectedRoute from "../admin/components/AdminProtectedRoute";
import { AdminAuthProvider } from "../admin/context/AdminAuthContext";
import Checkout from "../pages/CheckOut";
import OrderSuccess from "../pages/OrderSuccess";
import ShippingPolicy from "../pages/ShippingPolicy";
import Faq from "../pages/Faq";
import NewArrival from "../pages/NewArrival";



const NavRoutes = () => {
  return (
    <AdminAuthProvider>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/offer" element={<Offer />} />
        <Route path="/checkout" element={<Checkout />} />

        <Route path="/skin" element={<Skin />} />
        <Route path="/hair" element={<Hair />} />
        <Route path="/grooming" element={<Grooming />} />
        <Route path="/newarrival" element={<NewArrival />} />

        <Route path="/skin/:category" element={<Skin />} />
        <Route path="/hair/:category" element={<Hair />} />
        <Route path="/grooming/:category" element={<Grooming />} />

        <Route path="/ctm" element={<Ctm />} />
        <Route path="/blog" element={<Blog />} />

        {/* 🔥 PROTECTED USER ROUTE */}
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserDetail />
            </ProtectedRoute>
          }
        />

        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/product/:id" element={<ProductDetail />} />

        <Route path="/privacy" element={<Privacy />} />
        <Route path="/termsandcondition" element={<TermsCondition />} />
        <Route path="/return" element={<Return />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/shippingpolicy" element={<ShippingPolicy />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/order-success/:id" element={<OrderSuccess/>}/>

        {/* USER AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ADMIN AUTH */}
        <Route path="/admin/login" element={<AdminLogin />} />


        {/* ADMIN PROTECTED */}
        <Route
          path="/admin/*"
          element={
            <AdminProtectedRoute>
              <AdminRoutes />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </AdminAuthProvider>
  );
};

export default NavRoutes;
