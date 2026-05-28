import React, { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Search, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useProducts } from "../../context/ProductContext";
import { useCategories } from "../../context/CategoryContext";

const FilterSelect = ({ value, onChange, children }) => (
  <div className="relative">
    <select value={value} onChange={onChange}
      className="h-9 pl-3 pr-8 text-sm border rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
      style={{ border: "1px solid #E0E0E0", color: "#444" }}>
      {children}
    </select>
    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
      <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
    </div>
  </div>
);

const ProductList = () => {
  const navigate = useNavigate();
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatus]     = useState("");
  const [stockFilter, setStock]       = useState("");
  const [categoryFilter, setCategory] = useState("");
  const { products, deleteProduct, fetchProducts } = useProducts();
  const { categories } = useCategories();

  useEffect(() => { fetchProducts(); }, [categories.length]);

  const getCategoryNames = (ids = []) =>
    ids.map(id => categories.find(c => String(c.id) === String(id))?.name).filter(Boolean).join(", ") || "—";

  const filtered = products.filter(p =>
    (!search        || p.name?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter  || (statusFilter === "active" ? p.isActive !== false : p.isActive === false)) &&
    (!stockFilter   || (stockFilter === "in"      ? p.inStock !== false  : p.inStock === false)) &&
    (!categoryFilter || p.categoryIds?.includes(categoryFilter))
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await deleteProduct(id);
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{products.length} products in catalogue</p>
        </div>
        <button onClick={() => navigate("/admin/products/add")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-center" style={{ border: "1px solid #EBEBEB" }}>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
            style={{ border: "1px solid #E0E0E0" }} />
        </div>
        <FilterSelect value={statusFilter} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FilterSelect>
        <FilterSelect value={stockFilter} onChange={e => setStock(e.target.value)}>
          <option value="">All Stock</option>
          <option value="in">In Stock</option>
          <option value="out">Out of Stock</option>
        </FilterSelect>
        <FilterSelect value={categoryFilter} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </FilterSelect>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB" }}>
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                {["Product", "Category", "Price", "Status", "Stock", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#888" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-300"><Package size={36} /><p className="text-sm">No products found</p></div>
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/70 transition-colors" style={{ borderBottom: "1px solid #F5F5F5" }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {(p.images?.[0] || p.image) && (
                        <img loading="lazy" src={p.images?.[0] || p.image} alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" />
                      )}
                      <span className="font-semibold text-gray-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{getCategoryNames(p.categoryIds)}</td>
                  <td className="px-5 py-4 font-bold text-gray-900">₹{p.price}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${p.isActive === false ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                      {p.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${p.inStock === false ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}>
                      {p.inStock === false ? "Out of Stock" : "In Stock"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/admin/products/edit/${p.id}`)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map(p => (
            <div key={p.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {(p.images?.[0] || p.image) && (
                  <img loading="lazy" src={p.images?.[0] || p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">₹{p.price}</p>
                  <div className="flex gap-1.5 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive === false ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>{p.isActive === false ? "Inactive" : "Active"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.inStock === false ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"}`}>{p.inStock === false ? "Out" : "In Stock"}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => navigate(`/admin/products/edit/${p.id}`)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(p.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductList;
