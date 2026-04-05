// // src/pages/dashboards/StudentDashboard.js
// // Modern student dashboard - send requests and manage mentorship

// import React, { useEffect, useState } from "react";
// import { useAuth } from "../../context/AuthContext";
// import Navbar from "../../components/layout/Navbar";
// import api from "../../utils/api";

// const StatCard = ({ icon, label, value, gradient }) => (
//   <div
//     className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg`}
//   >
//     <div className="flex items-center justify-between">
//       <div>
//         <p className="text-sm font-semibold opacity-90">{label}</p>
//         <p className="text-4xl font-bold mt-2">{value}</p>
//       </div>
//       <div className="text-5xl opacity-20">{icon}</div>
//     </div>
//   </div>
// );

// // Alumni card with request status
// const AlumniCard = ({ alumni, requestStatus, onSendRequest, loading }) => {
//   const isRequested =
//     requestStatus === "pending" || requestStatus === "accepted";

//   return (
//     <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
//       <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
//         <div className="absolute -bottom-8 left-4">
//           <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white">
//             {alumni.name.charAt(0).toUpperCase()}
//           </div>
//         </div>
//       </div>

//       <div className="pt-12 px-4 pb-4">
//         <h3 className="font-bold text-gray-800 text-lg">{alumni.name}</h3>
//         <p className="text-sm text-indigo-600 font-semibold mt-1">
//           💼 {alumni.company}
//         </p>
//         <p className="text-xs text-gray-500 mt-1">{alumni.jobTitle}</p>

//         <div className="flex flex-wrap gap-2 mt-4">
//           {alumni.skills?.slice(0, 3).map((skill) => (
//             <span
//               key={skill}
//               className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold"
//             >
//               {skill}
//             </span>
//           ))}
//           {alumni.skills?.length > 3 && (
//             <span className="text-xs text-gray-500">
//               +{alumni.skills.length - 3} more
//             </span>
//           )}
//         </div>

//         {alumni.bio && (
//           <p className="text-xs text-gray-600 mt-3 line-clamp-2">
//             {alumni.bio}
//           </p>
//         )}

//         {requestStatus === "accepted" ? (
//           <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-all">
//             ✅ Connected! (Chat under Messages)
//           </button>
//         ) : requestStatus === "pending" ? (
//           <button
//             disabled
//             className="w-full mt-4 bg-yellow-500 text-white font-semibold py-2.5 rounded-xl opacity-75 cursor-not-allowed"
//           >
//             ⏳ Request Pending...
//           </button>
//         ) : (
//           <button
//             onClick={() => onSendRequest(alumni)}
//             disabled={loading}
//             className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50"
//           >
//             {loading ? "Sending..." : "➕ Send Request"}
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// const StudentDashboard = () => {
//   const { user } = useAuth();
//   const [alumni, setAlumni] = useState([]);
//   const [requests, setRequests] = useState([]);
//   const [loadingAlumni, setLoadingAlumni] = useState(true);
//   const [sendingRequest, setSendingRequest] = useState(null);

//   useEffect(() => {
//     fetchAlumni();
//     fetchRequests();
//   }, []);

//   const fetchAlumni = async () => {
//     try {
//       const res = await api.get("/users/alumni");
//       setAlumni(res.data.data);
//     } catch (err) {
//       console.error("Failed to fetch alumni:", err);
//     } finally {
//       setLoadingAlumni(false);
//     }
//   };

//   const fetchRequests = async () => {
//     try {
//       const res = await api.get("/users/my-requests");
//       setRequests(res.data.data);
//     } catch (err) {
//       console.error("Failed to fetch requests:", err);
//     }
//   };

//   const getRequestStatus = (alumniId) => {
//     const request = requests.find((r) => r.alumniId === alumniId);
//     return request ? request.status : null;
//   };

//   const handleSendRequest = async (alumnus) => {
//     setSendingRequest(alumnus._id);
//     try {
//       const res = await api.post("/users/send-request", {
//         alumniId: alumnus._id,
//         message: `Hi ${alumnus.name}, I'd like to connect with you for mentorship!`,
//       });

//       if (res.data.success) {
//         alert(`Request sent to ${alumnus.name}! 🎉`);
//         fetchRequests();
//       }
//     } catch (err) {
//       alert("Failed to send request");
//       console.error(err);
//     } finally {
//       setSendingRequest(null);
//     }
//   };

//   const acceptedCount = requests.filter((r) => r.status === "accepted").length;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
//       <Navbar />

