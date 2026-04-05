import React, { useCallback, useId, useRef, useState } from "react";
import { usePost } from "../../context/PostContext";
import { useAuth } from "../../context/AuthContext";
import { uploadPostMedia } from "../../utils/api";
import { toast, toastApiError } from "../../utils/toast";
import ImageLightbox from "../common/ImageLightbox";

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
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, src: "", name: "" });
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

    let attachments = [];
    const files = staged.map((s) => s.file);

    if (files.length > 0) {
      setUploadingMedia(true);
      try {
        const res = await uploadPostMedia(files);
        if (!res.success) {
          toast.error(res.message || "Upload failed.");
          setUploadingMedia(false);
          return;
        }
        attachments = res.data || [];
      } catch (err) {
        toastApiError(err, "Upload failed.");
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
      className="apple-glass-card relative overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={onDrop}
    >
      <div className="relative border-b border-black/[0.06] bg-white/70 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1d1d1f] text-sm font-semibold text-white shadow-md">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#1d1d1f]">{user?.name}</p>
            <p className="text-[12px] text-neutral-500">
              Drag files onto this card or tap + to attach
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
          className="w-full resize-none rounded-2xl border border-black/[0.08] bg-[#f5f5f7] px-4 py-3 text-[15px] text-[#1d1d1f] outline-none transition placeholder:text-neutral-400 focus:border-[#0071e3]/35 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15"
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

        <div className="flex flex-col gap-2 border-t border-black/[0.06] pt-4">
          <div className="flex min-w-0 items-stretch gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {staged.map((item) => (
              <div
                key={item.id}
                className="group relative shrink-0"
                title={item.file.name}
              >
                {item.preview ? (
                  <button
                    type="button"
                    onClick={() =>
                      setLightbox({ open: true, src: item.preview, name: item.file.name })
                    }
                    className="relative flex h-28 w-[7.5rem] items-center justify-center overflow-hidden rounded-xl border border-black/[0.08] bg-slate-100 shadow-sm transition hover:ring-2 hover:ring-[#0071e3]/30 sm:h-32 sm:w-[9.5rem]"
                    aria-label={`Preview ${item.file.name}`}
                  >
                    <img
                      src={item.preview}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                ) : (
                  <div className="flex h-28 w-[7.5rem] items-center justify-center rounded-xl border border-black/[0.08] bg-slate-100 text-sm shadow-sm sm:h-32 sm:w-[9.5rem]">
                    📄
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeStaged(item.id)}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#1d1d1f] text-sm font-bold text-white shadow-md ring-2 ring-white transition hover:bg-red-600"
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
                className="flex h-28 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-black/[0.12] bg-[#f5f5f7] text-neutral-500 transition hover:border-[#0071e3]/40 hover:bg-white hover:text-[#0071e3] sm:h-32"
                title="Add photos or documents"
                aria-label="Add attachment"
              >
                <span className="text-2xl leading-none">+</span>
              </button>
            )}
          </div>

          {staged.some((s) => s.preview) && (
            <p className="text-[11px] text-slate-400">
              Tap an image for a full preview. Photos are shown without cropping when published.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-400 tabular-nums">
              {content.length}/2000
            </span>
            <button
              type="button"
              onClick={handlePost}
              disabled={busy || !content.trim()}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#0071e3] px-5 py-2.5 text-[14px] font-medium text-white shadow-sm transition hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {uploadingMedia
                ? "Uploading…"
                : submitting
                  ? "Publishing…"
                  : "Publish"}
            </button>
          </div>
        </div>

        {staged.length > 0 && (
          <p className="text-[11px] text-slate-400">
            {staged.map((s) => shortName(s.file.name)).join(" · ")}
          </p>
        )}
      </div>

      <ImageLightbox
        open={lightbox.open}
        src={lightbox.src}
        alt={lightbox.name || "Attachment preview"}
        onClose={() => setLightbox({ open: false, src: "", name: "" })}
      />
    </div>
  );
};

export default CreatePost;
