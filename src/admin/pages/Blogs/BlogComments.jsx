import React, { useEffect, useState } from "react";
import { Trash2, MessageSquare, Search } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

const BlogComments = () => {
  const API = import.meta.env.VITE_API_URL;
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts?._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  useEffect(() => {
    fetch(`${API}/api/admin/all-comments`)
      .then(r => r.json())
      .then(d => setComments(d))
      .finally(() => setLoading(false));
  }, []);

  const deleteComment = async (blogId, commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    await fetch(`${API}/api/admin/comments/${blogId}/${commentId}`, { method: "DELETE" });
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const filtered = comments.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.message?.toLowerCase().includes(search.toLowerCase()) ||
    c.blogTitle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blog Comments</h1>
          <p className="text-sm text-gray-400 mt-0.5">{comments.length} total comments</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ border: "1px solid #EBEBEB" }}>
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, message, or blog title…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent focus:outline-none placeholder-gray-300"
        />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <MessageSquare size={40} className="mb-3" />
            <p className="text-sm">No comments found</p>
          </div>
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                  {["Commenter", "Blog", "Message", "Date", "Action"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#888" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors" style={{ borderBottom: "1px solid #F5F5F5" }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}>
                          {c.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="font-semibold text-gray-800">{c.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-lg">
                        {c.blogTitle || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-gray-600 text-sm truncate">{c.message}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => deleteComment(c.blogId, c.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile cards */}
        {!loading && filtered.length > 0 && (
          <div className="md:hidden divide-y divide-gray-100">
            {filtered.map(c => (
              <div key={c.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-blue-600">{c.blogTitle}</p>
                  </div>
                  <button onClick={() => deleteComment(c.blogId, c.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-sm text-gray-500">{c.message}</p>
                <p className="text-xs text-gray-400">{formatDate(c.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BlogComments;