//       <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
//         <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-10 text-white shadow-xl">
//           <div className="relative z-10">
//             <h1 className="text-4xl font-bold mb-2">
//               Welcome, {user?.name}! 👋
//             </h1>
//             <p className="text-blue-100 text-base">
//               🚀 {user?.branch || "Computer Science"} • Year {user?.year || "1"}
//             </p>
//           </div>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <StatCard
//             icon="📊"
//             label="Connected Mentors"
//             value={acceptedCount}
//             gradient="from-green-500 to-emerald-600"
//           />
//           <StatCard
//             icon="⏳"
//             label="Pending Requests"
//             value={requests.filter((r) => r.status === "pending").length}
//             gradient="from-yellow-500 to-orange-600"
//           />
//           <StatCard
//             icon="⭐"
//             label="Total Alumni"
//             value={alumni.length}
//             gradient="from-blue-500 to-indigo-600"
//           />
//         </div>

//         {/* Alumni Grid */}
//         <div>
//           <h2 className="text-3xl font-bold text-gray-800 mb-6">
//             🎓 Explore Alumni
//           </h2>
//           {loadingAlumni ? (
//             <div className="text-center py-12">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {alumni.map((alumnus) => (
//                 <AlumniCard
//                   key={alumnus._id}
//                   alumni={alumnus}
//                   requestStatus={getRequestStatus(alumnus._id)}
//                   onSendRequest={handleSendRequest}
//                   loading={sendingRequest === alumnus._id}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StudentDashboard;
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

/* ================= ALUMNI CARD ================= */
const AlumniCard = ({ alumni, requestStatus, onSendRequest, loading }) => {
  const statusAction = () => {
    if (requestStatus === "accepted") {
      return (
        <button
          type="button"
          className="mt-4 rounded-full bg-[#34c759] px-5 py-2 text-[13px] font-medium text-white"
        >
          Accepted
        </button>
      );
    }
    if (requestStatus === "pending") {
      return (
        <button
          type="button"
          disabled
          className="mt-4 rounded-full bg-[#fff8e6] px-5 py-2 text-[13px] font-medium text-[#b45309] ring-1 ring-[#fcd34d]/80"
        >
          Sent
        </button>
      );
    }
    if (requestStatus === "rejected" || requestStatus === "cancelled") {
      return (
        <button type="button" disabled className="mt-4 rounded-full bg-[#f5f5f7] px-5 py-2 text-[13px] font-medium text-neutral-400">
          {requestStatus === "rejected" ? "Declined" : "Cancelled"}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onSendRequest(alumni)}
        disabled={loading}
        className="mt-4 rounded-full border border-[#0071e3] px-5 py-2 text-[13px] font-medium text-[#0071e3] transition hover:bg-[#0071e3]/8 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Connect"}
      </button>
    );
  };

  const subline = [alumni.jobTitle, alumni.company].filter(Boolean).join(" · ") || "Alumni";

  return (
    <article className="apple-glass-card group overflow-hidden transition hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
      <div className="h-2 bg-gradient-to-r from-[#1d1d1f] via-[#2d2d2f] to-[#0071e3]" aria-hidden />
      <div className="px-5 pb-5 pt-5">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-[#1d1d1f] text-lg font-semibold text-white shadow-md">
            {alumni.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-lg font-semibold leading-snug text-[#1d1d1f]">{alumni.name}</h3>
            <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-neutral-600">{subline}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {alumni.skills?.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-medium text-[#1d1d1f] ring-1 ring-black/[0.06]"
            >
              {skill}
            </span>
          ))}
        </div>
        {alumni.bio && (
          <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-neutral-600">{alumni.bio}</p>
        )}
        {statusAction()}
      </div>
    </article>
  );
};

