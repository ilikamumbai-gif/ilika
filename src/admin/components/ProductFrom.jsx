import React, { useState, useRef } from "react";
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
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
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

      {/* Toolbar */}
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

const ProductForm = ({ onSubmit, initialData = {} }) => {
  const { categories } = useCategories();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: initialData.name || "",
    price: initialData.price || "",
    mrp: initialData.mrp || "",
    categoryIds: initialData.categoryIds || [],
    description: initialData.description || "",
    additionalInfo: initialData.additionalInfo || "",
    points: initialData.points ? initialData.points.join(", ") : "",
    images: [],
  });

  const [previewImages, setPreviewImages] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= IMAGE SELECT ================= */
  const handleImageSelect = (files) => {
    const arr = Array.from(files);
    setForm(prev => ({ ...prev, images: [...prev.images, ...arr] }));
    setPreviewImages(prev => [...prev, ...arr.map(file => URL.createObjectURL(file))]);
  };

  /* ================= REMOVE IMAGE ================= */
  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  /* ================= CATEGORY ================= */
  const handleCategoryChange = (id) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(c => c !== id)
        : [...prev.categoryIds, id],
    }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrls = initialData.images || [];

      if (form.images.length > 0) {
        const uploads = form.images.map(async file => {
          const imageRef = ref(storage, `products/${crypto.randomUUID()}-${file.name}`);
          await uploadBytes(imageRef, file);
          return await getDownloadURL(imageRef);
        });

        imageUrls = [...imageUrls, ...(await Promise.all(uploads))];
      }

      const discount = form.mrp && form.price
        ? Math.round(((form.mrp - form.price) / form.mrp) * 100)
        : 0;

      await onSubmit({
        ...form,
        price: Number(form.price),
        mrp: Number(form.mrp),
        discount,
        points: form.points ? form.points.split(",").map(p => p.trim()) : [],
        images: imageUrls,
      });

      setForm({ name:"", price:"", mrp:"", categoryIds:[], description:"", additionalInfo:"", points:"", images:[] });
      setPreviewImages([]);

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">

      <input name="name" placeholder="Product Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border p-2 rounded" required />

      <div className="grid grid-cols-2 gap-3">
        <input type="number" name="price" placeholder="Price" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="border p-2 rounded" required />
        <input type="number" name="mrp" placeholder="MRP" value={form.mrp} onChange={e=>setForm({...form,mrp:e.target.value})} className="border p-2 rounded" required />
      </div>

      {/* CATEGORY */}
      <div className="grid grid-cols-2 gap-2 border p-3 rounded max-h-40 overflow-y-auto">
        {categories.map(cat=>(
          <label key={cat.id} className="flex gap-2 text-sm">
            <input type="checkbox" checked={form.categoryIds.includes(cat.id)} onChange={()=>handleCategoryChange(cat.id)} />
            {cat.name}
          </label>
        ))}
      </div>

      {/* DESCRIPTION */}
      <RichTextEditor value={form.description} onChange={html=>setForm({...form,description:html})} />

      <textarea placeholder="Short Info" value={form.additionalInfo} onChange={e=>setForm({...form,additionalInfo:e.target.value})} className="w-full border p-2 rounded" />

      <input placeholder="Points (comma separated)" value={form.points} onChange={e=>setForm({...form,points:e.target.value})} className="w-full border p-2 rounded" />

      {/* IMAGE UPLOAD */}
      <div className="border-2 border-dashed p-5 rounded-xl text-center cursor-pointer" onClick={()=>fileInputRef.current.click()}>
        <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={(e)=>handleImageSelect(e.target.files)} />
        Upload Images
      </div>

      {/* PREVIEW */}
      {previewImages.length>0 && (
        <div className="grid grid-cols-4 gap-3">
          {previewImages.map((img,i)=>(
            <div key={i} className="relative">
              <img src={img} className="h-24 w-full object-cover rounded"/>
              <button type="button" onClick={()=>removeImage(i)} className="absolute top-1 right-1 bg-black text-white text-xs px-2 rounded">X</button>
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
