import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { app } from "../../../firebase/firebaseConfig";
import AdminLayout from "../../components/AdminLayout";
import { logActivity } from "../../Utils/logActivity";

const API = import.meta.env.VITE_API_URL;
const storage = getStorage(app);

const normalizeExternalLink = (url = "") => {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

const FilterSelect = ({ value, onChange, children }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className="h-9 pl-3 pr-8 text-sm border rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
      style={{ border: "1px solid #E0E0E0", color: "#444" }}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
      <svg width="10" height="6" viewBox="0 0 10 6">
        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

const defaultForm = {
  title: "",
  mediaType: "image",
  mediaUrl: "",
  thumbnailUrl: "",
  content: "",
  postLink: "",
  sortOrder: 0,
  isActive: true,
};

const SocialFeedList = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mediaFilter, setMediaFilter] = useState("");

  const fetchItems = async () => {
    const res = await fetch(`${API}/api/social-feed`);
    if (!res.ok) throw new Error("Failed to fetch social feed");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchItems().catch(() => setItems([]));
  }, []);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const orderDiff = Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return String(a?.title || "").localeCompare(String(b?.title || ""));
      }),
    [items]
  );

  const filteredItems = useMemo(
    () =>
      sortedItems.filter((item) => {
        const title = String(item?.title || "").toLowerCase();
        const caption = String(item?.content || "").toLowerCase();
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || title.includes(q) || caption.includes(q);
        const matchesStatus =
          !statusFilter ||
          (statusFilter === "active" ? item?.isActive !== false : item?.isActive === false);
        const matchesMedia = !mediaFilter || item?.mediaType === mediaFilter;
        return matchesSearch && matchesStatus && matchesMedia;
      }),
    [sortedItems, search, statusFilter, mediaFilter]
  );

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId("");
  };

  const uploadMedia = async (file, folder = "social-feed") => {
    const path = `${folder}/${crypto.randomUUID()}-${file.name}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        mediaType: form.mediaType === "video" ? "video" : "image",
        mediaUrl: form.mediaUrl.trim(),
        thumbnailUrl: form.thumbnailUrl.trim(),
        content: form.content.trim(),
        postLink: normalizeExternalLink(form.postLink),
        sortOrder: Number(form.sortOrder || 0),
        isActive: Boolean(form.isActive),
      };

      const endpoint = editingId
        ? `${API}/api/social-feed/${editingId}`
        : `${API}/api/social-feed`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save social post");
      }

      await logActivity(`${editingId ? "Updated" : "Added"} social post: ${payload.title || "Untitled"}`);
      await fetchItems();
      resetForm();
    } catch (error) {
      alert(error.message || "Failed to save social post");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Delete this social feed item?")) return;
    const id = item.id || item._id;
    const res = await fetch(`${API}/api/social-feed/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete social feed item");
      return;
    }
    await logActivity(`Deleted social post: ${item.title || "Untitled"}`);
    if (editingId === id) resetForm();
    await fetchItems();
  };

  const startEdit = (item) => {
    const id = item.id || item._id;
    setEditingId(id);
    setForm({
      title: item.title || "",
      mediaType: item.mediaType === "video" ? "video" : "image",
      mediaUrl: item.mediaUrl || "",
      thumbnailUrl: item.thumbnailUrl || "",
      content: item.content || "",
      postLink: item.postLink || "",
      sortOrder: Number(item.sortOrder || 0),
      isActive: item.isActive !== false,
    });
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Social Feed</h1>
          <p className="text-sm text-gray-400 mt-0.5">{sortedItems.length} posts in feed</p>
        </div>
        <button
          type="submit"
          form="social-feed-form"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-70"
          style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}
        >
          <Plus size={16} />
          {saving ? "Saving..." : editingId ? "Update Post" : "Add Post"}
        </button>
      </div>

      <form
        id="social-feed-form"
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-4 mb-4"
        style={{ border: "1px solid #EBEBEB" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Title (optional)"
            className="h-10 px-3 border rounded-lg"
          />

          <select
            value={form.mediaType}
            onChange={(e) => setForm((prev) => ({ ...prev, mediaType: e.target.value }))}
            className="h-10 px-3 border rounded-lg"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>

          <div className="flex gap-2">
            <input
              value={form.mediaUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, mediaUrl: e.target.value }))}
              placeholder={form.mediaType === "video" ? "Video URL" : "Image URL"}
              className="h-10 px-3 border rounded-lg flex-1"
              required
            />
            <label className="h-10 px-3 border rounded-lg inline-flex items-center gap-2 cursor-pointer text-sm">
              <Upload size={14} /> Upload
              <input
                type="file"
                accept={form.mediaType === "video" ? "video/*" : "image/*"}
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadMedia(file, form.mediaType === "video" ? "social-videos" : "social-images");
                  setForm((prev) => ({ ...prev, mediaUrl: url }));
                }}
              />
            </label>
          </div>

          <input
            value={form.thumbnailUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
            placeholder="Thumbnail URL (optional for videos)"
            className="h-10 px-3 border rounded-lg"
          />

          <textarea
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            placeholder="Content/Caption"
            className="min-h-[96px] px-3 py-2 border rounded-lg md:col-span-2"
            required
          />

          <input
            value={form.postLink}
            onChange={(e) => setForm((prev) => ({ ...prev, postLink: e.target.value }))}
            placeholder="Post URL (Instagram/Facebook link)"
            className="h-10 px-3 border rounded-lg md:col-span-2"
          />

          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
            placeholder="Sort order"
            className="h-10 px-3 border rounded-lg"
          />

          <label className="h-10 px-3 border rounded-lg inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Active
          </label>
        </div>

        <div className="flex gap-2 mt-4">
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border text-sm">
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-center" style={{ border: "1px solid #EBEBEB" }}>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
            style={{ border: "1px solid #E0E0E0" }}
          />
        </div>
        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FilterSelect>
        <FilterSelect value={mediaFilter} onChange={(e) => setMediaFilter(e.target.value)}>
          <option value="">All Media</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </FilterSelect>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB" }}>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                {["Post", "Type", "Status", "Order", "Preview", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#888" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <ImageIcon size={36} />
                      <p className="text-sm">No social posts found</p>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.map((item) => {
                const id = item.id || item._id;
                const isVideo = item.mediaType === "video";
                return (
                  <tr key={id} className="hover:bg-gray-50/70 transition-colors" style={{ borderBottom: "1px solid #F5F5F5" }}>
                    <td className="px-5 py-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{item.title || "Untitled"}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.content || "No caption"}</p>
                        {item.postLink ? (
                          <a href={normalizeExternalLink(item.postLink)} target="_blank" rel="noreferrer" className="text-xs text-blue-600 truncate block mt-0.5">
                            {item.postLink}
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{isVideo ? "Video" : "Image"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.isActive === false ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                        {item.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700 font-medium">{Number(item.sortOrder || 0)}</td>
                    <td className="px-5 py-4">
                      {isVideo ? (
                        <video src={item.mediaUrl} controls className="w-16 h-16 rounded-lg object-cover border border-gray-200 bg-black" />
                      ) : (
                        <img src={item.mediaUrl} alt={item.title || "social-feed"} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-100">
          {filteredItems.map((item) => {
            const id = item.id || item._id;
            const isVideo = item.mediaType === "video";
            return (
              <div key={id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {isVideo ? (
                    <video src={item.mediaUrl} className="w-12 h-12 rounded-xl object-cover border shrink-0 bg-black" />
                  ) : (
                    <img src={item.mediaUrl} alt={item.title || "social-feed"} className="w-12 h-12 rounded-xl object-cover border shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{item.title || "Untitled"}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{isVideo ? "Video" : "Image"} | Order {Number(item.sortOrder || 0)}</p>
                    <span className={`inline-flex mt-1 text-xs px-2 py-0.5 rounded-full ${item.isActive === false ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                      {item.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SocialFeedList;
