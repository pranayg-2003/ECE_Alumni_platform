import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import Navbar from "../../components/layout/Navbar";
import api from "../../utils/api";
import { toastApiError } from "../../utils/toast";

const StatPill = ({ label, value, tone }) => {
  const tones = {
    amber: "from-amber-500 to-orange-500 shadow-amber-500/25",
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
    indigo: "from-indigo-500 to-violet-600 shadow-indigo-500/25",
  };
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${tones[tone]} px-5 py-4 text-white shadow-lg`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
};

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
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/40">
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-md">
          {student?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{student?.name}</h3>
              <p className="text-sm text-slate-500">
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
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
              >
                {loading === "accept" ? "Accepting…" : "Accept mentee"}
              </button>
              <button
                type="button"
                onClick={() => onReject(request._id)}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {loading === "reject" ? "…" : "Decline"}
              </button>
            </div>
          )}

          {status === "accepted" && (
            <button
              type="button"
              onClick={onOpenMessages}
              className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
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
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-indigo-50/30">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-xl shadow-indigo-500/20 md:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-2xl" />
          <div className="relative">
            <p className="text-sm font-semibold text-indigo-100">
              Mentee program
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              Welcome back, {user?.name?.split(" ")[0] || "Mentor"}
            </h1>
            <p className="mt-2 max-w-xl text-indigo-100">
              {user?.jobTitle && `${user.jobTitle} · `}
              {user?.company || "Review requests and support your mentees."}
            </p>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate("/feed")}
            className="rounded-2xl border border-indigo-100 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300"
          >
            <p className="text-xs font-bold uppercase text-indigo-600">Alumni</p>
            <p className="mt-1 font-semibold text-slate-900">Professional feed</p>
            <p className="mt-1 text-xs text-slate-500">Share wins &amp; mentor in public</p>
          </button>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="rounded-2xl border border-fuchsia-100 bg-white p-4 text-left shadow-sm transition hover:border-fuchsia-300"
          >
            <p className="text-xs font-bold uppercase text-fuchsia-600">Presence</p>
            <p className="mt-1 font-semibold text-slate-900">Profile &amp; banner</p>
            <p className="mt-1 text-xs text-slate-500">Headline, company &amp; story</p>
          </button>
          <button
            type="button"
            onClick={() => openMessagesPanel()}
            className="rounded-2xl border border-emerald-100 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300"
          >
            <p className="text-xs font-bold uppercase text-emerald-600">Inbox</p>
            <p className="mt-1 font-semibold text-slate-900">Mentee messages</p>
            <p className="mt-1 text-xs text-slate-500">Reply without leaving the page</p>
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatPill label="Pending" value={pending.length} tone="amber" />
          <StatPill label="Active mentees" value={accepted.length} tone="emerald" />
          <StatPill label="Total requests" value={requests.length} tone="indigo" />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-lg font-bold text-indigo-700">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">Alumni mentor</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  {user?.company && (
                    <p>
                      <span className="font-medium text-slate-800">Company</span>
                      <br />
                      {user.company}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                <h3 className="font-semibold text-indigo-900">Mentor tips</h3>
                <ul className="mt-3 space-y-2 text-sm text-indigo-900/80">
                  <li>· Respond to pending requests within a few days.</li>
                  <li>· Use messages to agree on goals and cadence.</li>
                  <li>· Decline gently if the fit isn’t right.</li>
                </ul>
              </div>
            </div>
          </aside>

          <main className="space-y-10 lg:col-span-6">
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  📬
                </span>
                Pending requests
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold text-slate-600">
                  {pending.length}
                </span>
              </h2>
              {fetchingRequests ? (
                <div className="flex justify-center py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                </div>
              ) : pending.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-14 text-center text-slate-500">
                  <p className="text-lg font-medium text-slate-700">
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
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
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
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">At a glance</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Pending</dt>
                  <dd className="font-semibold text-slate-900">{pending.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Mentees</dt>
                  <dd className="font-semibold text-slate-900">{accepted.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Declined</dt>
                  <dd className="font-semibold text-slate-900">{rejected.length}</dd>
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
