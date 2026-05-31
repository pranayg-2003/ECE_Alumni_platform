import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import {
  fetchReferralBoard,
  fetchMyReferralSeeks,
  createReferralSeek,
  updateReferralSeek,
  deleteReferralSeekApi,
} from "../utils/api";
import { toastApiError } from "../utils/toast";

const SEEK_LABELS = {
  internship: "Internship",
  full_time: "Full-time",
  research: "Research",
  other: "Other",
};

const STATUS_LABELS = {
  open: "Open",
  filled: "Filled",
  closed: "Closed",
};

const parseList = (raw) =>
  String(raw || "")
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

const ReferralsPage = () => {
  const { user } = useAuth();
  const { openMessagesWithUser } = useChat();
  const isStudent = user?.role === "student";
  const isAlumni = user?.role === "alumni";
  const isAdmin = user?.role === "admin";
  const showBoard = isAlumni || isAdmin;

  const [board, setBoard] = useState([]);
  const [boardLoading, setBoardLoading] = useState(showBoard);
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [debouncedBranch, setDebouncedBranch] = useState("");
  const [seekType, setSeekType] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 420);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedBranch(branch.trim()), 420);
    return () => clearTimeout(t);
  }, [branch]);

  const [mine, setMine] = useState([]);
  const [mineLoading, setMineLoading] = useState(isStudent);

  const [form, setForm] = useState({
    title: "",
    summary: "",
    seekType: "internship",
    targetRoles: "",
    targetCompanies: "",
    skills: "",
    linkUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const loadBoard = useCallback(async () => {
    if (!showBoard) return;
    setBoardLoading(true);
    try {
      const params = { status: statusFilter };
      if (debouncedQ) params.q = debouncedQ;
      if (debouncedBranch) params.branch = debouncedBranch;
      if (seekType) params.seekType = seekType;
      const res = await fetchReferralBoard(params);
      if (res.success) setBoard(res.data || []);
      else setBoard([]);
    } catch (e) {
      toastApiError(e, "Could not load referral board.");
      setBoard([]);
    } finally {
      setBoardLoading(false);
    }
  }, [showBoard, debouncedQ, debouncedBranch, seekType, statusFilter]);

  const loadMine = useCallback(async () => {
    if (!isStudent) return;
    setMineLoading(true);
    try {
      const res = await fetchMyReferralSeeks();
      if (res.success) setMine(res.data || []);
      else setMine([]);
    } catch (e) {
      toastApiError(e, "Could not load your referral requests.");
      setMine([]);
    } finally {
      setMineLoading(false);
    }
  }, [isStudent]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const startEdit = (row) => {
    setEditingId(row._id);
    setForm({
      title: row.title || "",
      summary: row.summary || "",
      seekType: row.seekType || "internship",
      targetRoles: (row.targetRoles || []).join(", "),
      targetCompanies: (row.targetCompanies || []).join(", "),
      skills: (row.skills || []).join(", "),
      linkUrl: row.linkUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      summary: "",
      seekType: "internship",
      targetRoles: "",
      targetCompanies: "",
      skills: "",
      linkUrl: "",
    });
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      seekType: form.seekType,
      targetRoles: parseList(form.targetRoles),
      targetCompanies: parseList(form.targetCompanies),
      skills: parseList(form.skills),
      linkUrl: form.linkUrl.trim(),
    };
    try {
      if (editingId) {
        const res = await updateReferralSeek(editingId, payload);
        if (res.success) {
          toast.success("Updated.");
          resetForm();
          loadMine();
        }
      } else {
        const res = await createReferralSeek(payload);
        if (res.success) {
          toast.success("Posted — alumni can see it on the board.");
          resetForm();
          loadMine();
        }
      }
    } catch (err) {
      toastApiError(err, editingId ? "Could not update." : "Could not post.");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id, status) => {
    try {
      const res = await updateReferralSeek(id, { status });
      if (res.success) {
        toast.success("Status updated.");
        loadMine();
      }
    } catch (err) {
      toastApiError(err, "Could not update status.");
    }
  };

  const removeSeek = async (id) => {
    if (!window.confirm("Remove this referral request?")) return;
    try {
      const res = await deleteReferralSeekApi(id);
      if (res.success) {
        toast.success("Removed.");
        if (editingId === id) resetForm();
        loadMine();
      }
    } catch (err) {
      toastApiError(err, "Could not remove.");
    }
  };

  const BoardCard = ({ row }) => {
    const stu = row.studentId;
    if (!stu) return null;
    const peer = {
      _id: stu._id,
      name: stu.name,
      profilePicture: stu.profilePicture,
    };
    const copyPitch = () => {
      const text = `${row.title}\n\n${row.summary}`;
      navigator.clipboard
        .writeText(text)
        .then(() => toast.success("Copied headline & details"))
        .catch(() => toast.error("Could not copy"));
    };
    return (
      <article className="apple-glass-card overflow-hidden transition hover:shadow-lg">
        <div className="border-b border-black/[0.06] bg-[#f5f5f7]/50 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-nitj-navy text-[15px] font-semibold text-white">
                {stu.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-nitj-navy">{stu.name}</p>
                <p className="text-[13px] text-neutral-500">
                  {stu.branch || "Student"}
                  {stu.year != null && ` · Year ${stu.year}`}
                </p>
                {stu.headline ? (
                  <p className="mt-0.5 truncate text-[12px] text-neutral-600">{stu.headline}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-nitj-link/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-nitj-link">
                {SEEK_LABELS[row.seekType] || row.seekType}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  row.status === "open"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {STATUS_LABELS[row.status] || row.status}
              </span>
            </div>
          </div>
        </div>
        <div className="px-5 py-4">
          <h3 className="text-[17px] font-semibold tracking-tight text-nitj-navy">{row.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-600">
            {row.summary}
          </p>
          {(row.targetRoles?.length > 0 || row.targetCompanies?.length > 0 || row.skills?.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[...(row.targetRoles || []), ...(row.targetCompanies || []), ...(row.skills || [])].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-nitj-navy ring-1 ring-black/[0.06]"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          )}
          {row.linkUrl ? (
            <a
              href={row.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-[14px] font-medium text-nitj-link hover:underline"
            >
              Portfolio / resume link
            </a>
          ) : null}
          <p className="mt-3 text-[12px] text-neutral-400">
            Posted {new Date(row.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyPitch}
              className="rounded-full border border-black/[0.1] bg-white px-4 py-2.5 text-[14px] font-medium text-nitj-navy shadow-sm transition hover:bg-[#f5f5f7]"
            >
              Copy pitch
            </button>
            {isAlumni && row.status === "open" && (
              <button
                type="button"
                onClick={() => openMessagesWithUser(peer)}
                className="rounded-full bg-nitj-navy px-5 py-2.5 text-[14px] font-medium text-white shadow-sm transition hover:bg-nitj-navy-light"
              >
                Message {stu.name?.split(" ")[0] || "student"}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

  const openOnBoard = board.filter((r) => r.status === "open").length;

  return (
    <div className="dashboard-apple-bg min-h-screen font-sans">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:max-w-6xl">
        <header className="auth-hero-apple relative mb-8 overflow-hidden rounded-[28px] p-8 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#2997ff]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-white/[0.08] blur-2xl" />
          <div className="relative max-w-3xl">
            <p className="text-[13px] font-medium text-white/65">MentorBridge · Referrals</p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight sm:text-[34px]">Referral board</h1>
            <p className="mt-3 text-[16px] leading-relaxed text-white/75">
              {isStudent &&
                "Post what you need—internships, full-time intros, or research connections. Alumni browse open asks in one place."}
              {showBoard &&
                "Scan student asks, filter by branch or role type, copy a pitch in one tap, then follow up in Messages."}
            </p>
          </div>
        </header>

        {showBoard && !boardLoading && (
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="apple-glass-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Open asks</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-nitj-navy">{openOnBoard}</p>
            </div>
            <div className="apple-glass-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Matching filter</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-nitj-navy">{board.length}</p>
            </div>
            <div className="apple-glass-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Status filter</p>
              <p className="mt-1 text-lg font-semibold capitalize text-nitj-navy">
                {statusFilter === "all" ? "All statuses" : STATUS_LABELS[statusFilter] || statusFilter}
              </p>
            </div>
          </div>
        )}

        {isStudent && (
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-nitj-link/15 bg-nitj-link/[0.06] p-4">
              <p className="text-[12px] font-semibold text-nitj-link">Be specific</p>
              <p className="mt-1 text-[13px] text-neutral-700">Roles, skills, and timeline help alumni respond faster.</p>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7]/80 p-4">
              <p className="text-[12px] font-semibold text-nitj-navy">Add a link</p>
              <p className="mt-1 text-[13px] text-neutral-700">Portfolio or resume links improve credibility.</p>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7]/80 p-4">
              <p className="text-[12px] font-semibold text-nitj-navy">Update status</p>
              <p className="mt-1 text-[13px] text-neutral-700">Mark filled or closed when you’re done so mentors aren’t guessing.</p>
            </div>
          </div>
        )}

        {isStudent && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-[20px] font-semibold text-nitj-navy">
                {editingId ? "Edit request" : "New referral request"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[14px] font-medium text-nitj-link hover:underline"
                >
                  Cancel edit
                </button>
              )}
            </div>
            <form onSubmit={submitForm} className="apple-glass-card space-y-4 p-5 sm:p-6">
              <div>
                <label className="block text-[13px] font-medium text-neutral-600">Headline</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Seeking summer internship referral in VLSI / RTL"
                  className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white/90 px-4 py-3 text-[15px] text-nitj-navy outline-none ring-nitj-link/0 transition focus:ring-2 focus:ring-nitj-link/25"
                  maxLength={140}
                  required
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-neutral-600">Details</label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  placeholder="Your background, target teams, timeline, and how alumni can help."
                  rows={5}
                  className="mt-1.5 w-full resize-y rounded-xl border border-black/[0.08] bg-white/90 px-4 py-3 text-[15px] text-nitj-navy outline-none ring-nitj-link/0 transition focus:ring-2 focus:ring-nitj-link/25"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-medium text-neutral-600">Type</label>
                  <select
                    value={form.seekType}
                    onChange={(e) => setForm((f) => ({ ...f, seekType: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white/90 px-4 py-3 text-[15px] text-nitj-navy outline-none"
                  >
                    {Object.entries(SEEK_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-neutral-600">
                    Portfolio or resume link (optional)
                  </label>
                  <input
                    value={form.linkUrl}
                    onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                    placeholder="https://…"
                    className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white/90 px-4 py-3 text-[15px] text-nitj-navy outline-none focus:ring-2 focus:ring-nitj-link/25"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-neutral-600">
                  Target roles (comma-separated)
                </label>
                <input
                  value={form.targetRoles}
                  onChange={(e) => setForm((f) => ({ ...f, targetRoles: e.target.value }))}
                  placeholder="e.g. Design verification, Embedded systems"
                  className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white/90 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-nitj-link/25"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-neutral-600">
                  Dream companies (optional)
                </label>
                <input
                  value={form.targetCompanies}
                  onChange={(e) => setForm((f) => ({ ...f, targetCompanies: e.target.value }))}
                  placeholder="e.g. AMD, Texas Instruments"
                  className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white/90 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-nitj-link/25"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-neutral-600">
                  Relevant skills
                </label>
                <input
                  value={form.skills}
                  onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                  placeholder="e.g. Verilog, Python, PCB design"
                  className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white/90 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-nitj-link/25"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-nitj-navy px-8 py-3 text-[15px] font-medium text-white shadow-sm transition hover:bg-nitj-navy-light disabled:opacity-50"
              >
                {saving ? "Saving…" : editingId ? "Save changes" : "Post to referral board"}
              </button>
            </form>

            <h2 className="mb-4 mt-10 text-[20px] font-semibold text-nitj-navy">Your requests</h2>
            {mineLoading ? (
              <p className="text-neutral-500">Loading…</p>
            ) : mine.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-black/[0.1] bg-white/50 px-4 py-10 text-center text-[15px] text-neutral-500">
                You haven’t posted yet. Alumni only see requests you publish here.
              </p>
            ) : (
              <ul className="space-y-3">
                {mine.map((row) => (
                  <li key={row._id} className="apple-glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-nitj-navy">{row.title}</p>
                      <p className="text-[13px] text-neutral-500">
                        {SEEK_LABELS[row.seekType]} · {STATUS_LABELS[row.status] || row.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {row.status === "open" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setStatus(row._id, "filled")}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[13px] font-medium text-emerald-800"
                          >
                            Mark filled
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatus(row._id, "closed")}
                            className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-[13px] font-medium text-nitj-navy"
                          >
                            Close
                          </button>
                        </>
                      )}
                      {row.status !== "open" && (
                        <button
                          type="button"
                          onClick={() => setStatus(row._id, "open")}
                          className="rounded-full border border-nitj-link/30 bg-nitj-link/5 px-3 py-1.5 text-[13px] font-medium text-nitj-link"
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-[13px] font-medium text-nitj-navy"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSeek(row._id)}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[13px] font-medium text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {showBoard && (
          <section>
            <h2 className="mb-4 text-[20px] font-semibold text-nitj-navy">Open requests from students</h2>
            <div className="apple-glass-card mb-6 space-y-3 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search words in posts…"
                  className="rounded-xl border border-black/[0.08] bg-white/90 px-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-nitj-link/25 lg:col-span-2"
                />
                <input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Filter by branch (e.g. ECE)"
                  className="rounded-xl border border-black/[0.08] bg-white/90 px-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-nitj-link/25"
                />
                <select
                  value={seekType}
                  onChange={(e) => setSeekType(e.target.value)}
                  className="rounded-xl border border-black/[0.08] bg-white/90 px-4 py-2.5 text-[14px] outline-none"
                >
                  <option value="">All types</option>
                  {Object.entries(SEEK_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[13px] font-medium text-neutral-500">Status</span>
                {["open", "filled", "closed", "all"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                      statusFilter === s
                        ? "bg-nitj-navy text-white"
                        : "bg-[#f5f5f7] text-nitj-navy ring-1 ring-black/[0.06]"
                    }`}
                  >
                    {s === "all" ? "All" : STATUS_LABELS[s]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => loadBoard()}
                  className="ml-auto rounded-full border border-black/[0.1] bg-white px-4 py-1.5 text-[13px] font-medium text-nitj-navy"
                >
                  Refresh
                </button>
              </div>
            </div>

            {boardLoading ? (
              <p className="text-neutral-500">Loading…</p>
            ) : board.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-black/[0.1] bg-white/50 px-4 py-12 text-center text-[15px] text-neutral-500">
                No requests match these filters.
              </p>
            ) : (
              <div className="space-y-5">
                {board.map((row) => (
                  <BoardCard key={row._id} row={row} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ReferralsPage;
