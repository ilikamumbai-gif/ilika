import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { app } from "../../../firebase/firebaseConfig";
import AdminLayout from "../../components/AdminLayout";
import { logActivity } from "../../Utils/logActivity";

const API = import.meta.env.VITE_API_URL;
const storage = getStorage(app);

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
        postLink: form.postLink.trim(),
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Social Feed</h1>
        <span className="text-sm text-gray-500">{sortedItems.length} total</span>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
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
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm"
          >
            <Plus size={14} />
            {saving ? "Saving..." : editingId ? "Update Post" : "Add Post"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border text-sm">
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-3">
        {sortedItems.map((item) => {
          const id = item.id || item._id;
          const isVideo = item.mediaType === "video";
          return (
            <div key={id} className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title || "Untitled"}</p>
                  <p className="text-xs text-gray-500">
                    {isVideo ? "Video" : "Image"} | {item.isActive !== false ? "Active" : "Inactive"} | Order {Number(item.sortOrder || 0)}
                  </p>
                  {item.postLink ? <p className="text-xs text-blue-600 break-all">{item.postLink}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(item)} className="px-3 py-1.5 rounded-md border text-sm">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                {isVideo ? (
                  <video src={item.mediaUrl} controls className="w-full h-48 object-cover rounded-lg border bg-black" />
                ) : (
                  <img src={item.mediaUrl} alt={item.title || "social-feed"} className="w-full h-48 object-cover rounded-lg border" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default SocialFeedList;

