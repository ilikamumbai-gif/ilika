import React, { useState, useRef, useEffect } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../../firebase/firebaseConfig";
import { useCategories } from "../context/CategoryContext";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { useAdminAuth } from "../context/AdminAuthContext";
import { logActivity } from "../Utils/logActivity";

const storage = getStorage(app);

/* ── Rich Text Editor ── */
const RichTextEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, strike: false, horizontalRule: false, underline: false }),
      Underline, Strike, HorizontalRule,
    ],
    content: value || "<p>Write product description...</p>",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;
  const btn = "px-2 py-1 border rounded text-sm hover:bg-gray-100";

  return (
    <div className="border rounded-lg p-3 bg-white space-y-3">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn}>H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn}><b>B</b></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn}><i>I</i></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn}><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn}><s>S</s></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn}>1. List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn}>Quote</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn}>—</button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn}>Undo</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn}>Redo</button>
      </div>
      <EditorContent editor={editor} className="min-h-[180px] outline-none prose max-w-none" />
    </div>
  );
};

/* ── Image Upload Cell — used for before/after pairs ── */
const ImageUploadCell = ({ label, value, previewUrl, onFileChange, onUrlChange }) => {
  const inputRef = useRef(null);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      {previewUrl ? (
        <div className="relative group">
          <img src={previewUrl} alt={label}
            className="w-full h-28 object-cover rounded-lg border"
            onError={e => { e.target.style.display = "none"; }}
          />
          <button type="button"
            onClick={() => { onFileChange(null); onUrlChange(""); }}
            className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
          >Remove</button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="w-full h-28 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gray-400 transition bg-gray-50"
        >
          <span className="text-2xl text-gray-300">+</span>
          <span className="text-xs text-gray-400">Click to upload</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden
        onChange={e => { if (e.target.files[0]) onFileChange(e.target.files[0]); }}
      />
      <input type="text" placeholder="…or paste image URL"
        value={typeof value === "string" ? value : ""}
        onChange={e => onUrlChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
    </div>
  );
};

/* ══════════════════════════════════════
   PRODUCT FORM
══════════════════════════════════════ */
const ProductForm = ({ onSubmit, initialData = {} }) => {
  const { categories } = useCategories();
  const fileInputRef = useRef(null);
  const { admin } = useAdminAuth();

  const emptyForm = {
    name: "", shortInfo: "", price: "", mrp: "",
    hasVariants: false, variants: [], categoryIds: [],
    description: "", additionalInfo: "", tagline: "", points: "",
    images: [], isActive: true, inStock: true,
    beforeAfter: [], hasBeforeAfter: false,
    hasVideo: false,
    videos: [],
    warranty: "",   // ✅ NEW
    banners: [],
  };

  const fromInitial = (d) => ({
    name: d.name || "",
    shortInfo: d.shortInfo || "",
    price: d.price || "",
    mrp: d.mrp || "",
    hasVariants: d.hasVariants || false,
    variants: (d.variants || []).map(v => ({ ...v, preview: v.images || [] })),
    categoryIds: d.categoryIds || [],
    description: d.description || "",
    additionalInfo: Array.isArray(d.additionalInfo)
      ? d.additionalInfo.join(", ")
      : d.additionalInfo || "",
    tagline: d.tagline || "",
    points: d.benefits ? d.benefits.join(", ") : "",
    images: d.images || [],
    isActive: d.isActive ?? true,
    inStock: d.inStock ?? true,
    beforeAfter: (d.beforeAfter || []).map(p => ({ ...p, _beforeFile: null, _afterFile: null })),
    hasBeforeAfter: !!(d.beforeAfter?.length),
    videos: (d.videos || []).map(v => ({ ...v })),
    hasVideo: !!(d.videos?.length),
    warranty: d.warranty || "",   // ✅ NEW
    banners: Array.isArray(d.banners) ? d.banners : (d.bannerImage ? [{ url: d.bannerImage, alt: d.bannerAlt || "" }] : []),
  });

  const [form, setForm] = useState(fromInitial(initialData));
  const [previewImages, setPreviewImages] = useState(initialData.images || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;
    setForm(fromInitial(initialData));
    setPreviewImages(initialData.images || []);
  }, [initialData]);

  useEffect(() => {
    return () => previewImages.forEach(img => { if (img.startsWith("blob:")) URL.revokeObjectURL(img); });
  }, [previewImages]);

  /* ── helpers ── */
  const handleImageSelect = (files) => {
    const arr = Array.from(files);
    setForm(prev => ({ ...prev, images: [...prev.images, ...arr] }));
    setPreviewImages(prev => [...prev, ...arr.map(f => URL.createObjectURL(f))]);
  };
  const removeImage = (i) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, j) => j !== i) }));
    setPreviewImages(prev => prev.filter((_, j) => j !== i));
  };
  const handleCategoryChange = (id) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(c => c !== id)
        : [...prev.categoryIds, id],
    }));
  };
  const handleVariantImageSelect = (files, idx) => {
    const arr = Array.from(files);
    const updated = [...form.variants];
    updated[idx].images = [...(updated[idx].images || []), ...arr];
    updated[idx].preview = [...(updated[idx].preview || []), ...arr.map(f => URL.createObjectURL(f))];
    setForm({ ...form, variants: updated });
  };
  const removeVariantImage = (vi, ii) => {
    const updated = [...form.variants];
    updated[vi].images.splice(ii, 1);
    updated[vi].preview.splice(ii, 1);
    setForm({ ...form, variants: updated });
  };
  const handleImageReorder = (from, to) => {
    if (from === to) return;
    const imgs = [...form.images]; const prvs = [...previewImages];
    const [mi] = imgs.splice(from, 1); const [mp] = prvs.splice(from, 1);
    imgs.splice(to, 0, mi); prvs.splice(to, 0, mp);
    setForm({ ...form, images: imgs }); setPreviewImages(prvs);
  };
  const handleVariantReorder = (vi, from, to) => {
    from = Number(from); to = Number(to);
    if (from === to) return;
    setForm(prev => {
      const vs = [...prev.variants];
      const imgs = [...(vs[vi].images || [])]; const prvs = [...(vs[vi].preview || [])];
      const [mi] = imgs.splice(from, 1); const [mp] = prvs.splice(from, 1);
      imgs.splice(to, 0, mi); prvs.splice(to, 0, mp);
      vs[vi] = { ...vs[vi], images: imgs, preview: prvs };
      return { ...prev, variants: vs };
    });
  };

  /* ── before/after helpers ── */
  const updatePair = (idx, patch) => {
    setForm(prev => {
      const ba = [...prev.beforeAfter];
      ba[idx] = { ...ba[idx], ...patch };
      return { ...prev, beforeAfter: ba };
    });
  };

  const updateVideo = (idx, patch) => {
    setForm(prev => {
      const vids = [...prev.videos];
      vids[idx] = { ...vids[idx], ...patch };
      return { ...prev, videos: vids };
    });
  };

  const uploadBAImage = async (file) => {
    const r = ref(storage, `products/beforeafter/${crypto.randomUUID()}-${file.name}`);
    await uploadBytes(r, file);
    return getDownloadURL(r);
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      /* main images */
      const imageUrls = [];
      for (const file of form.images) {
        if (typeof file === "string") { imageUrls.push(file); continue; }
        const r = ref(storage, `products/${crypto.randomUUID()}-${file.name}`);
        await uploadBytes(r, file);
        imageUrls.push(await getDownloadURL(r));
      }

      /* variants */
      let variantData = [];
      if (form.hasVariants) {
        for (const v of form.variants) {
          const uploaded = [];
          for (const file of v.images || []) {
            if (typeof file === "string") { uploaded.push(file); continue; }
            const r = ref(storage, `products/${crypto.randomUUID()}-${file.name}`);
            await uploadBytes(r, file);
            uploaded.push(await getDownloadURL(r));
          }
          variantData.push({ id: v.id, label: v.label, price: Number(v.price), mrp: Number(v.mrp), images: uploaded });
        }
      }

      /* before/after — upload any File objects */
      let beforeAfterData = [];
      if (form.hasBeforeAfter) {
        for (const pair of form.beforeAfter) {
          let beforeUrl = typeof pair.before === "string" ? pair.before : "";
          let afterUrl = typeof pair.after === "string" ? pair.after : "";
          if (pair._beforeFile instanceof File) beforeUrl = await uploadBAImage(pair._beforeFile);
          if (pair._afterFile instanceof File) afterUrl = await uploadBAImage(pair._afterFile);
          beforeAfterData.push({
            before: beforeUrl, after: afterUrl,
            beforeLabel: pair.beforeLabel || "Before",
            afterLabel: pair.afterLabel || "After",
            title: pair.title || "", description: pair.description || "",
            duration: pair.duration || "",
            beforeDesc: pair.beforeDesc || "", afterDesc: pair.afterDesc || "",
          });
        }
      }

      let videoData = [];
      if (form.hasVideo) {
        videoData = form.videos.map(v => ({
          url: v.url,
          title: v.title,
          subtitle: v.subtitle,
          description: v.description,
        }));
      }

      /* change log */
      if (initialData?.price && Number(initialData.price) !== Number(form.price))
        await logActivity(`${admin?.username || "Admin"} changed price of ${form.name} from ₹${initialData.price} to ₹${form.price}`);
      if (initialData?.mrp && Number(initialData.mrp) !== Number(form.mrp))
        await logActivity(`${admin?.username || "Admin"} changed MRP of ${form.name} from ₹${initialData.mrp} to ₹${form.mrp}`);

      await onSubmit({
        name: form.name, shortInfo: form.shortInfo,
        hasVariants: form.hasVariants,
        price: form.hasVariants ? null : Number(form.price),
        mrp: form.hasVariants ? null : Number(form.mrp),
        variants: variantData, categoryIds: form.categoryIds,
        description: form.description,
        additionalInfo: typeof form.additionalInfo === "string"
          ? form.additionalInfo.split(",").map(i => i.trim())
          : [],
        tagline: form.tagline,
        benefits: form.points.split(",").map(p => p.trim()),
        images: imageUrls,
        isActive: form.isActive, inStock: form.inStock,
        beforeAfter: beforeAfterData,
        videos: videoData,
        warranty: form.warranty || "",   // ✅ NEW
        banners: form.banners || [],
      });

      await logActivity(initialData?.id
        ? `${admin?.username || "Admin"} edited product: ${form.name}`
        : `${admin?.username || "Admin"} created product: ${form.name}`
      );

      setForm(emptyForm);
      setPreviewImages([]);
    } catch (err) {
      console.error("PRODUCT SAVE ERROR:", err);
    }
    setLoading(false);
  };

  /* ══════════════ JSX ══════════════ */
  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">

      <input name="name" placeholder="Product Name" value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        className="w-full border p-2 rounded" required
      />
      <textarea placeholder="Short Info" value={form.shortInfo}
        onChange={e => setForm({ ...form, shortInfo: e.target.value })}
        className="w-full border p-2 rounded" rows={2}
      />

      {/* STATUS */}
      <div className="grid grid-cols-2 gap-6 border p-4 rounded bg-gray-50">
        <div>
          <label className="block font-medium mb-2">Product Status</label>
          <div className="flex gap-4">
            {[true, false].map(v => (
              <label key={String(v)}>
                <input type="radio" checked={form.isActive === v} onChange={() => setForm({ ...form, isActive: v })} />
                {" "}{v ? "Active" : "Inactive"}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-medium mb-2">Stock Status</label>
          <div className="flex gap-4">
            {[true, false].map(v => (
              <label key={String(v)}>
                <input type="radio" checked={form.inStock === v} onChange={() => setForm({ ...form, inStock: v })} />
                {" "}{v ? "In Stock" : "Out of Stock"}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* PRICE */}
      {!form.hasVariants && (
        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="Price" value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            className="w-full border p-2 rounded" required
          />
          <input type="number" placeholder="MRP" value={form.mrp}
            onChange={e => setForm({ ...form, mrp: e.target.value })}
            className="w-full border p-2 rounded" required
          />
        </div>
      )}

      {/* VARIANT ROWS */}
      {form.variants?.map((variant, index) => (
        <div key={variant.id} className="border p-4 rounded space-y-3 bg-gray-50">
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Label (50ml / Small)" value={variant.label}
              onChange={e => { const u = [...form.variants]; u[index].label = e.target.value; setForm({ ...form, variants: u }); }}
              className="border p-2 rounded"
            />
            <input type="number" placeholder="Price" value={variant.price}
              onChange={e => { const u = [...form.variants]; u[index].price = e.target.value; setForm({ ...form, variants: u }); }}
              className="border p-2 rounded"
            />
            <input type="number" placeholder="MRP" value={variant.mrp}
              onChange={e => { const u = [...form.variants]; u[index].mrp = e.target.value; setForm({ ...form, variants: u }); }}
              className="border p-2 rounded"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Variant Images (Optional)</label>
            <input type="file" multiple accept="image/*"
              onChange={e => handleVariantImageSelect(e.target.files, index)}
              className="block w-full text-sm"
            />
            <div className="grid grid-cols-4 gap-2">
              {(variant.preview || variant.images || []).map((img, i) => (
                <div key={i} draggable
                  onDragStart={e => e.dataTransfer.setData("variantIndex", i)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleVariantReorder(index, e.dataTransfer.getData("variantIndex"), i)}
                  className="relative group cursor-move"
                >
                  <img src={typeof img === "string" ? img : URL.createObjectURL(img)} className="h-20 w-full object-cover rounded border" />
                  <button type="button" onClick={() => removeVariantImage(index, i)}
                    className="absolute top-1 right-1 bg-black text-white text-xs px-2 rounded opacity-0 group-hover:opacity-100"
                  >X</button>
                </div>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) })}
            className="text-red-500 text-sm"
          >Remove Variant</button>
        </div>
      ))}

      {/* VARIANT TOGGLE */}
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.hasVariants}
          onChange={e => setForm(prev => ({ ...prev, hasVariants: e.target.checked, price: e.target.checked ? "" : prev.price, mrp: e.target.checked ? "" : prev.mrp, variants: e.target.checked ? prev.variants : [] }))}
        />
        This product has variants (Size / Weight / Color)
      </label>
      {form.hasVariants && (
        <div className="border rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Variants</h3>
            <button type="button"
              onClick={() => setForm(prev => ({ ...prev, variants: [...prev.variants, { id: crypto.randomUUID(), label: "", price: "", mrp: "", images: [] }] }))}
              className="bg-black text-white px-3 py-1 rounded"
            >Add Variant</button>
          </div>
        </div>
      )}

      <input placeholder="Tagline (comma separated)" value={form.tagline}
        onChange={e => setForm({ ...form, tagline: e.target.value })}
        className="w-full border p-2 rounded"
      />
      <input placeholder="Additional Information (comma separated)" value={form.additionalInfo}
        onChange={e => setForm({ ...form, additionalInfo: e.target.value })}
        className="w-full border p-2 rounded"
      />
      <input placeholder="Benefits (comma separated)" value={form.points}
        onChange={e => setForm({ ...form, points: e.target.value })}
        className="w-full border p-2 rounded"
      />

      <RichTextEditor value={form.description} onChange={html => setForm({ ...form, description: html })} />

      {/* CATEGORY */}
      <div className="grid grid-cols-2 gap-2 border p-3 rounded max-h-40 overflow-y-auto">
        {(categories || []).map(cat => (
          <label key={cat.id} className="flex gap-2 text-sm">
            <input type="checkbox" checked={form.categoryIds.includes(cat.id)} onChange={() => handleCategoryChange(cat.id)} />
            {cat.name}
          </label>
        ))}
      </div>

      {/* PRODUCT IMAGES */}
      <div className="border-2 border-dashed p-5 rounded-xl text-center cursor-pointer"
        onClick={() => fileInputRef.current.click()}
      >
        <input ref={fileInputRef} type="file" multiple accept="image/*" hidden
          onChange={e => handleImageSelect(e.target.files)}
        />
        <h3 className="font-semibold">Common Product Images (Used for listing & default view)</h3>
      </div>
      {previewImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {previewImages.map((img, i) => (
            <div key={i} draggable
              onDragStart={e => e.dataTransfer.setData("dragIndex", i)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleImageReorder(Number(e.dataTransfer.getData("dragIndex")), i)}
              className="relative cursor-move"
            >
              <img src={img} className="h-24 w-full object-cover rounded border" />
              <button type="button" onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black text-white text-xs px-2 rounded"
              >X</button>
            </div>
          ))}
        </div>
      )}

      {/* BEFORE / AFTER IMAGES */}
      <div className="border rounded-xl p-5 space-y-4 bg-gray-50">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.hasBeforeAfter}
            onChange={e => setForm(prev => ({ ...prev, hasBeforeAfter: e.target.checked }))}
          />
          <span className="font-semibold text-sm">This product has Before / After images</span>
        </label>

        {form.hasBeforeAfter && (
          <div className="space-y-5">
            <p className="text-xs text-gray-500">
              Each pair shows an interactive drag-slider on the product page. Upload images directly or paste a URL.
            </p>

            {(form.beforeAfter || []).map((pair, idx) => (
              <div key={idx} className="border rounded-xl p-4 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Pair {idx + 1}</span>
                  <button type="button"
                    onClick={() => setForm(prev => ({ ...prev, beforeAfter: prev.beforeAfter.filter((_, i) => i !== idx) }))}
                    className="text-red-500 text-xs hover:underline"
                  >Remove</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ImageUploadCell
                    label="Before"
                    value={pair.before}
                    previewUrl={pair._beforeFile ? URL.createObjectURL(pair._beforeFile) : (typeof pair.before === "string" ? pair.before : "")}
                    onFileChange={file => updatePair(idx, { _beforeFile: file, before: file ? "" : pair.before })}
                    onUrlChange={url => updatePair(idx, { before: url, _beforeFile: null })}
                  />
                  <ImageUploadCell
                    label="After"
                    value={pair.after}
                    previewUrl={pair._afterFile ? URL.createObjectURL(pair._afterFile) : (typeof pair.after === "string" ? pair.after : "")}
                    onFileChange={file => updatePair(idx, { _afterFile: file, after: file ? "" : pair.after })}
                    onUrlChange={url => updatePair(idx, { after: url, _afterFile: null })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Before label" value={pair.beforeLabel || ""}
                    onChange={e => updatePair(idx, { beforeLabel: e.target.value })}
                    className="w-full border p-2 rounded text-sm"
                  />
                  <input type="text" placeholder="After label" value={pair.afterLabel || ""}
                    onChange={e => updatePair(idx, { afterLabel: e.target.value })}
                    className="w-full border p-2 rounded text-sm"
                  />
                </div>

                <input type="text" placeholder="Title (e.g. 4 Weeks Result)" value={pair.title || ""}
                  onChange={e => updatePair(idx, { title: e.target.value })}
                  className="w-full border p-2 rounded text-sm"
                />
                <input type="text" placeholder="Sub-description" value={pair.description || ""}
                  onChange={e => updatePair(idx, { description: e.target.value })}
                  className="w-full border p-2 rounded text-sm"
                />
                <input type="text" placeholder="Duration badge (e.g. After 30 days)" value={pair.duration || ""}
                  onChange={e => updatePair(idx, { duration: e.target.value })}
                  className="w-full border p-2 rounded text-sm"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Before stat text" value={pair.beforeDesc || ""}
                    onChange={e => updatePair(idx, { beforeDesc: e.target.value })}
                    className="w-full border p-2 rounded text-sm"
                  />
                  <input type="text" placeholder="After stat text" value={pair.afterDesc || ""}
                    onChange={e => updatePair(idx, { afterDesc: e.target.value })}
                    className="w-full border p-2 rounded text-sm"
                  />
                </div>
              </div>
            ))}

            <button type="button"
              onClick={() => setForm(prev => ({
                ...prev,
                beforeAfter: [...(prev.beforeAfter || []), {
                  before: "", after: "", _beforeFile: null, _afterFile: null,
                  beforeLabel: "Before", afterLabel: "After",
                  title: "", description: "", duration: "",
                  beforeDesc: "", afterDesc: "",
                }],
              }))}
              className="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >+ Add Before / After Pair</button>
          </div>
        )}
      </div>

      {/* PRODUCT VIDEOS */}
      <div className="border rounded-xl p-5 space-y-4 bg-gray-50">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.hasVideo}
            onChange={e => setForm(prev => ({ ...prev, hasVideo: e.target.checked }))}
          />
          <span className="font-semibold text-sm">This product has Videos</span>
        </label>

        {form.hasVideo && (
          <div className="space-y-5">
            {(form.videos || []).map((video, idx) => (
              <div key={idx} className="border rounded-xl p-4 bg-white space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Video {idx + 1}</span>
                  <button type="button"
                    onClick={() => setForm(prev => ({ ...prev, videos: prev.videos.filter((_, i) => i !== idx) }))}
                    className="text-red-500 text-xs"
                  >Remove</button>
                </div>
                <input type="text" placeholder="Paste YouTube or Drive link" value={video.url || ""}
                  onChange={e => updateVideo(idx, { url: e.target.value })}
                  className="w-full border p-2 rounded text-sm"
                />
                <input type="text" placeholder="Title" value={video.title || ""}
                  onChange={e => updateVideo(idx, { title: e.target.value })}
                  className="w-full border p-2 rounded text-sm"
                />
                <input type="text" placeholder="Subtitle (optional)" value={video.subtitle || ""}
                  onChange={e => updateVideo(idx, { subtitle: e.target.value })}
                  className="w-full border p-2 rounded text-sm"
                />
                <textarea placeholder="Description" value={video.description || ""}
                  onChange={e => updateVideo(idx, { description: e.target.value })}
                  className="w-full border p-2 rounded text-sm" rows={3}
                />
              </div>
            ))}

            <button type="button"
              onClick={() => setForm(prev => ({ ...prev, videos: [...(prev.videos || []), { url: "", title: "", subtitle: "", description: "" }] }))}
              className="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg"
            >+ Add Video</button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          BANNERS — MULTIPLE, OPTIONAL
      ══════════════════════════════════════════════════ */}
      <div className="border rounded-xl p-5 space-y-4 bg-gray-50">
        <div>
          <p className="font-semibold text-sm">Product Banners (Optional)</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Add one or more full-width banners shown between the description and before/after sections.
          </p>
        </div>

        {/* Banner list */}
        {(form.banners || []).map((banner, idx) => (
          <div key={idx} className="border rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Banner {idx + 1}</span>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, banners: prev.banners.filter((_, i) => i !== idx) }))}
                className="text-red-500 text-xs hover:underline"
              >Remove</button>
            </div>

            {/* Preview */}
            {banner.url && (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={banner.url}
                  alt={banner.alt || `Banner ${idx + 1}`}
                  className="w-full h-32 object-cover"
                  onError={e => { e.target.style.display = "none"; }}
                />
              </div>
            )}

            {/* File upload */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    const r = ref(storage, `products/banners/${crypto.randomUUID()}-${file.name}`);
                    await uploadBytes(r, file);
                    const url = await getDownloadURL(r);
                    setForm(prev => {
                      const updated = [...prev.banners];
                      updated[idx] = { ...updated[idx], url };
                      return { ...prev, banners: updated };
                    });
                  } catch (err) { console.error("Banner upload failed:", err); }
                }}
              />
            </div>

            {/* URL fallback */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Or Paste URL</label>
              <input
                type="text"
                placeholder="https://..."
                value={banner.url || ""}
                onChange={e => setForm(prev => {
                  const updated = [...prev.banners];
                  updated[idx] = { ...updated[idx], url: e.target.value };
                  return { ...prev, banners: updated };
                })}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            {/* Alt text */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Alt Text (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Product lifestyle banner"
                value={banner.alt || ""}
                onChange={e => setForm(prev => {
                  const updated = [...prev.banners];
                  updated[idx] = { ...updated[idx], alt: e.target.value };
                  return { ...prev, banners: updated };
                })}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setForm(prev => ({ ...prev, banners: [...(prev.banners || []), { url: "", alt: "" }] }))}
          className="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >+ Add Banner</button>
      </div>

      {/* ══════════════════════════════════════════════════
          WARRANTY — OPTIONAL
      ══════════════════════════════════════════════════ */}
      <div className="border rounded-xl p-5 space-y-3 bg-gray-50">
        <p className="font-semibold text-sm">Warranty (Optional)</p>
        <p className="text-xs text-gray-400">Select if this product comes with a warranty. Leave blank for no warranty badge on the product page.</p>
        <div className="flex flex-col gap-2.5">
          {[
            { value: "", label: "No Warranty" },
            { value: "manufacturer", label: "Manufacturer Product — 18 Months Warranty" },
            { value: "import", label: "Import Product — 1 Year Warranty" },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="warranty"
                value={opt.value}
                checked={form.warranty === opt.value}
                onChange={() => setForm(prev => ({ ...prev, warranty: opt.value }))}
                className="accent-[#1C371C]"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
        {form.warranty && (
          <div className="mt-1 flex items-start gap-2 bg-[#f0faf0] border border-[#1C371C]/20 rounded-lg px-3 py-2.5">
            <span className="text-[#1C371C] font-bold mt-0.5">✓</span>
            <p className="text-xs text-[#1C371C] font-medium">
              {form.warranty === "manufacturer"
                ? "18 Months Manufacturer Warranty badge will appear on the product page."
                : "1 Year Import Warranty badge will appear on the product page."}
            </p>
          </div>
        )}
      </div>

      <button type="submit" className="bg-black text-white px-4 py-2 rounded">
        {loading ? "Saving..." : "Save Product"}
      </button>
    </form>
  );
};

export default ProductForm;