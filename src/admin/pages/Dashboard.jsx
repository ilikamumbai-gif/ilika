import React from "react";
import { Package, Users, ShoppingCart, IndianRupee, BookOpen, Layers, Boxes, Eye, Star } from "lucide-react";
import StatCard from "../components/StatCard";
import AdminLayout from "../components/AdminLayout";
import { useOrders } from "../context/OrderContext";
import { useProducts } from "../context/ProductContext";
import { useUsers } from "../context/UserContext";
import { useBlog } from "../context/BlogProvider";
import { useCategories } from "../context/CategoryContext";
import { useCombos } from "../context/ComboContext";
import { useCartEvents } from "../context/CartEventContext";
import { useReviews } from "../context/ReviewContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {

  const { orders } = useOrders();
  const { products } = useProducts();
  const { users } = useUsers();
  const { blogs } = useBlog();
  const { categories } = useCategories();
  const { combos } = useCombos();
  const { events } = useCartEvents();
  const navigate = useNavigate();
  const { reviews } = useReviews();

  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalUsers = users.length;
  const totalBlogs = blogs.length;
  const totalCategories = categories.length;
  const totalCartInterest = events.length;
  const totalReviews = reviews.length;
  const totalCombos = combos.length;

  const totalRevenue = orders.reduce((a, o) => a + o.total, 0);

  return (
    <AdminLayout>

      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div onClick={() => navigate("/admin/products")} className="cursor-pointer">
          <StatCard
            title="Total Products"
            value={totalProducts}
            icon={Package}
            color="bg-indigo-100"
            textColor="text-indigo-600"
          />
        </div>

        <div onClick={() => navigate("/admin/orders")} className="cursor-pointer">
          <StatCard
            title="Total Orders"
            value={totalOrders}
            icon={ShoppingCart}
            color="bg-green-100"
            textColor="text-green-600"
          />
        </div>

        <div onClick={() => navigate("/admin/users")} className="cursor-pointer">
          <StatCard
            title="Users"
            value={totalUsers}
            icon={Users}
            color="bg-yellow-100"
            textColor="text-yellow-600"
          />
        </div>

        <div onClick={() => navigate("/admin/orders")} className="cursor-pointer">
          <StatCard
            title="Revenue"
            value={totalRevenue}
            icon={IndianRupee}
            color="bg-pink-100"
            textColor="text-pink-600"
          />
        </div>

        <div onClick={() => navigate("/admin/blogs")} className="cursor-pointer">
          <StatCard
            title="Blogs"
            value={totalBlogs}
            icon={BookOpen}
            color="bg-purple-100"
            textColor="text-purple-600"
          />
        </div>

        <div onClick={() => navigate("/admin/categories")} className="cursor-pointer">
          <StatCard
            title="Categories"
            value={totalCategories}
            icon={Layers}
            color="bg-blue-100"
            textColor="text-blue-600"
          />
        </div>

        <div onClick={() => navigate("/admin/combos")} className="cursor-pointer">
          <StatCard
            title="Combos"
            value={totalCombos}
            icon={Boxes}
            color="bg-orange-100"
            textColor="text-orange-600"
          />
        </div>
        <div
          onClick={() => navigate("/admin/cart-products")}
          className="cursor-pointer"
        >
          <StatCard
            title="Cart Interest"
            value={totalCartInterest}
            icon={Eye}
            color="bg-red-100"
            textColor="text-red-600"
          />
        </div>

        <div
          onClick={() => navigate("/admin/reviews ")}
          className="cursor-pointer"
        >
          <StatCard
            title="Reviews"
            value={totalReviews}
            icon={Star}
            color="bg-teal-100"
            textColor="text-teal-600"
          />
        </div>

      </div>

    </AdminLayout>
  );
};

export default Dashboard;