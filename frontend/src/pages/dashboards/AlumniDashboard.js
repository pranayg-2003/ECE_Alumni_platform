import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import Navbar from "../../components/layout/Navbar";
import api from "../../utils/api";
import { toastApiError } from "../../utils/toast";

const StatPill = ({ label, value }) => (
  <div className="apple-glass-card px-5 py-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">{label}</p>
    <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-[#1d1d1f]">{value}</p>
  </div>
);

const RequestCard = ({
  request,
  onAccept,
  onReject,
  loading,
  onOpenMessages,
}) => {
  const student = request.studentId;
  const status = request.status;

  return (
    <article className="apple-glass-card group overflow-hidden transition hover:shadow-lg">
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1d1d1f] text-lg font-semibold text-white shadow-md">
          {student?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-[#1d1d1f]">{student?.name}</h3>
              <p className="text-sm text-neutral-500">
                {student?.branch}
                {student?.year != null && ` · Year ${student.year}`}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                status === "pending"
                  ? "bg-amber-100 text-amber-800"
                  : status === "accepted"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {status}
            </span>
          </div>

          {request.message ? (
            <blockquote className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm italic text-slate-700">
              “{request.message}”
            </blockquote>
          ) : null}

          <p className="mt-3 text-xs text-slate-400">
            Requested {new Date(request.createdAt).toLocaleString()}
          </p>

          {status === "pending" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onAccept(request._id)}
                disabled={loading}
                className="rounded-full bg-[#34c759] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {loading === "accept" ? "Accepting…" : "Accept mentee"}
              </button>
              <button
                type="button"
                onClick={() => onReject(request._id)}
                disabled={loading}
                className="rounded-full border border-black/[0.12] bg-white px-5 py-2.5 text-sm font-medium text-[#1d1d1f] transition hover:bg-[#f5f5f7] disabled:opacity-50"
              >
                {loading === "reject" ? "…" : "Decline"}
              </button>
            </div>
          )}

          {status === "accepted" && (
            <button
              type="button"
              onClick={onOpenMessages}
              className="mt-4 rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0077ed]"
            >
              Open messages
            </button>
          )}

          {status === "rejected" && (
            <p className="mt-4 text-sm font-medium text-slate-400">Declined</p>
          )}
        </div>
      </div>
    </article>
  );
};

const AlumniDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openMessagesPanel } = useChat();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(null);
  const [fetchingRequests, setFetchingRequests] = useState(true);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/users/incoming-requests");
      setRequests(res.data.data || []);
    } catch (err) {
      toastApiError(err, "Could not load requests.");
    } finally {
      setFetchingRequests(false);
    }
  };

  const handleAccept = async (id) => {
    setLoading("accept");
    try {
      await api.put(`/users/respond-request/${id}`, { status: "accepted" });
      fetchRequests();
    } catch (err) {
      toastApiError(err, "Could not accept request.");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (id) => {
    setLoading("reject");
    try {
      await api.put(`/users/respond-request/${id}`, { status: "rejected" });
      fetchRequests();
    } catch (err) {
      toastApiError(err, "Could not decline request.");
    } finally {
      setLoading(null);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const accepted = requests.filter((r) => r.status === "accepted");
  const rejected = requests.filter((r) => r.status === "rejected");

  return (
    <div className="dashboard-apple-bg font-apple min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="auth-hero-apple relative overflow-hidden rounded-[28px] p-8 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#2997ff]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-white/[0.06] blur-2xl" />
          <div className="relative">
            <p className="text-[13px] font-medium text-white/60">Mentee program</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-[34px]">
              Welcome back, {user?.name?.split(" ")[0] || "Mentor"}
            </h1>
            <p className="mt-2 max-w-xl text-[16px] text-white/55">
              {user?.jobTitle && `${user.jobTitle} · `}
              {user?.company || "Review requests and support your mentees."}
            </p>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <button
            type="button"
            onClick={() => navigate("/feed")}
            className="apple-glass-card p-4 text-left transition hover:shadow-lg"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0071e3]">Feed</p>
            <p className="mt-1 font-semibold text-[#1d1d1f]">Professional updates</p>
            <p className="mt-1 text-[12px] text-neutral-500">Share wins in the community</p>
          </button>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="apple-glass-card p-4 text-left transition hover:shadow-lg"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0071e3]">Profile</p>
            <p className="mt-1 font-semibold text-[#1d1d1f]">Presence &amp; story</p>
            <p className="mt-1 text-[12px] text-neutral-500">Headline, links, achievements</p>
          </button>
          <button
            type="button"
            onClick={() => openMessagesPanel()}
            className="apple-glass-card p-4 text-left transition hover:shadow-lg"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0071e3]">Inbox</p>
            <p className="mt-1 font-semibold text-[#1d1d1f]">Mentee messages</p>
            <p className="mt-1 text-[12px] text-neutral-500">Reply from anywhere</p>
          </button>
          <button
            type="button"
            onClick={() => navigate("/initiatives")}
            className="apple-glass-card p-4 text-left transition hover:shadow-lg"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0071e3]">Host</p>
            <p className="mt-1 font-semibold text-[#1d1d1f]">Funding &amp; Meet events</p>
            <p className="mt-1 text-[12px] text-neutral-500">College drives &amp; Google Meet</p>
          </button>
          <button
            type="button"
            onClick={() => navigate("/referrals")}
            className="apple-glass-card p-4 text-left transition hover:shadow-lg"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0071e3]">Referrals</p>
            <p className="mt-1 font-semibold text-[#1d1d1f]">Student asks</p>
            <p className="mt-1 text-[12px] text-neutral-500">One board for internship &amp; job intros</p>
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatPill label="Pending" value={pending.length} />
          <StatPill label="Active mentees" value={accepted.length} />
          <StatPill label="Total requests" value={requests.length} />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              <div className="apple-glass-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1d1d1f] text-lg font-semibold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#1d1d1f]">
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-neutral-500">Alumni mentor</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 border-t border-black/[0.06] pt-4 text-sm text-neutral-600">
                  {user?.company && (
                    <p>
                      <span className="font-medium text-[#1d1d1f]">Company</span>
                      <br />
                      {user.company}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-black/[0.06] bg-[#f5f5f7]/80 p-5">
                <h3 className="font-semibold text-[#1d1d1f]">Mentor tips</h3>
                <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                  <li>· Respond to pending requests within a few days.</li>
                  <li>· Use messages to agree on goals and cadence.</li>
                  <li>· Decline gently if the fit isn’t right.</li>
                </ul>
              </div>
            </div>
          </aside>

          <main className="space-y-10 lg:col-span-6">
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-[#1d1d1f]">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5f7] text-[13px] font-bold text-[#0071e3] ring-1 ring-black/[0.06]">
                  ●
                </span>
                Pending requests
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold text-slate-600">
                  {pending.length}
                </span>
              </h2>
              {fetchingRequests ? (
                <div className="flex justify-center py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent" />
                </div>
              ) : pending.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-black/[0.1] bg-white/60 py-14 text-center text-neutral-500">
                  <p className="text-lg font-medium text-[#1d1d1f]">
                    You’re all caught up
                  </p>
                  <p className="mt-1 text-sm">No pending mentorship requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pending.map((req) => (
                    <RequestCard
                      key={req._id}
                      request={req}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      loading={loading}
                      onOpenMessages={openMessagesPanel}
                    />
                  ))}
                </div>
              )}
            </section>

            {accepted.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-[#1d1d1f]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#34c759]/15 text-sm font-bold text-[#248a3d]">
                    ✓
                  </span>
                  Your mentees
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold text-slate-600">
                    {accepted.length}
                  </span>
                </h2>
                <div className="space-y-4">
                  {accepted.map((req) => (
                    <RequestCard
                      key={req._id}
                      request={req}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      loading={loading}
                      onOpenMessages={openMessagesPanel}
                    />
                  ))}
                </div>
              </section>
            )}

            {rejected.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Past declined ({rejected.length})
                </h2>
                <div className="space-y-3 opacity-80">
                  {rejected.map((req) => (
                    <RequestCard
                      key={req._id}
                      request={req}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      loading={loading}
                      onOpenMessages={openMessagesPanel}
                    />
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="lg:col-span-3">
            <div className="apple-glass-card sticky top-24 p-5">
              <h3 className="font-semibold text-[#1d1d1f]">At a glance</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Pending</dt>
                  <dd className="font-semibold text-[#1d1d1f]">{pending.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Mentees</dt>
                  <dd className="font-semibold text-[#1d1d1f]">{accepted.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Declined</dt>
                  <dd className="font-semibold text-[#1d1d1f]">{rejected.length}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AlumniDashboard;
