import React from "react";
import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import ProductList from "../pages/products/ProductList";
import AddProduct from "../pages/products/AddProduct";
import EditProduct from "../pages/products/EditProduct";
import CategoryList from "../pages/categories/CategoryList";
import AddCategory from "../pages/categories/AddCategory";
import OrderList from "../pages/Orders/OrderList";
import OrderDetail from "../pages/Orders/OrderDetail";
import UserList from "../pages/Users/UserList";
import UserDetail from "../pages/Users/UserDetail";
import BlogList from "../pages/Blogs/BlogList";
import AddBlog from "../pages/Blogs/AddBlog";
import ViewBlogDetails from "../pages/Blogs/ViewBlogDetails";
import Report from "../pages/Report/Report";
import ComboList from "../pages/Combo/ComboList";
import AddCombo from "../pages/Combo/AddCombo";
import EditCombo from "../pages/Combo/EditCombo";
import CartProductList from "../pages/cartproducts/CartProductList";
import CartProductDetail from "../pages/cartproducts/CartProductDetail";
import ReviewList from "../pages/Reviews/ReviewList";
import ReviewDetail from "../pages/Reviews/ReviewDetail";
import AdminLog from "../pages/AdminLog/AdminLog";
import BlogComments from "../pages/Blogs/BlogComments";
import AdminList from "../pages/Admins/AdminList";
import CouponList from "../pages/Coupons/CouponList";

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
import NotificationList from "../pages/Notification/NotificationList";
import NotificationDetail from "../pages/Notification/NotificationDetail";
import FeedbackList from "../pages/Feedback/FeedbackList";
import FeedbackDetail from "../pages/Feedback/FeedbackDetail";

const AdminRoutes = () => {
  return (
    <CategoryProvider>
      <CouponProvider>
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

                        <Route path="admins" element={<AdminList />} />

                        <Route path="products" element={<ProductList />} />
                        <Route path="products/add" element={<AddProduct />} />
                        <Route path="products/edit/:id" element={<EditProduct />} />
                        <Route path="coupons" element={<CouponList />} />

                        <Route path="combos" element={<ComboList />} />
                        <Route path="combos/add" element={<AddCombo />} />
                        <Route path="combos/edit/:id" element={<EditCombo />} />

                        <Route path="categories" element={<CategoryList />} />
                        <Route path="categories/add" element={<AddCategory />} />

                        <Route path="orders" element={<OrderList />} />
                        <Route path="orders/:id" element={<OrderDetail />} />

                        <Route path="cart-products" element={<CartProductList />} />
                        <Route path="cart-products/:productId" element={<CartProductDetail />} />

                        <Route path="users" element={<UserList />} />
                        <Route path="users/:id" element={<UserDetail />} />

                        <Route path="reviews" element={<ReviewList />} />
                        <Route path="reviews/:productId/:index" element={<ReviewDetail />} />

                        <Route path="blogs" element={<BlogList />} />
                        <Route path="blogs/create" element={<AddBlog />} />
                        <Route path="blogs/:id" element={<ViewBlogDetails />} />
                        <Route path="blog-comments" element={<BlogComments />} />

                        <Route path="reports" element={<Report />} />
                        <Route path="log" element={<AdminLog />} />

                        <Route path="notifications" element={<NotificationList />} />
                        <Route path="notifications/:productId" element={<NotificationDetail />} />
                        <Route path="feedback" element={<FeedbackList />} />
                        <Route path="feedback/:id" element={<FeedbackDetail />} />
                      </Routes>
                    </ReviewProvider>
                  </CartEventProvider>
                </BlogProvider>
              </UserProvider>
            </AdminStatsProvider>
          </OrderProvider>
        </ComboProvider>
      </ProductProvider>
      </CouponProvider>
    </CategoryProvider>
  );
};

export default AdminRoutes;
