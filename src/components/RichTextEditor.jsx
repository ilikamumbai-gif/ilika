import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import HorizontalRule from "@tiptap/extension-horizontal-rule";

/* ================= RICH TEXT EDITOR ================= */
const RichTextEditor = ({ value, onChange }) => {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Strike,
      HorizontalRule,
    ],
    content: value || "<p>Start writing product description...</p>",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const btn = "px-2 py-1 border rounded text-sm hover:bg-gray-100";

  return (
    <div className="border rounded-lg p-3 bg-white space-y-3">

      {/* TOOLBAR */}
      <div className="flex flex-wrap gap-2 border-b pb-2">

        {/* HEADINGS */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn}>H3</button>

        {/* TEXT STYLE */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn}><b>B</b></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn}><i>I</i></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn}><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn}><s>S</s></button>

        {/* LISTS */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn}>• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn}>1. List</button>

        {/* BLOCKS */}
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn}>" Quote</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn}>—</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btn}>{"</>"}</button>

        {/* HISTORY */}
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn}>Undo</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn}>Redo</button>

        {/* CLEAR */}
        <button type="button" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} className={btn}>Clear</button>

      </div>

      {/* EDITOR */}
      <EditorContent editor={editor} className="min-h-[200px] outline-none prose max-w-none" />
    </div>
  );
};
