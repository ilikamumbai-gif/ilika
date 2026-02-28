import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useBlog } from "../../context/BlogProvider";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase/firebaseConfig";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Image from "@tiptap/extension-image";

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

  const btn = "px-2 py-1 border rounded text-sm hover:bg-gray-100";


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

        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn}>B</button>

        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn}>I</button>

        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn}>U</button>

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn}>H1</button>

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn}>H2</button>

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn}>• List</button>

        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn}>1. List</button>

        {/* IMAGE BUTTON */}

        <label className={btn}>
          Image
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleInsertImage}
          />
        </label>

        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn}>Undo</button>

        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn}>Redo</button>

      </div>

      <EditorContent
        editor={editor}
        className="min-h-[200px] outline-none prose max-w-none"
      />

    </div>
  );
};


const AddBlog = () => {
  const navigate = useNavigate();
  const { addBlog } = useBlog();
  const [uploading, setUploading] = useState(false);
  const [blog, setBlog] = useState({
    title: "",
    image: "",
    author: "",
    shortDesc: "",
    content: ""
  });

  const [preview, setPreview] = useState(null);

  const handleChange = (e) =>
    setBlog({ ...blog, [e.target.name]: e.target.value });

  // IMAGE UPLOAD
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

  const submitBlog = (e) => {
    e.preventDefault();

    addBlog(blog);

    navigate("/admin/blogs");
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Create Blog</h1>

        <form onSubmit={submitBlog} className="space-y-5">

          <input
            name="title"
            placeholder="Blog Title"
            className="w-full border p-3 rounded"
            onChange={handleChange}
            required
          />

          <div>
            <label className="text-sm font-medium">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              className="w-full border p-2 rounded"
              onChange={handleImageUpload}
              required
            />

            {preview && (
              <img
                src={preview}
                className="w-full h-64 object-cover rounded mt-3"
                alt="preview"
              />
            )}
          </div>

          <input
            name="author"
            placeholder="Author"
            className="w-full border p-3 rounded"
            onChange={handleChange}
            required
          />

          <textarea
            name="shortDesc"
            placeholder="Short Description"
            rows="3"
            className="w-full border p-3 rounded"
            onChange={handleChange}
            required
          />

          <div>
            <label className="font-medium">Blog Content</label>

            <RichTextEditor
              value={blog.content}
              onChange={(html) =>
                setBlog({ ...blog, content: html })
              }
            />
          </div>

          <button
            disabled={uploading}
            className="bg-black text-white px-6 py-3 rounded-lg w-full"
          >
            {uploading ? "Uploading..." : "Publish Blog"}
          </button>

        </form>
      </div>
    </AdminLayout>
  );
};

export default AddBlog;