/* ================= MAIN DASHBOARD ================= */
const StudentDashboard = () => {
  const navigate = useNavigate();
  const { openMessagesPanel } = useChat();
  const { user } = useAuth();

  const [alumni, setAlumni] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingAlumni, setLoadingAlumni] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(null);

  useEffect(() => {
    fetchAlumni();
    fetchRequests();
  }, []);

  const fetchAlumni = async () => {
    try {
      const res = await api.get("/users/alumni");
      setAlumni(res.data.data);
    } catch (err) {
      toastApiError(err, "Could not load alumni.");
    } finally {
      setLoadingAlumni(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get("/users/my-requests");
      setRequests(res.data.data);
    } catch (err) {
      toastApiError(err, "Could not load your requests.");
    }
  };

  const getRequestStatus = (alumniId) => {
    const idStr = String(alumniId);
    const req = requests.find((r) => {
      const aid = r.alumniId?._id ?? r.alumniId;
      return String(aid) === idStr;
    });
    return req ? req.status : null;
  };

  const handleSendRequest = async (alumnus) => {
    setSendingRequest(alumnus._id);
    try {
      await api.post("/users/send-request", {
        alumniId: alumnus._id,
        message: `Hi ${alumnus.name}, I'd like to connect with you!`,
      });
      fetchRequests();
    } catch (err) {
      toastApiError(err, "Could not send request.");
    } finally {
      setSendingRequest(null);
    }
  };

  const acceptedCount = requests.filter((r) => r.status === "accepted").length;
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const actionCard =
    "apple-glass-card min-h-[128px] rounded-[20px] p-6 text-left transition hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] active:scale-[0.99]";

  return (
    <div className="dashboard-apple-bg font-apple min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="auth-hero-apple relative overflow-hidden rounded-[28px] p-8 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#2997ff]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-white/[0.06] blur-2xl" />
          <div className="relative">
            <p className="text-[13px] font-medium text-white/60">Mentor network</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-[34px]">
              Welcome, {user?.name?.split(" ")[0] || "Student"}
            </h1>
            <p className="mt-2 max-w-xl text-[16px] text-white/70">
              {user?.branch ? `${user.branch}` : "Your program"}
              {user?.year != null ? ` · Year ${user.year}` : ""}
              {" · "}
              Discover alumni and send mentorship requests.
            </p>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatPill label="Connected mentors" value={acceptedCount} />
          <StatPill label="Requests pending" value={pendingCount} />
          <StatPill label="Alumni on platform" value={alumni.length} />
        </div>

        <h2 className="mt-10 text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Shortcuts</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button type="button" onClick={() => navigate("/feed")} className={actionCard}>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#0071e3]">Feed</p>
            <p className="mt-2 text-[18px] font-semibold text-[#1d1d1f]">Community</p>
            <p className="mt-1.5 text-[14px] leading-snug text-neutral-600">Posts, updates, and discussions</p>
          </button>
          <button
            type="button"
            onClick={() => document.querySelector('input[placeholder="Search alumni…"]')?.focus()}
            className={actionCard}
          >
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#0071e3]">Discover</p>
            <p className="mt-2 text-[18px] font-semibold text-[#1d1d1f]">Search mentors</p>
            <p className="mt-1.5 text-[14px] leading-snug text-neutral-600">Use the search bar in the header</p>
          </button>
          <button type="button" onClick={() => openMessagesPanel()} className={actionCard}>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#0071e3]">Inbox</p>
            <p className="mt-2 text-[18px] font-semibold text-[#1d1d1f]">Messages</p>
            <p className="mt-1.5 text-[14px] leading-snug text-neutral-600">Chat after a mentor accepts</p>
          </button>
          <button type="button" onClick={() => navigate("/profile")} className={actionCard}>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#0071e3]">Profile</p>
            <p className="mt-2 text-[18px] font-semibold text-[#1d1d1f]">Your story</p>
            <p className="mt-1.5 text-[14px] leading-snug text-neutral-600">Headline, branch, skills, links</p>
          </button>
          <button type="button" onClick={() => navigate("/initiatives")} className={actionCard}>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#0071e3]">Initiatives</p>
            <p className="mt-2 text-[18px] font-semibold text-[#1d1d1f]">Funding &amp; events</p>
            <p className="mt-1.5 text-[14px] leading-snug text-neutral-600">Support drives and Meet sessions</p>
          </button>
          <button type="button" onClick={() => navigate("/referrals")} className={actionCard}>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#0071e3]">Referrals</p>
            <p className="mt-2 text-[18px] font-semibold text-[#1d1d1f]">Seek intros</p>
            <p className="mt-1.5 text-[14px] leading-snug text-neutral-600">Post what you need; alumni browse</p>
          </button>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-[22px] font-semibold tracking-tight text-[#1d1d1f] sm:text-[24px]">
            Explore alumni
            <span className="ml-2 text-[17px] font-medium text-neutral-500">({alumni.length})</span>
          </h2>
          <Link
            to="/feed"
            className="text-[14px] font-semibold text-[#0071e3] underline-offset-4 hover:underline"
          >
            Back to feed
          </Link>
        </div>

        {loadingAlumni ? (
          <p className="mt-6 text-[16px] text-neutral-500">Loading alumni…</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {alumni.map((alumnus) => (
              <AlumniCard
                key={alumnus._id}
                alumni={alumnus}
                requestStatus={getRequestStatus(alumnus._id)}
                onSendRequest={handleSendRequest}
                loading={sendingRequest === alumnus._id}
              />
            ))}
          </div>
        )}

        <div className="apple-glass-card mt-10 rounded-[24px] p-6">
          <div className="h-1 w-10 rounded-full bg-[#0071e3]" />
          <h3 className="mt-4 text-[18px] font-semibold text-[#1d1d1f]">Tips</h3>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-neutral-600">
            Connect with alumni who align with your goals. Personalize your request message when you reach out — it
            improves response rates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
