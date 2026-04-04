import React, { useCallback, useId, useRef, useState } from "react";
import { usePost } from "../../context/PostContext";
import { useAuth } from "../../context/AuthContext";
import { uploadPostMedia } from "../../utils/api";

const ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf,.doc,.docx,.txt";

const shortName = (name, max = 18) => {
  if (!name || name.length <= max) return name || "file";
  return `${name.slice(0, max - 3)}…`;
};

const CreatePost = () => {
  const inputId = useId();
  const fileInputRef = useRef(null);
  const [content, setContent] = useState("");
  const [staged, setStaged] = useState([]);
  const [localError, setLocalError] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const { addPost, submitting } = usePost();
  const { user } = useAuth();

  const busy = submitting || uploadingMedia;

  const revokePreview = useCallback((items) => {
    items.forEach((item) => {
      if (item.preview) URL.revokeObjectURL(item.preview);
    });
  }, []);

  const addFiles = (fileList) => {
    const next = Array.from(fileList || []);
    if (next.length === 0) return;
    setLocalError("");
    const additions = next.map((file) => {
      const isImage = /^image\//i.test(file.type);
      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: isImage ? URL.createObjectURL(file) : null,
      };
    });
    setStaged((prev) => [...prev, ...additions].slice(0, 10));
  };

  const removeStaged = (id) => {
    setStaged((prev) => {
      const found = prev.find((s) => s.id === id);
      if (found?.preview) URL.revokeObjectURL(found.preview);
      return prev.filter((s) => s.id !== id);
    });
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setLocalError("");

    let attachments = [];
    const files = staged.map((s) => s.file);

    if (files.length > 0) {
      setUploadingMedia(true);
      try {
        const res = await uploadPostMedia(files);
        if (!res.success) {
          setLocalError(res.message || "Upload failed.");
          setUploadingMedia(false);
          return;
        }
        attachments = res.data || [];
      } catch (err) {
        setLocalError(
          err.response?.data?.message || err.message || "Upload failed.",
        );
        setUploadingMedia(false);
        return;
      }
      setUploadingMedia(false);
    }

    const result = await addPost({
      content,
      attachments,
    });

    if (result.success) {
      revokePreview(staged);
      setStaged([]);
      setContent("");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addFiles(e.dataTransfer.files);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-violet-50/40 to-indigo-50/50 shadow-lg shadow-indigo-100/40"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={onDrop}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-indigo-400/15 blur-2xl" />

      <div className="relative border-b border-slate-100/90 bg-white/60 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-violet-500/25">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">
              Drag files anywhere on this card or use + to attach
            </p>
          </div>
        </div>
      </div>

      <div className="relative space-y-4 p-5">
        <textarea
          placeholder="What do you want to share with the community?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-800 shadow-inner shadow-slate-100/50 outline-none ring-0 transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-200/80"
        />

        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {localError && (
          <p className="text-sm text-red-600" role="alert">
            {localError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {staged.map((item) => (
              <div
                key={item.id}
                className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                title={item.file.name}
              >
                {item.preview ? (
                  <img
                    src={item.preview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm">
                    📄
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeStaged(item.id)}
                  className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-lg font-bold text-white opacity-0 transition group-hover:opacity-100"
                  aria-label={`Remove ${item.file.name}`}
                >
                  ×
                </button>
              </div>
            ))}

            {staged.length < 10 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white/80 text-slate-500 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
                title="Add photos or documents"
                aria-label="Add attachment"
              >
                <span className="text-xl leading-none">+</span>
              </button>
            )}
          </div>

          <span className="text-xs text-slate-400 tabular-nums">
            {content.length}/2000
          </span>

          <button
            type="button"
            onClick={handlePost}
            disabled={busy || !content.trim()}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {uploadingMedia
              ? "Uploading…"
              : submitting
                ? "Publishing…"
                : "Publish"}
          </button>
        </div>

        {staged.length > 0 && (
          <p className="text-[11px] text-slate-400">
            {staged.map((s) => shortName(s.file.name)).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
};

export default CreatePost;
