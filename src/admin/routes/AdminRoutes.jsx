import { Routes, Route } from "react-router-dom";

// Pages
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

// ✅ NEW PAGES
import BlogList from "../pages/Blogs/BlogList";
import AddBlog from "../pages/Blogs/AddBlog";
import ViewBlogDetails from "../pages/Blogs/ViewBlogDetails";
import Report from "../pages/Report/Report";

// Contexts
import { ProductProvider } from "../context/ProductContext";
import { CategoryProvider } from "../context/CategoryContext";
import { OrderProvider } from "../context/OrderContext";
import { UserProvider } from "../context/UserContext";
import { AdminAuthProvider } from "../context/AdminAuthContext";
import { AdminStatsProvider } from "../context/AdminStatsContext";
import BlogProvider from "../context/BlogProvider"; // ✅ NEW

const AdminRoutes = () => {
  return (
    <AdminAuthProvider>
      <CategoryProvider>
        <ProductProvider>
          <OrderProvider>
            <AdminStatsProvider>
              <UserProvider>
                <BlogProvider> {/* ✅ ADDED */}
                  
                  <Routes>
                    <Route index element={<Dashboard />} />

                    {/* PRODUCTS */}
                    <Route path="products" element={<ProductList />} />
                    <Route path="products/add" element={<AddProduct />} />
                    <Route path="products/edit/:id" element={<EditProduct />} />

                    {/* CATEGORIES */}
                    <Route path="categories" element={<CategoryList />} />
                    <Route path="categories/add" element={<AddCategory />} />

                    {/* ORDERS */}
                    <Route path="orders" element={<OrderList />} />
                    <Route path="orders/:id" element={<OrderDetail />} />
                    <Route path="orders" element={<OrderList />} />


                    {/* USERS */}
                    <Route path="users" element={<UserList />} />
                    <Route path="users/:id" element={<UserDetail />} />

                    {/* ✅ BLOGS */}
                    <Route path="blogs" element={<BlogList />} />
                    <Route path="blogs/create" element={<AddBlog />} />
                    <Route path="blogs/:id" element={<ViewBlogDetails />} />

                    {/* ✅ REPORTS */}
                    <Route path="reports" element={<Report />} />

                  </Routes>

                </BlogProvider>
              </UserProvider>
            </AdminStatsProvider>
          </OrderProvider>
        </ProductProvider>
      </CategoryProvider>
    </AdminAuthProvider>
  );
};

export default AdminRoutes;
