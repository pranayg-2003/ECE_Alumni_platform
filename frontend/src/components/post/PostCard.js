import React, { useState } from "react";
import { usePost } from "../../context/PostContext";
import { useAuth } from "../../context/AuthContext";

const accent = {
  bar: "bg-[#0071e3]",
  avatar: "bg-[#1d1d1f]",
  text: "text-[#0071e3]",
  btn: "bg-[#0071e3] hover:bg-[#0077ed]",
};

const IconHeart = ({ filled, className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.75"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
    />
  </svg>
);

const IconChatBubble = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
    />
  </svg>
);

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
  const { likePost, addComment, removeComment, updatePost, deletePost } = usePost();
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post?.content || "");
  const [deleting, setDeleting] = useState(false);

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
      (!!post.author?._id && post.author._id.toString() === user.id.toString()));

  const isAdmin = user?.role === "admin";

  const canRemoveComment = (c) =>
    isAdmin || (c.user?._id && String(c.user._id) === String(user?.id));

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

  const handleDelete = async () => {
    if (!window.confirm("Delete this post permanently? This cannot be undone.")) return;
    setDeleting(true);
    await deletePost(post._id);
    setDeleting(false);
    setIsEditing(false);
  };

  return (
    <article className="apple-glass-card relative overflow-hidden">
      <div className={`h-0.5 w-full ${accent.bar}`} />

      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent.avatar} text-[15px] font-semibold text-white shadow-sm sm:h-12 sm:w-12`}
            >
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[16px] font-semibold text-slate-900 sm:text-[17px]">{authorName}</h3>
              <p className="text-[13px] text-slate-500 capitalize">
                {post.author?.role || "member"} · {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {isAdmin && !isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-[13px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                {deleting ? "…" : "Remove post"}
              </button>
            )}
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={startEdit}
                className={`rounded-full border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 ${accent.text}`}
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {!isEditing ? (
          <>
            <p className="whitespace-pre-line text-[16px] leading-relaxed text-slate-800 sm:text-[17px]">
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
              className="w-full resize-none rounded-2xl border border-black/[0.08] bg-[#f5f5f7] p-4 text-[15px] outline-none focus:border-[#0071e3]/35 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15"
            />
            <p className="text-[13px] text-slate-400">
              Attachments can’t be changed when editing. Update text only.
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-[14px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete post"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className={`rounded-full px-6 py-2.5 text-[14px] font-semibold text-white ${accent.btn} shadow-sm`}
              >
                Save
              </button>
            </div>
          </>
        )}

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => likePost(post._id)}
              disabled={isEditing}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-semibold transition ${
                likedByUser
                  ? "bg-pink-50 text-pink-600 ring-1 ring-pink-200/80 hover:bg-pink-100"
                  : "bg-[#f5f5f7] text-slate-700 ring-1 ring-black/[0.06] hover:bg-slate-100 hover:text-slate-900"
              } disabled:opacity-40`}
            >
              <IconHeart filled={likedByUser} className="h-6 w-6 shrink-0" />
              <span>{post.likes?.length || 0}</span>
            </button>
            <button
              type="button"
              onClick={() => setCommentsOpen((v) => !v)}
              disabled={isEditing}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-semibold ring-1 ring-black/[0.06] transition disabled:opacity-40 ${
                commentsOpen
                  ? "bg-[#0071e3]/10 text-[#0071e3] ring-[#0071e3]/25"
                  : "bg-[#f5f5f7] text-slate-600 hover:bg-slate-100"
              }`}
              aria-expanded={commentsOpen}
            >
              <IconChatBubble className="h-6 w-6 shrink-0 text-[#0071e3]" />
              <span>{post.comments?.length || 0} comments</span>
            </button>
          </div>
        </div>

        {commentsOpen && (
          <>
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-w-0 flex-1 rounded-full border border-black/[0.08] bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none focus:border-[#0071e3]/35 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15"
                placeholder="Write a comment…"
              />
              <button
                type="button"
                onClick={handleComment}
                className={`shrink-0 rounded-full px-5 py-3 text-[15px] font-semibold text-white ${accent.btn} disabled:opacity-50`}
                disabled={isEditing}
              >
                Send
              </button>
            </div>

            <ul className="space-y-2.5 border-t border-slate-50 pt-4">
              {(post.comments || []).length === 0 ? (
                <li className="text-[14px] text-slate-400">No comments yet.</li>
              ) : (
                (post.comments || []).map((c) => (
                  <li
                    key={c._id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-slate-50/80 px-3 py-2 text-[15px] text-slate-700"
                  >
                    <span className="min-w-0">
                      <span className="font-semibold text-slate-900">{c.user?.name || "User"}</span>
                      <span className="text-slate-400"> · </span>
                      {c.text}
                    </span>
                    {canRemoveComment(c) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm("Remove this comment?")) return;
                          removeComment(post._id, c._id);
                        }}
                        className="shrink-0 text-[12px] font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </div>
    </article>
  );
};

export default PostCard;
