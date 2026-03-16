import React, { useState } from "react";
import { Eye, Search, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useCartEvents } from "../../context/CartEventContext";

const CartProductList = () => {
  const { events } = useCartEvents();
  const navigate   = useNavigate();
  const [search, setSearch] = useState("");

  // Group events by productId, count how many times each was added
  const productMap = {};
  events.forEach(e => {
    if (!productMap[e.productId]) {
      productMap[e.productId] = { ...e, count: 0 };
    }
    productMap[e.productId].count++;
  });
  const products = Object.values(productMap).sort((a, b) => b.count - a.count);

  const filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cart Interest</h1>
          <p className="text-sm text-gray-400 mt-0.5">{products.length} products added to carts · {events.length} total events</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ border: "1px solid #EBEBEB" }}>
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent focus:outline-none placeholder-gray-300"
        />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB" }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <ShoppingCart size={40} className="mb-3" />
            <p className="text-sm">No cart activity yet</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                    {["#", "Product", "Price", "Added to Cart", "View"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#888" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.productId} className="hover:bg-gray-50/70 transition-colors" style={{ borderBottom: "1px solid #F5F5F5" }}>
                      <td className="px-5 py-4 text-xs text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} alt={p.name}
                              className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center">
                              <ShoppingCart size={16} className="text-gray-300" />
                            </div>
                          )}
                          <span className="font-semibold text-gray-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">₹{p.price}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">
                          <ShoppingCart size={11} /> {p.count}×
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => navigate(`/admin/cart-products/${p.productId}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((p, i) => (
                <div key={p.productId} className="p-4 flex items-center gap-3">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-gray-900">₹{p.price}</span>
                      <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">{p.count}× added</span>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/admin/cart-products/${p.productId}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <Eye size={14} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default CartProductList;
