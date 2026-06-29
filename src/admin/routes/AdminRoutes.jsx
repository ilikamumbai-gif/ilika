import React from "react";
import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import AnalyticsBoard from "../pages/Analytics/AnalyticsBoard";
import LocationAnalytics from "../pages/Analytics/LocationAnalytics";
import ProductList from "../pages/products/ProductList";
import AddProduct from "../pages/products/AddProduct";
import EditProduct from "../pages/products/EditProduct";
import ViewProductDetails from "../pages/products/ViewProductDetails";
import CategoryList from "../pages/categories/CategoryList";
import AddCategory from "../pages/categories/AddCategory";
import OrderList from "../pages/Orders/OrderList";
import OrderDetail from "../pages/Orders/OrderDetail";
import UserList from "../pages/Users/UserList";
import UserDetail from "../pages/Users/UserDetailConnected";
import BlogList from "../pages/Blogs/BlogList";
import AddBlog from "../pages/Blogs/AddBlog";
import ViewBlogDetails from "../pages/Blogs/ViewBlogDetails";
import Report from "../pages/Report/Report";
import ComboList from "../pages/Combo/ComboList";
import AddCombo from "../pages/Combo/AddCombo";
import EditCombo from "../pages/Combo/EditCombo";
import CartProductList from "../pages/cartproducts/CartProductList";
import CartProductDetail from "../pages/cartproducts/CartProductDetailConnected";
import ReviewList from "../pages/Reviews/ReviewList";
import ReviewDetail from "../pages/Reviews/ReviewDetail";
import AdminLog from "../pages/AdminLog/AdminLog";
import BlogComments from "../pages/Blogs/BlogComments";
import AdminList from "../pages/Admins/AdminList";
import CouponList from "../pages/Coupons/CouponList";
import BannerList from "../pages/Banners/BannerList";
import SocialFeedList from "../pages/SocialFeed/SocialFeedList";
import LeadList from "../pages/Leads/LeadList";

import { ProductProvider } from "../context/ProductContext";
import { CategoryProvider } from "../context/CategoryContext";
import { OrderProvider } from "../context/OrderContext";
import { UserProvider } from "../context/UserContext";
import { AdminStatsProvider } from "../context/AdminStatsContext";
import BlogProvider from "../context/BlogProvider";
import { ComboProvider } from "../context/ComboContext";
import { CartEventProvider } from "../context/CartEventContext";
import { ReviewProvider } from "../context/ReviewContext";
import { CouponProvider } from "../context/CouponContext";
import { BannerProvider } from "../context/BannerContext";
import NotificationList from "../pages/Notification/NotificationList";
import NotificationDetail from "../pages/Notification/NotificationDetailConnected";
import FeedbackList from "../pages/Feedback/FeedbackList";
import FeedbackDetail from "../pages/Feedback/FeedbackDetail";
import WarrantyList from "../pages/Warranty/WarrantyList";
import WarrantyDetail from "../pages/Warranty/WarrantyDetail";
import SupportTicketList from "../pages/SupportTickets/SupportTicketList";
import SupportTicketDetail from "../pages/SupportTickets/SupportTicketDetail";
import AdminPermissionRoute from "../components/AdminPermissionRoute";

const withPermission = (permission, element) => (
  <AdminPermissionRoute permission={permission}>{element}</AdminPermissionRoute>
);

const AdminRoutes = () => {
  return (
    <CategoryProvider>
      <CouponProvider>
        <BannerProvider>
          <ProductProvider>
            <ComboProvider>
              <OrderProvider>
                <AdminStatsProvider>
                  <UserProvider>
                    <BlogProvider>
                      <CartEventProvider>
                        <ReviewProvider>
                        <Routes>
                        <Route index element={<Dashboard />} />
                        <Route path="analytics" element={withPermission("analytics", <AnalyticsBoard />)} />
                        <Route path="location-analytics" element={withPermission("analytics", <LocationAnalytics />)} />

                        <Route path="admins" element={withPermission("admins", <AdminList />)} />

                        <Route path="products" element={withPermission("products", <ProductList />)} />
                        <Route path="products/add" element={withPermission("products", <AddProduct />)} />
                        <Route path="products/edit/:id" element={withPermission("products", <EditProduct />)} />
                        <Route path="products/view/:id" element={withPermission("products", <ViewProductDetails />)} />
                        <Route path="coupons" element={withPermission("coupons", <CouponList />)} />

                        <Route path="combos" element={withPermission("combos", <ComboList />)} />
                        <Route path="combos/add" element={withPermission("combos", <AddCombo />)} />
                        <Route path="combos/edit/:id" element={withPermission("combos", <EditCombo />)} />

                        <Route path="categories" element={withPermission("categories", <CategoryList />)} />
                        <Route path="categories/add" element={withPermission("categories", <AddCategory />)} />
                        <Route path="banners" element={withPermission("banners", <BannerList />)} />
                        <Route path="social-feed" element={withPermission("blogs", <SocialFeedList />)} />

                        <Route path="orders" element={withPermission("orders", <OrderList />)} />
                        <Route path="orders/:id" element={withPermission("orders", <OrderDetail />)} />
                        <Route path="leads" element={withPermission("orders", <LeadList />)} />

                        <Route path="cart-products" element={withPermission("cart-products", <CartProductList />)} />
                        <Route path="cart-products/:productId" element={withPermission("cart-products", <CartProductDetail />)} />

                        <Route path="users" element={withPermission("users", <UserList />)} />
                        <Route path="users/:id" element={withPermission("users", <UserDetail />)} />

                        <Route path="reviews" element={withPermission("reviews", <ReviewList />)} />
                        <Route path="reviews/:productId/:index" element={withPermission("reviews", <ReviewDetail />)} />

                        <Route path="blogs" element={withPermission("blogs", <BlogList />)} />
                        <Route path="blogs/create" element={withPermission("blogs", <AddBlog />)} />
                        <Route path="blogs/edit/:id" element={withPermission("blogs", <AddBlog />)} />
                        <Route path="blogs/:id" element={withPermission("blogs", <ViewBlogDetails />)} />
                        <Route path="blog-comments" element={withPermission("blogs", <BlogComments />)} />

                        <Route path="reports" element={withPermission("reports", <Report />)} />
                        <Route path="log" element={withPermission("logs", <AdminLog />)} />

                        <Route path="notifications" element={withPermission("notifications", <NotificationList />)} />
                        <Route path="notifications/:productId" element={withPermission("notifications", <NotificationDetail />)} />
                        <Route path="feedback" element={withPermission("feedback", <FeedbackList />)} />
                        <Route path="feedback/:id" element={withPermission("feedback", <FeedbackDetail />)} />
                        <Route path="support-tickets" element={withPermission("warranty", <SupportTicketList />)} />
                        <Route path="support-tickets/:id" element={withPermission("warranty", <SupportTicketDetail />)} />
                        <Route path="warranty" element={withPermission("warranty", <WarrantyList />)} />
                        <Route path="warranty/:id" element={withPermission("warranty", <WarrantyDetail />)} />
                        </Routes>
                      </ReviewProvider>
                    </CartEventProvider>
                  </BlogProvider>
                </UserProvider>
              </AdminStatsProvider>
            </OrderProvider>
          </ComboProvider>
        </ProductProvider>
      </BannerProvider>
      </CouponProvider>
    </CategoryProvider>
  );
};

export default AdminRoutes;
