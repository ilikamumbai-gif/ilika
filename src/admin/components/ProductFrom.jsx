import React, { useState, useRef, useEffect } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../../firebase/firebaseConfig";
import { useCategories } from "../context/CategoryContext";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import HorizontalRule from "@tiptap/extension-horizontal-rule";

const storage = getStorage(app);

/* ================= RICH TEXT EDITOR ================= */
const RichTextEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        strike: false,
        horizontalRule: false,
        underline: false,
      }),
      Underline,
      Strike,
      HorizontalRule,
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
        <button typez="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn}>1. List</button>

        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn}>Quote</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn}>—</button>

        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn}>Undo</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn}>Redo</button>
      </div>

      <EditorContent editor={editor} className="min-h-[180px] outline-none prose max-w-none" />
    </div>
  );
};

/* ================= PRODUCT FORM ================= */
const ProductForm = ({ onSubmit, initialData = {} }) => {
  const { categories } = useCategories();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: initialData.name || "",
    shortInfo: initialData.shortInfo || "",   // ✅ NEW
    price: initialData.price || "",
    mrp: initialData.mrp || "",
    hasVariants: initialData.hasVariants || false,
    variants: initialData.variants || [],
    categoryIds: initialData.categoryIds || [],
    description: initialData.description || "",
    additionalInfo: initialData.additionalInfo || "",
    tagline: initialData.tagline || "",
    points: initialData.benefits ? initialData.benefits.join(", ") : "",
    images: initialData.images || [],
  });
  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;

    setForm({
      name: initialData.name || "",
      shortInfo: initialData.shortInfo || "",   // ✅ NEW
      price: initialData.price || "",
      mrp: initialData.mrp || "",
      hasVariants: initialData.hasVariants || false,
      variants: initialData.variants || [],
      categoryIds: initialData.categoryIds || [],
      description: initialData.description || "",
      additionalInfo: initialData.additionalInfo || "",
      tagline: initialData.tagline || "",
      points: initialData.benefits ? initialData.benefits.join(", ") : "",
      images: initialData.images || [],
    });

    setPreviewImages(initialData.images || []);

  }, [initialData]);

  const [previewImages, setPreviewImages] = useState([]);
  const [loading, setLoading] = useState(false);

  /* CLEANUP PREVIEW URLS */
  useEffect(() => {
    return () => {
      previewImages.forEach(img => {
        if (img.startsWith("blob:")) URL.revokeObjectURL(img);
      });
    };
  }, [previewImages]);

  /* IMAGE SELECT */
  const handleImageSelect = (files) => {
    const arr = Array.from(files);

    setForm(prev => ({ ...prev, images: [...prev.images, ...arr] }));

    const previews = arr.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...previews]);
  };

  /* REMOVE IMAGE */
  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  /* CATEGORY */
  const handleCategoryChange = (id) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(c => c !== id)
        : [...prev.categoryIds, id],
    }));
  };
  /* ================= VARIANT IMAGE SELECT ================= */
  const handleVariantImageSelect = (files, index) => {
    const arr = Array.from(files);

    const updated = [...form.variants];

    updated[index].images = [...(updated[index].images || []), ...arr];
    updated[index].preview = [
      ...(updated[index].preview || []),
      ...arr.map(file => URL.createObjectURL(file))
    ];

    setForm({ ...form, variants: updated });
  };

  /* REMOVE SINGLE VARIANT IMAGE */
  const removeVariantImage = (variantIndex, imgIndex) => {
    const updated = [...form.variants];

    updated[variantIndex].images.splice(imgIndex, 1);
    updated[variantIndex].preview.splice(imgIndex, 1);

    setForm({ ...form, variants: updated });
  };

  /* SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrls = [];

      for (const file of form.images) {
        if (typeof file === "string") {
          imageUrls.push(file);
        } else {
          const imageRef = ref(storage, `products/${crypto.randomUUID()}-${file.name}`);
          await uploadBytes(imageRef, file);
          const url = await getDownloadURL(imageRef);
          imageUrls.push(url);
        }
      }


      let variantData = [];

      if (form.hasVariants) {
        for (const variant of form.variants) {

          const uploadedImages = [];

          for (const file of variant.images || []) {
            if (typeof file === "string") {
              // already uploaded image (editing product)
              uploadedImages.push(file);
            } else {
              // new image upload
              const imageRef = ref(storage, `products/${crypto.randomUUID()}-${file.name}`);
              await uploadBytes(imageRef, file);
              const url = await getDownloadURL(imageRef);
              uploadedImages.push(url);
            }
          }

          variantData.push({
            id: variant.id,
            label: variant.label,
            price: Number(variant.price),
            mrp: Number(variant.mrp),
            images: uploadedImages,
          });
        }
      }



      await onSubmit({
        name: form.name,
        shortInfo: form.shortInfo,   // ✅ NEW
        hasVariants: form.hasVariants,
        price: form.hasVariants ? null : Number(form.price),
        mrp: form.hasVariants ? null : Number(form.mrp),
        variants: variantData,
        categoryIds: form.categoryIds,
        description: form.description,
        additionalInfo: form.additionalInfo,
        tagline: form.tagline,
        benefits: form.points.split(",").map(p => p.trim()),
        images: imageUrls,
      });


      setForm({
        name: "",
        price: "",
        mrp: "",
        categoryIds: [],
        description: "",
        additionalInfo: "",
        tagline: "",
        points: "",
        images: [],
      });

      setPreviewImages([]);

    } catch (err) {
      console.error("PRODUCT SAVE ERROR:", err);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">

      <input
        name="name"
        placeholder="Product Name"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        placeholder="Short Info"
        value={form.shortInfo}
        onChange={e => setForm({ ...form, shortInfo: e.target.value })}
        className="w-full border p-2 rounded"
        rows={2}
      />
      {/* NORMAL PRODUCT PRICE (ONLY WHEN NO VARIANTS) */}
      {!form.hasVariants && (
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="number"
            placeholder="MRP"
            value={form.mrp}
            onChange={(e) => setForm({ ...form, mrp: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
        </div>
      )}

      {form.variants?.map((variant, index) => (

        <div key={variant.id} className="border p-4 rounded space-y-3 bg-gray-50">

          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="Label (50ml / Small)"
              value={variant.label}
              onChange={e => {
                const updated = [...form.variants];
                updated[index].label = e.target.value;
                setForm({ ...form, variants: updated });
              }}
              className="border p-2 rounded"
            />

            <input
              type="number"
              placeholder="Price"
              value={variant.price}
              onChange={e => {
                const updated = [...form.variants];
                updated[index].price = e.target.value;
                setForm({ ...form, variants: updated });
              }}
              className="border p-2 rounded"
            />

            <input
              type="number"
              placeholder="MRP"
              value={variant.mrp}
              onChange={e => {
                const updated = [...form.variants];
                updated[index].mrp = e.target.value;
                setForm({ ...form, variants: updated });
              }}
              className="border p-2 rounded"
            />
          </div>

          {/* MULTIPLE IMAGE UPLOAD */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Variant Specific Images (Optional)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleVariantImageSelect(e.target.files, index)}
              className="block w-full text-sm"
            />

            {/* PREVIEW GRID */}
            <div className="grid grid-cols-4 gap-2">
              {(variant.preview || variant.images || []).map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={typeof img === "string" ? img : URL.createObjectURL(img)}
                    className="h-20 w-full object-cover rounded border"
                  />

                  <button
                    type="button"
                    onClick={() => removeVariantImage(index, i)}
                    className="absolute top-1 right-1 bg-black text-white text-xs px-2 rounded opacity-0 group-hover:opacity-100"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm({
                ...form,
                variants: form.variants.filter((_, i) => i !== index)
              })
            }}
            className="text-red-500 text-sm"
          >
            Remove Variant
          </button>

        </div>

      ))}


      {/* VARIANT TOGGLE */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.hasVariants}
          onChange={(e) => {
            const checked = e.target.checked;

            setForm(prev => ({
              ...prev,
              hasVariants: checked,
              price: checked ? "" : prev.price,
              mrp: checked ? "" : prev.mrp,
              variants: checked ? prev.variants : []
            }));
          }} />
        This product has variants (Size / Weight / Color)
      </label>
      {/* VARIANTS */}
      {form.hasVariants && (
        <div className="border rounded-xl p-4 space-y-4">

          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Variants</h3>
            <button
              type="button"
              onClick={() => {
                setForm(prev => ({
                  ...prev,
                  variants: [
                    ...prev.variants,
                    {
                      id: crypto.randomUUID(),
                      label: "",
                      price: "",
                      mrp: "",
                      images: []
                    }
                  ]
                }))
              }}
              className="bg-black text-white px-3 py-1 rounded"
            >
              Add Variant
            </button>
          </div>



        </div>
      )}

      <input
        placeholder="Tagline (comma separated)"
        value={form.tagline}
        onChange={e => setForm({ ...form, tagline: e.target.value })}
        className="w-full border p-2 rounded"
      />

      <textarea
        placeholder="Additional Info"
        value={form.additionalInfo}
        onChange={e => setForm({ ...form, additionalInfo: e.target.value })}
        className="w-full border p-2 rounded"
      />

      <input
        placeholder="Benefits (comma separated)"
        value={form.points}
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

      {/* IMAGE UPLOAD */}
      <div className="border-2 border-dashed p-5 rounded-xl text-center cursor-pointer" onClick={() => fileInputRef.current.click()}>
        <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={(e) => handleImageSelect(e.target.files)} />
        <h3 className="font-semibold">Common Product Images (Used for listing & default view)</h3>
      </div>

      {/* PREVIEW */}
      {previewImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {previewImages.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} className="h-24 w-full object-cover rounded" />
              <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black text-white text-xs px-2 rounded">X</button>
            </div>
          ))}
        </div>
      )}

      <button className="bg-black text-white px-4 py-2 rounded">
        {loading ? "Saving..." : "Save Product"}
      </button>
    </form>
  );
};

export default ProductForm;
