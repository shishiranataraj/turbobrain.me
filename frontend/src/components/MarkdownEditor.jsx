import { useRef, useState } from "react";
import Markdown from "react-markdown";

export default function MarkdownEditor({ post, onSave, onCancel }) {
  const [title, setTitle] = useState(post?.title || "");
  const [summary, setSummary] = useState(post?.summary || "");
  const [content, setContent] = useState(post?.content || "");
  const [published, setPublished] = useState(post?.published || false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const cursorPos = useRef(0);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ title, summary, content, published });
    setSaving(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Upload failed");
        return;
      }
      const { url } = await res.json();
      const markdown = `![${file.name}](${url})`;

      // Insert at saved cursor position
      const pos = cursorPos.current;
      const before = content.slice(0, pos);
      const after = content.slice(pos);
      const newline = before.length && !before.endsWith("\n") ? "\n" : "";
      setContent(before + newline + markdown + "\n" + after);
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="editor">
      <div className="editor-fields">
        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="editor-title"
        />
        <input
          type="text"
          placeholder="Short summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="editor-summary"
        />
        <label className="editor-toggle">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Published
        </label>
      </div>
      <div className="editor-toolbar">
        <button
          type="button"
          onClick={() => {
            cursorPos.current = textareaRef.current?.selectionStart || content.length;
            fileInputRef.current?.click();
          }}
          disabled={uploading}
          className="btn-secondary"
        >
          {uploading ? "Uploading..." : "Add Image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          hidden
        />
      </div>
      <div className="editor-split">
        <textarea
          ref={textareaRef}
          placeholder="Write your markdown here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="editor-textarea"
        />
        <div className="editor-preview markdown-body">
          <Markdown>{content}</Markdown>
        </div>
      </div>
      <div className="editor-actions">
        <button onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? "Saving..." : "Save"}
        </button>
        {onCancel && <button onClick={onCancel} className="btn-secondary">Cancel</button>}
      </div>
    </div>
  );
}
