"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useState } from "react";

export default function RichTextEditor({ value, onChange }) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 underline hover:text-blue-300',
        },
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  // Helper to prevent the "Auto-Submit" and "Bubbling" bugs
  const exec = (e, command) => {
    e.preventDefault();
    e.stopPropagation();
    command();
  };

  return (
    <div className="border border-zinc-800 bg-zinc-950/70 rounded overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-zinc-800 bg-zinc-900/40 p-2">
        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().toggleHeading({ level: 1 }).run())}
          className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border rounded transition ${
            editor.isActive("heading", { level: 1 })
              ? "border-blue-500 bg-blue-500/10 text-blue-300"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
          className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border rounded transition ${
            editor.isActive("heading", { level: 2 })
              ? "border-blue-500 bg-blue-500/10 text-blue-300"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().toggleHeading({ level: 3 }).run())}
          className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border rounded transition ${
            editor.isActive("heading", { level: 3 })
              ? "border-blue-500 bg-blue-500/10 text-blue-300"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          H3
        </button>

        <div className="border-l border-zinc-700 mx-0.5" />

        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().toggleBold().run())}
          className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border rounded transition ${
            editor.isActive("bold")
              ? "border-blue-500 bg-blue-500/10 text-blue-300"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().toggleItalic().run())}
          className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border rounded transition ${
            editor.isActive("italic")
              ? "border-blue-500 bg-blue-500/10 text-blue-300"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().toggleStrike().run())}
          className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border rounded transition ${
            editor.isActive("strike")
              ? "border-blue-500 bg-blue-500/10 text-blue-300"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          Strike
        </button>

        {!showLinkInput ? (
          <button
            type="button"
            onClick={(e) => exec(e, () => setShowLinkInput(true))}
            className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border rounded transition ${
              editor.isActive("link")
                ? "border-blue-500 bg-blue-500/10 text-blue-300"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            Link
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()} // Stop backspace/enter from hitting form
              className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-600 text-zinc-200 placeholder-zinc-500 rounded focus:border-blue-500 focus:outline-none w-32"
              autoFocus
            />
            <button
              type="button"
              onClick={(e) => exec(e, () => {
                if (linkUrl.trim()) {
                  editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
                }
                setLinkUrl("");
                setShowLinkInput(false);
              })}
              className="px-2 py-1 text-[10px] uppercase tracking-widest border border-green-600 text-green-300 hover:bg-green-600/10 rounded transition"
            >
              OK
            </button>
            <button
              type="button"
              onClick={(e) => exec(e, () => {
                setLinkUrl("");
                setShowLinkInput(false);
              })}
              className="px-2 py-1 text-[10px] uppercase tracking-widest border border-zinc-600 text-zinc-400 hover:border-zinc-500 rounded transition"
            >
              ✕
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().unsetLink().run())}
          disabled={!editor.isActive("link")}
          className="px-3 py-1.5 text-[11px] uppercase tracking-widest border border-zinc-700 text-zinc-300 hover:border-zinc-500 rounded transition disabled:opacity-50"
        >
          Unlink
        </button>

        <div className="border-l border-zinc-700 mx-0.5" />

        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().toggleBulletList().run())}
          className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border rounded transition ${
            editor.isActive("bulletList")
              ? "border-blue-500 bg-blue-500/10 text-blue-300"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          Bullet
        </button>
        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().toggleOrderedList().run())}
          className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border rounded transition ${
            editor.isActive("orderedList")
              ? "border-blue-500 bg-blue-500/10 text-blue-300"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          List
        </button>
        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().toggleBlockquote().run())}
          className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border rounded transition ${
            editor.isActive("blockquote")
              ? "border-blue-500 bg-blue-500/10 text-blue-300"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          Quote
        </button>

        <div className="border-l border-zinc-700 mx-0.5" />

        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().toggleCodeBlock().run())}
          className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border rounded transition ${
            editor.isActive("codeBlock")
              ? "border-blue-500 bg-blue-500/10 text-blue-300"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
          }`}
        >
          Code
        </button>

        <div className="border-l border-zinc-700 mx-0.5" />

        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().clearNodes().unsetAllMarks().run())}
          className="px-3 py-1.5 text-[11px] uppercase tracking-widest border border-zinc-700 text-zinc-300 hover:border-zinc-500 rounded transition"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().undo().run())}
          className="px-3 py-1.5 text-[11px] uppercase tracking-widest border border-zinc-700 text-zinc-300 hover:border-zinc-500 rounded transition disabled:opacity-50"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={(e) => exec(e, () => editor.chain().focus().redo().run())}
          className="px-3 py-1.5 text-[11px] uppercase tracking-widest border border-zinc-700 text-zinc-300 hover:border-zinc-500 rounded transition disabled:opacity-50"
        >
          Redo
        </button>
      </div>

      <EditorContent
        editor={editor}
        className="prose prose-invert max-w-none px-4 py-3 text-sm text-zinc-300 focus:outline-none overflow-y-auto [&_.ProseMirror]:min-h-80 [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:outline-none [&_p]:text-zinc-300 [&_strong]:font-bold [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-4 [&_ol]:ml-4 [&_li]:text-zinc-300 [&_pre]:bg-zinc-900 [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-auto [&_code]:text-amber-300 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-400 [&_blockquote]:italic"
      />
    </div>
  );
}