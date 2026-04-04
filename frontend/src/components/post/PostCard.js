import React, { useState } from "react";
import { usePost } from "../../context/PostContext";
import { useAuth } from "../../context/AuthContext";

const accent = {
  bar: "bg-[#0071e3]",
  avatar: "bg-[#1d1d1f]",
  text: "text-[#0071e3]",
  btn: "bg-[#0071e3] hover:bg-[#0077ed]",
};

const PostMedia = ({ post }) => {
  const attachments = Array.isArray(post.attachments) ? post.attachments : [];
  const images = attachments.filter((a) => a.resourceType === "image");
  const files = attachments.filter((a) => a.resourceType === "raw");
  const legacyThumb = post.thumbnailUrl && attachments.length === 0;

  if (attachments.length === 0 && !legacyThumb) return null;

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div
          className={
            images.length === 1
              ? "overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
              : "grid grid-cols-2 gap-2 sm:grid-cols-2"
          }
        >
          {images.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              className={
                images.length === 1
                  ? "relative aspect-[4/3] max-h-[420px] w-full bg-slate-100"
                  : "relative aspect-square overflow-hidden rounded-xl border border-slate-100 bg-slate-100"
              }
            >
              <img
                src={img.url}
                alt={img.originalName || "Post image"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {legacyThumb && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
          <img
            src={post.thumbnailUrl}
            alt="Post attachment"
            className="max-h-[420px] w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={`${f.url}-${i}`}>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-[#f5f5f7] px-4 py-3 text-sm transition hover:border-[#0071e3]/25 hover:bg-white"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
                  📎
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800">
                    {f.originalName || "Download file"}
                  </span>
                  <span className="text-xs text-[#0071e3]">Open or download</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const PostCard = ({ post }) => {
  const { likePost, addComment, updatePost } = usePost();
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post?.content || "");

  const handleComment = async () => {
    if (!comment.trim()) return;
    await addComment(post._id, comment);
    setComment("");
  };

  const authorName = post.author?.name || "Unknown User";
  const likedByUser = post.likes?.some((l) => l.toString() === user?.id);
  const canEdit =
    !!user &&
    (user.role === "admin" ||
      (!!post.author?._id &&
        post.author._id.toString() === user.id.toString()));

  const startEdit = () => {
    setEditContent(post.content || "");
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async () => {
    const res = await updatePost(post._id, {
      content: editContent,
    });
    if (res?.success) setIsEditing(false);
  };

  return (
    <article className="apple-glass-card relative overflow-hidden">
      <div className={`h-0.5 w-full ${accent.bar}`} />

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.avatar} text-sm font-semibold text-white shadow-sm`}
            >
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-slate-900">
                {authorName}
              </h3>
              <p className="text-xs text-slate-500 capitalize">
                {post.author?.role || "member"} ·{" "}
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {canEdit && !isEditing && (
            <button
              type="button"
              onClick={startEdit}
              className={`shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 ${accent.text}`}
            >
              Edit
            </button>
          )}
        </div>

        {!isEditing ? (
          <>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-800">
              {post.content}
            </p>
            <PostMedia post={post} />
          </>
        ) : (
          <>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl border border-black/[0.08] bg-[#f5f5f7] p-3 text-sm outline-none focus:border-[#0071e3]/35 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15"
            />
            <p className="text-xs text-slate-400">
              Attachments can’t be changed when editing. Update text only.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className={`rounded-full px-5 py-2 text-sm font-medium text-white ${accent.btn} shadow-sm`}
              >
                Save
              </button>
            </div>
          </>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-600">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => likePost(post._id)}
              className={`font-semibold transition ${
                likedByUser
                  ? "text-pink-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {likedByUser ? "♥" : "♡"} {post.likes?.length || 0}
            </button>
            <span className="font-semibold text-slate-500">
              💬 {post.comments?.length || 0}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-w-0 flex-1 rounded-full border border-black/[0.08] bg-[#f5f5f7] px-4 py-2 text-sm outline-none focus:border-[#0071e3]/35 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15"
            placeholder="Write a comment…"
          />
          <button
            type="button"
            onClick={handleComment}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium text-white ${accent.btn} disabled:opacity-50`}
            disabled={isEditing}
          >
            Send
          </button>
        </div>

        <ul className="space-y-2 border-t border-slate-50 pt-3">
          {(post.comments || []).map((c) => (
            <li key={c._id} className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">
                {c.user?.name || "User"}
              </span>
              <span className="text-slate-400"> · </span>
              {c.text}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
};

export default PostCard;
