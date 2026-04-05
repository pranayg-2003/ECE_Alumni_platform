// Admin console — /admin — dark theme, activity + user access control

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api, {
  adminBlockUser,
  adminUnblockUser,
  adminDeleteUser,
  fetchAdminActivity,
  fetchAdminPosts,
} from "../../utils/api";
import { toastApiError } from "../../utils/toast";
import toast from "react-hot-toast";
import { usePost } from "../../context/PostContext";
import LandingPageEditor from "../../components/admin/LandingPageEditor";

const firstPostImage = (p) => {
  const atts = Array.isArray(p.attachments) ? p.attachments : [];
  const img = atts.find((a) => a.resourceType === "image");
  if (img?.url) return img.url;
  if (p.thumbnailUrl) return p.thumbnailUrl;
  return null;
};

const uid = (u) => String(u?._id || u?.id || "");

const Metric = ({ label, value, hint }) => (
  <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 backdrop-blur-sm transition hover:border-cyan-500/25 hover:bg-white/[0.05]">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
    {hint ? <p className="mt-1 text-[12px] text-zinc-500">{hint}</p> : null}
  </div>
);

const QuickAction = ({ title, subtitle, onClick, accent = "cyan" }) => {
  const ring =
    accent === "amber"
      ? "hover:border-amber-400/35 hover:shadow-amber-500/10"
      : accent === "rose"
        ? "hover:border-rose-400/35 hover:shadow-rose-500/10"
        : "hover:border-cyan-400/35 hover:shadow-cyan-500/10";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.07] hover:shadow-lg ${ring}`}
    >
      <p className="text-[15px] font-semibold text-white">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{subtitle}</p>
      <p className="mt-3 text-[12px] font-semibold text-cyan-400/90">Open →</p>
    </button>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { posts, loading: postsLoading, loadPosts } = usePost();
  const [tab, setTab] = useState("overview");
  const [activity, setActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockBusy, setBlockBusy] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deleteUserConfirmInput, setDeleteUserConfirmInput] = useState("");
  const [deleteUserBusy, setDeleteUserBusy] = useState(false);

  const [modPosts, setModPosts] = useState([]);
  const [modLoading, setModLoading] = useState(false);
  const [modSearch, setModSearch] = useState("");
  const [debouncedModQ, setDebouncedModQ] = useState("");
  const [modAuthorSearch, setModAuthorSearch] = useState("");
  const [debouncedModAuthor, setDebouncedModAuthor] = useState("");
  const [commentsPost, setCommentsPost] = useState(null);
  const [modBusyId, setModBusyId] = useState(null);
  const [deletePostModal, setDeletePostModal] = useState(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [commentRemoveModal, setCommentRemoveModal] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedModQ(modSearch.trim()), 400);
    return () => clearTimeout(t);
  }, [modSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedModAuthor(modAuthorSearch.trim()), 400);
    return () => clearTimeout(t);
  }, [modAuthorSearch]);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await fetchAdminActivity();
      if (res?.success && res.data) setActivity(res.data);
      else {
        setActivity(null);
        if (res && res.success === false) {
          toast.error(res.message || "Could not load admin activity.");
        }
      }
    } catch (e) {
      toastApiError(e, "Could not load activity.");
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await api.get("/users/all");
      const body = res.data;
      if (body?.success && Array.isArray(body.data)) {
        setAllUsers(body.data);
      } else {
        setAllUsers([]);
        toast.error(body?.message || "Could not load users.");
      }
    } catch (e) {
      toastApiError(e, "Could not load users.");
      setAllUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadModPosts = useCallback(async () => {
    setModLoading(true);
    try {
      const params = { limit: 120 };
      if (debouncedModQ) params.q = debouncedModQ;
      if (debouncedModAuthor) params.author = debouncedModAuthor;
      const res = await fetchAdminPosts(params);
      if (res?.success && Array.isArray(res.data)) {
        setModPosts(res.data);
      } else {
        setModPosts([]);
        if (res && res.success === false) {
          toast.error(res.message || "Could not load moderation list.");
        }
      }
    } catch (e) {
      toastApiError(e, "Could not load posts for moderation.");
      setModPosts([]);
    } finally {
      setModLoading(false);
    }
  }, [debouncedModQ, debouncedModAuthor]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    if (tab === "moderation") loadModPosts();
  }, [tab, loadModPosts]);

  useEffect(() => {
    if (tab === "users") loadUsers();
  }, [tab, loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) => {
      const blob = `${u.name || ""} ${u.email || ""} ${u.role || ""} ${u.branch || ""} ${u.company || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [allUsers, search]);

  const submitBlock = async () => {
    if (!blockTarget) return;
    const r = blockReason.trim();
    if (r.length < 3) {
      toast.error("Add a short reason (at least 3 characters).");
      return;
    }
    setBlockBusy(true);
    try {
      await adminBlockUser(uid(blockTarget), r);
      toast.success("User blocked. They can no longer use the portal.");
      setBlockTarget(null);
      setBlockReason("");
      loadUsers();
      loadActivity();
    } catch (e) {
      toastApiError(e, "Could not block user.");
    } finally {
      setBlockBusy(false);
    }
  };

  const submitDeleteUser = async () => {
    if (!deleteUserTarget) return;
    if (deleteUserConfirmInput.trim().toUpperCase() !== "DELETE") {
      toast.error("Type DELETE to confirm permanent removal.");
      return;
    }
    setDeleteUserBusy(true);
    try {
      await adminDeleteUser(uid(deleteUserTarget));
      toast.success("User permanently deleted.");
      setDeleteUserTarget(null);
      setDeleteUserConfirmInput("");
      loadUsers();
    } catch (e) {
      toastApiError(e, "Could not delete user.");
    } finally {
      setDeleteUserBusy(false);
    }
  };

  const doUnblock = async (u) => {
    try {
      await adminUnblockUser(uid(u));
      toast.success("User unblocked.");
      loadUsers();
      loadActivity();
    } catch (e) {
      toastApiError(e, "Could not unblock.");
    }
  };

  const openDeletePostModal = (post) => {
    setDeleteConfirmInput("");
    setDeletePostModal(post);
  };

  const confirmDeletePost = async () => {
    const post = deletePostModal;
    if (!post) return;
    if (deleteConfirmInput.trim().toUpperCase() !== "DELETE") {
      toast.error('Type DELETE in the box to confirm.');
      return;
    }
    const postId = post._id;
    setModBusyId(`post:${postId}`);
    try {
      await api.delete(`/posts/${postId}`);
      toast.success("Post removed from the platform.");
      setDeletePostModal(null);
      setDeleteConfirmInput("");
      setCommentsPost((cp) => (cp && String(cp._id) === String(postId) ? null : cp));
      setModPosts((prev) => prev.filter((p) => String(p._id) !== String(postId)));
      loadActivity();
      loadPosts();
    } catch (e) {
      toastApiError(e, "Could not delete post.");
    } finally {
      setModBusyId(null);
    }
  };

  const confirmRemoveComment = async () => {
    if (!commentRemoveModal) return;
    const { postId, comment } = commentRemoveModal;
    const commentId = comment._id;
    setModBusyId(`c:${commentId}`);
    try {
      await api.delete(`/posts/${postId}/comments/${commentId}`);
      toast.success("Comment removed.");
      setCommentRemoveModal(null);
      setModPosts((prev) =>
        prev.map((p) => {
          if (String(p._id) !== String(postId)) return p;
          return {
            ...p,
            comments: (p.comments || []).filter((c) => String(c._id) !== String(commentId)),
          };
        }),
      );
      setCommentsPost((cp) => {
        if (!cp || String(cp._id) !== String(postId)) return cp;
        return {
          ...cp,
          comments: (cp.comments || []).filter((c) => String(c._id) !== String(commentId)),
        };
      });
      loadActivity();
      loadPosts();
    } catch (e) {
      toastApiError(e, "Could not remove comment.");
    } finally {
      setModBusyId(null);
    }
  };

  const totals = activity?.totals;
  const signups = activity?.signups;
  const recent = activity?.recentUsers || [];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "moderation", label: "Content moderation" },
    { id: "users", label: "Users & access" },
    { id: "landing", label: "Landing page" },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] font-apple text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/90 to-blue-600 text-[12px] font-bold text-white shadow-lg shadow-cyan-500/20">
              A
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight text-white">MentorBridge Admin</p>
              <p className="truncate text-[12px] text-zinc-500">Usage & access control</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition sm:px-4 ${
                  tab === t.id
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
            <Link
              to="/"
              className="hidden rounded-full border border-white/10 px-3 py-2 text-[13px] font-medium text-zinc-300 hover:bg-white/[0.05] sm:inline-block"
            >
              Public site
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] font-medium text-red-300 hover:bg-red-500/20"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        {tab === "overview" && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-zinc-900/80 via-[#0c1422] to-cyan-950/40 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-cyan-400/90">Overview</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Hello, {user?.name?.split(" ")[0] || "admin"}
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
                Track signups, mentorship, and referrals. Remove posts or comments from{" "}
                <span className="text-zinc-300">Content moderation</span>. Block accounts under{" "}
                <span className="text-zinc-300">Users &amp; access</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction
                title="Moderate feed"
                subtitle="Search every post, delete threads or single comments."
                onClick={() => setTab("moderation")}
              />
              <QuickAction
                title="Block / unblock"
                subtitle="Deactivate accounts with a reason; restore access anytime."
                accent="rose"
                onClick={() => setTab("users")}
              />
              <QuickAction
                title="Landing page"
                subtitle="Edit marketing sections and media on the public home page."
                accent="amber"
                onClick={() => setTab("landing")}
              />
              <QuickAction
                title="Refresh metrics"
                subtitle="Pull latest counts and recent signups again."
                onClick={() => {
                  loadActivity();
                  loadUsers();
                  toast.success("Metrics refreshed.");
                }}
              />
            </div>

            {activityLoading ? (
              <p className="text-zinc-500">Loading metrics…</p>
            ) : totals ? (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                  <Metric label="Total users" value={totals.users} />
                  <Metric label="Students" value={totals.students} />
                  <Metric label="Alumni" value={totals.alumni} />
                  <Metric label="Admins" value={totals.admins} />
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
                  <Metric label="Active accounts" value={totals.activeUsers} hint="Can sign in & use API" />
                  <Metric label="Blocked" value={totals.inactiveUsers} hint="Deactivated by admin" />
                  <Metric label="Published posts" value={totals.posts} hint="On community feed" />
                  <Metric label="All post rows" value={totals.postsAll ?? totals.posts} hint="Moderation total" />
                  <Metric label="Chat messages" value={totals.messages} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
                  <Metric
                    label="Mentorship pending"
                    value={totals.mentorshipPending}
                    hint="Awaiting alumni response"
                  />
                  <Metric label="Active mentorships" value={totals.mentorshipAccepted} />
                  <Metric label="Open referral asks" value={totals.referralOpen} />
                </div>
                {signups && (
                  <div className="grid grid-cols-2 gap-3 lg:max-w-md">
                    <Metric label="New accounts (7d)" value={signups.last7Days} />
                    <Metric label="New accounts (30d)" value={signups.last30Days} />
                  </div>
                )}
              </>
            ) : null}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02]">
              <div className="border-b border-white/[0.08] px-5 py-4">
                <h2 className="text-[16px] font-semibold text-white">Recent registrations</h2>
                <p className="text-[13px] text-zinc-500">Latest accounts by created date</p>
              </div>
              <ul className="divide-y divide-white/[0.06]">
                {recent.length === 0 ? (
                  <li className="px-5 py-8 text-center text-[14px] text-zinc-500">No data yet.</li>
                ) : (
                  recent.map((u) => (
                    <li key={uid(u)} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-white">{u.name}</p>
                        <p className="text-[13px] text-zinc-500">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
                          {u.role}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            u.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          {u.isActive ? "Active" : "Blocked"}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
                <div>
                  <h2 className="text-[16px] font-semibold text-white">Feed preview</h2>
                  <p className="text-[13px] text-zinc-500">Compact grid — open moderation to search by author or delete</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("moderation")}
                  className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-zinc-900 hover:bg-zinc-100"
                >
                  Open moderation
                </button>
              </div>
              <div className="p-4">
                {postsLoading ? (
                  <p className="text-zinc-500">Loading…</p>
                ) : (posts || []).length === 0 ? (
                  <p className="text-zinc-500">No posts yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {(posts || []).slice(0, 10).map((p) => {
                      const img = firstPostImage(p);
                      return (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => setTab("moderation")}
                          className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] text-left transition hover:border-white/20 hover:bg-white/[0.07]"
                        >
                          <div className="aspect-[4/3] max-h-24 w-full bg-zinc-800">
                            {img ? (
                              <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[11px] text-zinc-500">No image</div>
                            )}
                          </div>
                          <div className="min-w-0 p-2">
                            <p className="truncate text-[11px] font-semibold text-zinc-300">{p.author?.name || "User"}</p>
                            <p className="line-clamp-2 text-[11px] leading-snug text-zinc-500">{p.content}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "moderation" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-rose-950/40 via-[#0c1422] to-zinc-900/80 p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-300/90">Moderation</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Posts grid</h2>
              <p className="mt-2 max-w-2xl text-[14px] text-zinc-400">
                Filter by author name or email, or by words in the post. Small cards keep the page compact; delete or
                manage comments from each card.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
              <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-3xl">
                <input
                  type="search"
                  value={modAuthorSearch}
                  onChange={(e) => setModAuthorSearch(e.target.value)}
                  placeholder="Search by author (name or email)…"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[14px] text-white outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-cyan-500/35"
                />
                <input
                  type="search"
                  value={modSearch}
                  onChange={(e) => setModSearch(e.target.value)}
                  placeholder="Search post text…"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[14px] text-white outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-rose-500/35"
                />
              </div>
              <button
                type="button"
                onClick={() => loadModPosts()}
                className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-white/[0.1]"
              >
                Refresh list
              </button>
            </div>

            {modLoading ? (
              <p className="text-zinc-500">Loading posts…</p>
            ) : modPosts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-zinc-500">
                No posts match these filters.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {modPosts.map((p) => {
                  const author = p.author;
                  const busyPost = modBusyId === `post:${p._id}`;
                  const img = firstPostImage(p);
                  const nComments = (p.comments || []).length;
                  return (
                    <li
                      key={p._id}
                      className="relative flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] transition hover:border-white/[0.15]"
                    >
                      {busyPost && (
                        <div
                          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-[#09090b]/70 backdrop-blur-[2px]"
                          aria-busy
                        >
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                          <span className="text-[10px] font-medium text-rose-200">Removing…</span>
                        </div>
                      )}
                      <div className="aspect-[4/3] max-h-[100px] w-full shrink-0 bg-zinc-900">
                        {img ? (
                          <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-zinc-500">
                            Text only
                          </div>
                        )}
                      </div>
                      <div className="flex min-h-0 flex-1 flex-col p-2.5 pt-2">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="truncate text-[11px] font-semibold text-white">{author?.name || "—"}</span>
                          {author?.role && (
                            <span className="shrink-0 rounded bg-white/10 px-1 py-0.5 text-[9px] uppercase text-zinc-400">
                              {author.role}
                            </span>
                          )}
                        </div>
                        {!p.isPublished && (
                          <span className="mt-0.5 text-[9px] font-medium text-amber-300/90">Unpublished</span>
                        )}
                        <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-zinc-400">{p.content}</p>
                        <p className="mt-1 text-[10px] text-zinc-600">
                          {nComments} c · {(p.likes || []).length} ♥
                        </p>
                        <p className="mt-0.5 text-[9px] text-zinc-600">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                        <div className="mt-auto flex flex-col gap-1.5 pt-2">
                          <button
                            type="button"
                            onClick={() => openDeletePostModal(p)}
                            disabled={busyPost}
                            className="w-full rounded-md border border-red-500/45 bg-red-600/85 py-1.5 text-[11px] font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setCommentsPost(p)}
                            className="w-full rounded-md border border-white/15 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-white/[0.06]"
                          >
                            Comments ({nComments})
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Users & access</h2>
                <p className="text-[14px] text-zinc-500">
                  Block revokes login and API access. Delete permanently removes the user, posts, chats, and mentorship data
                  (not available for admin accounts).
                </p>
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, role…"
                className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[14px] text-white outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
              {usersLoading ? (
                <p className="p-8 text-center text-zinc-500">Loading users…</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-[14px]">
                    <thead className="border-b border-white/[0.08] bg-white/[0.04] text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Detail</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {filteredUsers.map((u) => {
                        const id = uid(u);
                        const isAdmin = u.role === "admin";
                        const active = u.isActive !== false;
                        return (
                          <tr key={id} className="hover:bg-white/[0.02]">
                            <td className="px-4 py-3">
                              <p className="font-medium text-white">{u.name}</p>
                              <p className="text-[13px] text-zinc-500">{u.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[12px] font-medium capitalize text-zinc-300">
                                {u.role}
                              </span>
                            </td>
                            <td className="max-w-[200px] px-4 py-3 text-[13px] text-zinc-400">
                              {u.role === "student" && (
                                <span className="line-clamp-2">
                                  {u.branch || "—"} {u.year != null ? `· Y${u.year}` : ""}
                                </span>
                              )}
                              {u.role === "alumni" && <span className="line-clamp-2">{u.company || "—"}</span>}
                              {u.role === "admin" && "—"}
                            </td>
                            <td className="px-4 py-3">
                              {active ? (
                                <span className="text-emerald-400">Active</span>
                              ) : (
                                <div>
                                  <span className="text-red-400">Blocked</span>
                                  {u.blockedReason ? (
                                    <p className="mt-1 max-w-xs text-[12px] text-zinc-500 line-clamp-2">{u.blockedReason}</p>
                                  ) : null}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isAdmin ? (
                                <span className="text-[12px] text-zinc-600">Protected</span>
                              ) : (
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  {active ? (
                                    <button
                                      type="button"
                                      onClick={() => setBlockTarget(u)}
                                      className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-[12px] font-semibold text-red-300 hover:bg-red-500/20"
                                    >
                                      Block
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => doUnblock(u)}
                                      className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-semibold text-emerald-300 hover:bg-emerald-500/20"
                                    >
                                      Unblock
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteUserTarget(u);
                                      setDeleteUserConfirmInput("");
                                    }}
                                    className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-zinc-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200"
                                  >
                                    Delete account
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "landing" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-[#0a1628] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] sm:p-8">
              <div className="flex flex-col gap-4 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-400/90">Content</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">Landing page</h2>
                  <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-zinc-500">
                    Section-based editor with uploads (images & video), YouTube hero, gallery tiles, and spotlight photos.
                    Save, then open the public site to preview.
                  </p>
                </div>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center rounded-full border border-cyan-500/35 bg-cyan-500/10 px-5 py-2.5 text-[14px] font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                >
                  View live site ↗
                </a>
              </div>
              <div className="pt-6">
                <LandingPageEditor />
              </div>
            </div>
          </div>
        )}
      </main>

      {commentsPost && (
        <div
          className="fixed inset-0 z-[105] flex items-end justify-center bg-black/75 p-4 backdrop-blur-md sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="admin-comments-title"
        >
          <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="shrink-0 border-b border-white/10 px-5 py-4">
              <h3 id="admin-comments-title" className="text-lg font-semibold text-white">
                Comments
              </h3>
              <p className="mt-1 truncate text-[13px] text-zinc-400">
                {commentsPost.author?.name || "User"} · {commentsPost.content?.slice(0, 80)}
                {(commentsPost.content || "").length > 80 ? "…" : ""}
              </p>
            </div>
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {(commentsPost.comments || []).length === 0 ? (
                <li className="text-[14px] text-zinc-500">No comments.</li>
              ) : (
                (commentsPost.comments || []).map((c) => {
                  const busyC = modBusyId === `c:${String(c._id)}`;
                  return (
                    <li
                      key={c._id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2.5"
                    >
                      <div className="min-w-0 text-[13px] text-zinc-200">
                        <span className="font-semibold text-white">{c.user?.name || "User"}</span>
                        <span className="text-zinc-500"> · </span>
                        {c.text}
                      </div>
                      <button
                        type="button"
                        disabled={busyC}
                        onClick={() => setCommentRemoveModal({ postId: commentsPost._id, comment: c })}
                        className="shrink-0 rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {busyC ? "…" : "Remove"}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="shrink-0 border-t border-white/10 p-4">
              <button
                type="button"
                onClick={() => setCommentsPost(null)}
                className="w-full rounded-full border border-white/15 py-2.5 text-[14px] font-medium text-zinc-300 hover:bg-white/[0.06]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deletePostModal && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/75 p-4 backdrop-blur-md sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="admin-delete-post-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <h3 id="admin-delete-post-title" className="text-lg font-semibold text-white">
              Delete post permanently?
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">
              This removes the post and all of its comments from everyone’s feed. This cannot be undone.
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Preview</p>
              <p className="mt-2 max-h-28 overflow-y-auto whitespace-pre-line text-[14px] text-zinc-200">
                {deletePostModal.content}
              </p>
              <p className="mt-2 text-[12px] text-zinc-500">
                {(deletePostModal.comments || []).length} comment(s) will be removed with it.
              </p>
            </div>
            <label className="mt-4 block text-[13px] font-medium text-zinc-400">
              Type <span className="font-mono text-rose-300">DELETE</span> to confirm
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-[15px] text-white outline-none focus:ring-2 focus:ring-rose-500/40"
                placeholder="DELETE"
              />
            </label>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeletePostModal(null);
                  setDeleteConfirmInput("");
                }}
                className="rounded-full px-4 py-2.5 text-[14px] font-medium text-zinc-400 hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePost}
                disabled={modBusyId?.startsWith("post:")}
                className="rounded-full bg-red-600 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {modBusyId?.startsWith("post:") ? "Removing…" : "Remove post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {commentRemoveModal && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/75 p-4 backdrop-blur-md sm:items-center"
          role="dialog"
          aria-modal
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Remove comment?</h3>
            <p className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 text-[14px] text-zinc-300">
              <span className="font-semibold text-white">{commentRemoveModal.comment.user?.name || "User"}</span>
              <span className="text-zinc-500"> · </span>
              {commentRemoveModal.comment.text}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCommentRemoveModal(null)}
                className="rounded-full px-4 py-2.5 text-[14px] font-medium text-zinc-400 hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveComment}
                disabled={modBusyId?.startsWith("c:")}
                className="rounded-full bg-red-600 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {modBusyId === `c:${String(commentRemoveModal.comment._id)}`
                  ? "Removing…"
                  : "Remove comment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {blockTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Block {blockTarget.name}?</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">
              They will be signed out and cannot log in until you unblock them.
            </p>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={4}
              placeholder="Reason (required, min. 3 characters)"
              className="mt-4 w-full resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[14px] text-white outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setBlockTarget(null);
                  setBlockReason("");
                }}
                className="rounded-full px-4 py-2.5 text-[14px] font-medium text-zinc-400 hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitBlock}
                disabled={blockBusy}
                className="rounded-full bg-red-600 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {blockBusy ? "Blocking…" : "Block user"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteUserTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="delete-user-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <h3 id="delete-user-title" className="text-lg font-semibold text-white">
              Permanently delete {deleteUserTarget.name}?
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">
              This removes their account, posts, messages, mentorship requests, and related data. This cannot be undone.
            </p>
            <p className="mt-3 text-[13px] text-zinc-500">
              <span className="font-medium text-zinc-300">{deleteUserTarget.email}</span>
            </p>
            <label className="mt-4 block text-[13px] font-medium text-zinc-400">
              Type <span className="font-mono text-rose-300">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteUserConfirmInput}
              onChange={(e) => setDeleteUserConfirmInput(e.target.value)}
              autoComplete="off"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[14px] text-white outline-none focus:ring-2 focus:ring-rose-500/40"
              placeholder="DELETE"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteUserTarget(null);
                  setDeleteUserConfirmInput("");
                }}
                className="rounded-full px-4 py-2.5 text-[14px] font-medium text-zinc-400 hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDeleteUser}
                disabled={deleteUserBusy}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {deleteUserBusy ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
