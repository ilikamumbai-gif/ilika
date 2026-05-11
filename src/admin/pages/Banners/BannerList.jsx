import React, { useMemo, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { app } from "../../../firebase/firebaseConfig";
import AdminLayout from "../../components/AdminLayout";
import { useBanners } from "../../context/BannerContext";
import { logActivity } from "../../Utils/logActivity";

const storage = getStorage(app);

const defaultForm = {
  key: "",
  title: "",
  desktopSrc: "",
  mobileSrc: "",
  linkUrl: "",
  alt: "",
  sortOrder: 0,
  isActive: true,
};

const BannerList = () => {
  const { banners, addBanner, updateBanner, deleteBanner } = useBanners();
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedBanners = useMemo(
    () =>
      [...banners].sort((a, b) => {
        const orderDiff = Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return String(a?.key || "").localeCompare(String(b?.key || ""));
      }),
    [banners]
  );

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId("");
  };

  const uploadImage = async (file) => {
    const path = `banners/${crypto.randomUUID()}-${file.name}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        key: form.key.trim(),
        title: form.title.trim(),
        desktopSrc: form.desktopSrc.trim(),
        mobileSrc: form.mobileSrc.trim() || form.desktopSrc.trim(),
        linkUrl: form.linkUrl.trim(),
        alt: form.alt.trim(),
        sortOrder: Number(form.sortOrder || 0),
        isActive: Boolean(form.isActive),
      };

      if (editingId) {
        await updateBanner(editingId, payload);
        await logActivity(`Updated banner: ${payload.key}`);
      } else {
        await addBanner(payload);
        await logActivity(`Added banner: ${payload.key}`);
      }

      resetForm();
    } catch (error) {
      alert(error.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (banner) => {
    if (!window.confirm("Delete this banner?")) return;
    await deleteBanner(banner.id);
    await logActivity(`Deleted banner: ${banner.key}`);
    if (editingId === banner.id) resetForm();
  };

  const startEdit = (banner) => {
    setEditingId(banner.id);
    setForm({
      key: banner.key || "",
      title: banner.title || "",
      desktopSrc: banner.desktopSrc || "",
      mobileSrc: banner.mobileSrc || "",
      linkUrl: banner.linkUrl || "",
      alt: banner.alt || "",
      sortOrder: Number(banner.sortOrder || 0),
      isActive: banner.isActive !== false,
    });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Banners</h1>
        <span className="text-sm text-gray-500">{sortedBanners.length} total</span>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.key}
            onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
            placeholder="Banner key (e.g. home-top)"
            className="h-10 px-3 border rounded-lg"
            required
          />
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Title (optional)"
            className="h-10 px-3 border rounded-lg"
          />

          <div className="flex gap-2">
            <input
              value={form.desktopSrc}
              onChange={(e) => setForm((prev) => ({ ...prev, desktopSrc: e.target.value }))}
              placeholder="Desktop image URL"
              className="h-10 px-3 border rounded-lg flex-1"
              required
            />
            <label className="h-10 px-3 border rounded-lg inline-flex items-center gap-2 cursor-pointer text-sm">
              <Upload size={14} /> Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadImage(file);
                  setForm((prev) => ({ ...prev, desktopSrc: url }));
                }}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <input
              value={form.mobileSrc}
              onChange={(e) => setForm((prev) => ({ ...prev, mobileSrc: e.target.value }))}
              placeholder="Mobile image URL (optional)"
              className="h-10 px-3 border rounded-lg flex-1"
            />
            <label className="h-10 px-3 border rounded-lg inline-flex items-center gap-2 cursor-pointer text-sm">
              <Upload size={14} /> Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadImage(file);
                  setForm((prev) => ({ ...prev, mobileSrc: url }));
                }}
              />
            </label>
          </div>

          <input
            value={form.linkUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
            placeholder="Click URL (optional)"
            className="h-10 px-3 border rounded-lg"
          />
          <input
            value={form.alt}
            onChange={(e) => setForm((prev) => ({ ...prev, alt: e.target.value }))}
            placeholder="Alt text (optional)"
            className="h-10 px-3 border rounded-lg"
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
            {saving ? "Saving..." : editingId ? "Update Banner" : "Add Banner"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border text-sm">
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-3">
        {sortedBanners.map((banner) => (
          <div key={banner.id} className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{banner.key}</p>
                <p className="text-xs text-gray-500">
                  {banner.title || "Untitled"} | {banner.isActive !== false ? "Active" : "Inactive"} | Order {Number(banner.sortOrder || 0)}
                </p>
                {banner.linkUrl ? <p className="text-xs text-blue-600 break-all">{banner.linkUrl}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(banner)} className="px-3 py-1.5 rounded-md border text-sm">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(banner)}
                  className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
              {banner.desktopSrc ? (
                <img src={banner.desktopSrc} alt={`${banner.key} desktop`} className="w-full h-32 object-cover rounded-lg border" />
              ) : null}
              {(banner.mobileSrc || banner.desktopSrc) ? (
                <img src={banner.mobileSrc || banner.desktopSrc} alt={`${banner.key} mobile`} className="w-full h-32 object-cover rounded-lg border" />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default BannerList;
