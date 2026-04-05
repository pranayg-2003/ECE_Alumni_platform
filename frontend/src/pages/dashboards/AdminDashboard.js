// Admin console — /admin — dark theme, activity + user access control

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api, {
  adminBlockUser,
  adminUnblockUser,
  fetchAdminActivity,
} from "../../utils/api";
import { toastApiError } from "../../utils/toast";
import toast from "react-hot-toast";
import { usePost } from "../../context/PostContext";
import PostCard from "../../components/post/PostCard";
import LandingPageEditor from "../../components/admin/LandingPageEditor";

const uid = (u) => String(u?._id || u?.id || "");

const Metric = ({ label, value, hint }) => (
  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 backdrop-blur-sm">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
    {hint ? <p className="mt-1 text-[12px] text-zinc-500">{hint}</p> : null}
  </div>
);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { posts, loading: postsLoading } = usePost();
  const [tab, setTab] = useState("overview");
  const [activity, setActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockBusy, setBlockBusy] = useState(false);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await fetchAdminActivity();
      if (res.success) setActivity(res.data);
      else setActivity(null);
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
      setAllUsers(res.data?.data || []);
    } catch (e) {
      toastApiError(e, "Could not load users.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
    loadUsers();
  }, [loadActivity, loadUsers]);

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

  const totals = activity?.totals;
  const signups = activity?.signups;
  const recent = activity?.recentUsers || [];

  const tabs = [
    { id: "overview", label: "Activity" },
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
                Track signups, content, and mentorship volume. Block accounts from the Users tab when you need to
                revoke access.
              </p>
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
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                  <Metric label="Active accounts" value={totals.activeUsers} hint="Can sign in & use API" />
                  <Metric label="Blocked" value={totals.inactiveUsers} hint="Deactivated by admin" />
                  <Metric label="Published posts" value={totals.posts} />
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
              <div className="border-b border-white/[0.08] px-5 py-4">
                <h2 className="text-[16px] font-semibold text-white">Latest posts</h2>
                <p className="text-[13px] text-zinc-500">Moderate from the feed context</p>
              </div>
              <div className="space-y-4 p-4">
                {postsLoading ? (
                  <p className="text-zinc-500">Loading…</p>
                ) : (posts || []).length === 0 ? (
                  <p className="text-zinc-500">No posts yet.</p>
                ) : (
                  (posts || []).slice(0, 4).map((p) => (
                    <div key={p._id} className="rounded-2xl border border-white/[0.06] bg-[#fafafa] text-zinc-900">
                      <PostCard post={p} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Users & access</h2>
                <p className="text-[14px] text-zinc-500">Block to revoke portal access (login + API). Unblock to restore.</p>
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
                              ) : active ? (
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
    </div>
  );
};

export default AdminDashboard;
