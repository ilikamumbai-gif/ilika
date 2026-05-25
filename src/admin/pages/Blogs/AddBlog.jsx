import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useBlog } from "../../context/BlogProvider";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase/firebaseConfig";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Image from "@tiptap/extension-image";
import { logActivity } from "../../Utils/logActivity";



/* ================= LOG FUNCTION ================= */





/* ================= RICH EDITOR ================= */

const RichTextEditor = ({ value, onChange }) => {

  const uploadImage = async (file) => {

    const storageRef = ref(
      storage,
      `blog-content/${Date.now()}_${file.name}`
    );

    await uploadBytes(storageRef, file);

    const url = await getDownloadURL(storageRef);

    return url;
  };


  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Strike,
      HorizontalRule,
      Image,
    ],
    content: value || "<p>Write blog content...</p>",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const btn =
    "px-2 py-1 border rounded text-sm hover:bg-gray-100";


  const handleInsertImage = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const url = await uploadImage(file);

    editor
      .chain()
      .focus()
      .setImage({ src: url })
      .run();
  };


  return (
    <div className="border rounded-lg p-3 bg-white space-y-3">

      <div className="flex flex-wrap gap-2 border-b pb-2">

        <button type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn}
        >B</button>

        <button type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn}
        >I</button>

        <button type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btn}
        >U</button>

        <button type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btn}
        >H1</button>

        <button type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn}
        >H2</button>

        <button type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn}
        >• List</button>

        <button type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn}
        >1. List</button>

        {/* IMAGE */}

        <label className={btn}>
          Image
          <input
            type="file"
            hidden
            onChange={handleInsertImage}
          />
        </label>

        <button type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={btn}
        >Undo</button>

        <button type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={btn}
        >Redo</button>

      </div>

      <EditorContent
        editor={editor}
        className="min-h-[200px] prose max-w-none"
      />

    </div>
  );
};




/* ================= ADD BLOG ================= */

const AddBlog = () => {

  const navigate = useNavigate();

  const { addBlog } = useBlog();

  const [uploading, setUploading] = useState(false);

  const [blog, setBlog] = useState({
    title: "",
    image: "",
    author: "",
    internalLink: "",
    shortDesc: "",
    content: "",
    contentSections: [
      { id: Date.now(), type: "content-image", content: "", image: "" },
      { id: Date.now() + 1, type: "content-full", content: "", image: "" },
      { id: Date.now() + 2, type: "image-content", content: "", image: "" },
    ],
  });

  const [preview, setPreview] = useState(null);



  const handleChange = (e) =>
    setBlog({
      ...blog,
      [e.target.name]: e.target.value
    });

  const addSection = (type) => {
    setBlog((prev) => ({
      ...prev,
      contentSections: [
        ...prev.contentSections,
        { id: Date.now() + Math.random(), type, content: "", image: "" },
      ],
    }));
  };

  const removeSection = (sectionId) => {
    setBlog((prev) => ({
      ...prev,
      contentSections: prev.contentSections.filter((s) => s.id !== sectionId),
    }));
  };

  const updateSection = (sectionId, patch) => {
    setBlog((prev) => ({
      ...prev,
      contentSections: prev.contentSections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      ),
    }));
  };

  const moveSection = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0) return;
    if (targetIndex >= blog.contentSections.length) return;

    const next = [...blog.contentSections];
    const [picked] = next.splice(index, 1);
    next.splice(targetIndex, 0, picked);

    setBlog((prev) => ({
      ...prev,
      contentSections: next,
    }));
  };



  /* IMAGE UPLOAD */

  const handleImageUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    try {

      setUploading(true);

      const storageRef = ref(
        storage,
        `blogs/${Date.now()}_${file.name}`
      );

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      setBlog(prev => ({
        ...prev,
        image: url,
      }));

      setPreview(url);

    } catch (err) {

      console.log(err);

    } finally {

      setUploading(false);

    }

  };

  const handleSectionImageUpload = async (sectionId, file) => {
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `blogs/sections/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      updateSection(sectionId, { image: url });
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
    }
  };



  /* ================= SUBMIT ================= */

  const submitBlog = async (e) => {

    e.preventDefault();

    const payload = {
      ...blog,
      excerpt: blog.shortDesc,
      contentSections: blog.contentSections.filter(
        (section) => section.content?.trim() || section.image
      ),
    };

    await addBlog(payload);

    await logActivity(`Created blog: ${blog.title}`);

    navigate("/admin/blogs");

  };



  return (

    <AdminLayout>

      <div className="max-w-3xl mx-auto p-6">

        <h1 className="text-2xl font-semibold mb-6">
          Create Blog
        </h1>


        <form
          onSubmit={submitBlog}
          className="space-y-5"
        >

          <input
            name="title"
            placeholder="Blog Title"
            className="w-full border p-3 rounded"
            onChange={handleChange}
            required
          />


          <div>

            <label>Upload Image</label>

            <input
              type="file"
              onChange={handleImageUpload}
              className="w-full border p-2"
              required
            />

            {preview && (
              <img
              loading="lazy"
                src={preview}
                className="w-full h-64 object-cover mt-3"
              />
            )}

          </div>


          <input
            name="author"
            placeholder="Author"
            className="w-full border p-3"
            onChange={handleChange}
            required
          />

          <input
            name="internalLink"
            placeholder="Internal Link (example: /product/your-product-slug)"
            className="w-full border p-3"
            onChange={handleChange}
          />


          <textarea
            name="shortDesc"
            placeholder="Short Description"
            className="w-full border p-3"
            onChange={handleChange}
            required
          />


          <RichTextEditor
            value={blog.content}
            onChange={(html) =>
              setBlog({
                ...blog,
                content: html
              })
            }
          />

          <div className="rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Structured Sections</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="border px-3 py-1.5 rounded text-sm"
                  onClick={() => addSection("content-image")}
                >
                  + Content + Image
                </button>
                <button
                  type="button"
                  className="border px-3 py-1.5 rounded text-sm"
                  onClick={() => addSection("content-full")}
                >
                  + Full Content
                </button>
                <button
                  type="button"
                  className="border px-3 py-1.5 rounded text-sm"
                  onClick={() => addSection("image-content")}
                >
                  + Image + Content
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              This controls the exact blog detail page format (alternating content and image blocks).
            </p>

            <div className="space-y-4">
              {blog.contentSections.map((section, index) => (
                <div key={section.id} className="rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      Block {index + 1} - {section.type}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="border px-2 py-1 rounded text-xs"
                        onClick={() => moveSection(index, -1)}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="border px-2 py-1 rounded text-xs"
                        onClick={() => moveSection(index, 1)}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="border border-red-300 text-red-600 px-2 py-1 rounded text-xs"
                        onClick={() => removeSection(section.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {section.type !== "content-full" && (
                    <div>
                      <label className="text-sm block mb-1">Block Image</label>
                      <input
                        type="file"
                        className="w-full border p-2 rounded"
                        onChange={(e) =>
                          handleSectionImageUpload(section.id, e.target.files?.[0])
                        }
                      />
                      {section.image && (
                        <img
                          loading="lazy"
                          src={section.image}
                          alt="section preview"
                          className="w-full h-52 object-cover rounded mt-2"
                        />
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-sm block mb-1">Block Content</label>
                    <RichTextEditor
                      value={section.content}
                      onChange={(html) => updateSection(section.id, { content: html })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>


          <button
            disabled={uploading}
            className="bg-black text-white px-6 py-3 w-full"
          >
            {uploading
              ? "Uploading..."
              : "Publish Blog"}
          </button>

        </form>

      </div>

    </AdminLayout>
  );

};

export default AddBlog;
