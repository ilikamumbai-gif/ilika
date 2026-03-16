import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Eye, BookOpen, Search } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useBlog } from "../../context/BlogProvider";
import { logActivity } from "../../Utils/logActivity";

const BlogList = () => {
  const { blogs, deleteBlog } = useBlog();
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleDelete = async (blog) => {
    if (!window.confirm("Delete this blog?")) return;
    try {
      setDeletingId(blog.id);
      await deleteBlog(blog.id);
      await logActivity(`Deleted blog: ${blog.title}`);
    } catch (err) {
      alert("Failed to delete blog");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = blogs.filter(b =>
    !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blogs</h1>
          <p className="text-sm text-gray-400 mt-0.5">{blogs.length} published posts</p>
        </div>
        <Link
          to="/admin/blogs/create"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition"
          style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}
        >
          <Plus size={16} /> Add Blog
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ border: "1px solid #EBEBEB" }}>
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search blogs by title or author…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent focus:outline-none placeholder-gray-300"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <BookOpen size={48} className="mb-3" />
          <p className="text-sm">No blogs yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((blog) => (
            <div
              key={blog.id}
              className="bg-white rounded-2xl overflow-hidden group hover:-translate-y-0.5 transition-all duration-200"
              style={{ border: "1px solid #EBEBEB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              {/* Image */}
              <div className="relative h-44 bg-gray-100 overflow-hidden">
                {blog.image ? (
                  <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={32} className="text-gray-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-white/90 text-gray-600 shadow-sm">
                    {formatDate(blog.createdAt)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">{blog.title}</h3>
                {blog.author && (
                  <p className="text-xs text-gray-400 mb-2">by {blog.author}</p>
                )}
                {blog.excerpt && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{blog.excerpt}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid #F5F5F5" }}>
                  <Link
                    to={`/admin/blogs/${blog.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition"
                  >
                    <Eye size={13} /> View
                  </Link>
                  <button
                    onClick={() => handleDelete(blog)}
                    disabled={deletingId === blog.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    {deletingId === blog.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default BlogList;
