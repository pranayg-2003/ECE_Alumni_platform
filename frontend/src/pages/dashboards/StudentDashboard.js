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
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/layout/Navbar";
import api from "../../utils/api";
import { toastApiError } from "../../utils/toast";

/* ================= SIDEBAR ================= */
const Sidebar = ({ user }) => (
  <div className="apple-glass-card p-5">
    <div className="text-center">
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#1d1d1f] text-lg font-semibold text-white">
        {user?.name?.charAt(0)?.toUpperCase() || "S"}
      </div>
      <h2 className="text-[16px] font-semibold text-[#1d1d1f]">{user?.name}</h2>
      <p className="mt-1 text-[13px] text-neutral-500">
        {user?.branch} · Year {user?.year}
      </p>
    </div>
    <div className="mt-5 space-y-1 border-t border-black/[0.06] pt-4 text-[14px] text-neutral-600">
      <p className="rounded-xl px-3 py-2 hover:bg-[#f5f5f7]">Community feed</p>
      <p className="rounded-xl px-3 py-2 hover:bg-[#f5f5f7]">Mentor network</p>
      <p className="rounded-xl px-3 py-2 hover:bg-[#f5f5f7]">Messages</p>
    </div>
  </div>
);

/* ================= RIGHT PANEL ================= */
const RightPanel = () => (
  <div className="apple-glass-card p-5">
    <div className="h-0.5 w-8 rounded-full bg-[#0071e3]" />
    <h3 className="mt-4 text-[16px] font-semibold text-[#1d1d1f]">Tips</h3>
    <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
      Connect with alumni who align with your goals and interests.
    </p>
  </div>
);

/* ================= ALUMNI CARD ================= */
const AlumniCard = ({ alumni, requestStatus, onSendRequest, loading }) => {
  return (
    <div className="apple-glass-card p-5 transition hover:shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-[15px] font-semibold text-white">
          {alumni.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-[#1d1d1f]">{alumni.name}</h3>
          <p className="truncate text-[13px] text-neutral-500">{alumni.company}</p>
        </div>
      </div>
      <p className="mt-2 text-[14px] text-neutral-600">{alumni.jobTitle}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {alumni.skills?.slice(0, 4).map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#1d1d1f] ring-1 ring-black/[0.06]"
          >
            {skill}
          </span>
        ))}
      </div>
      {alumni.bio && (
        <p className="mt-3 line-clamp-2 text-[14px] text-neutral-600">{alumni.bio}</p>
      )}
      {requestStatus === "accepted" ? (
        <button
          type="button"
          className="mt-4 rounded-full bg-[#34c759] px-5 py-2 text-[13px] font-medium text-white"
        >
          Connected
        </button>
      ) : requestStatus === "pending" ? (
        <button
          type="button"
          disabled
          className="mt-4 rounded-full bg-[#f5f5f7] px-5 py-2 text-[13px] font-medium text-neutral-400"
        >
          Pending
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onSendRequest(alumni)}
          disabled={loading}
          className="mt-4 rounded-full border border-[#0071e3] px-5 py-2 text-[13px] font-medium text-[#0071e3] transition hover:bg-[#0071e3]/8 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Connect"}
        </button>
      )}
    </div>
  );
};

/* ================= MAIN DASHBOARD ================= */
const StudentDashboard = () => {
  const navigate = useNavigate();
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
    const req = requests.find((r) => r.alumniId === alumniId);
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

  return (
    <div className="dashboard-apple-bg font-apple min-h-screen">
      <Navbar />

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-8">
        {/* LEFT SIDEBAR */}
        <div className="col-span-3">
          <Sidebar user={user} />
        </div>

        {/* MAIN CONTENT */}
        <div className="col-span-6 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <button
              type="button"
              onClick={() => navigate("/feed")}
              className="apple-glass-card p-4 text-left transition hover:shadow-lg"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0071e3]">Feed</p>
              <p className="mt-1 font-semibold text-[#1d1d1f]">Community</p>
              <p className="mt-1 text-[12px] text-neutral-500">Posts and discussions</p>
            </button>
            <button
              type="button"
              onClick={() =>
                document.querySelector('input[placeholder="Search alumni…"]')?.focus()
              }
              className="apple-glass-card p-4 text-left transition hover:shadow-lg"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0071e3]">Discover</p>
              <p className="mt-1 font-semibold text-[#1d1d1f]">Search mentors</p>
              <p className="mt-1 text-[12px] text-neutral-500">Use the header search</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="apple-glass-card p-4 text-left transition hover:shadow-lg"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0071e3]">Connect</p>
              <p className="mt-1 font-semibold text-[#1d1d1f]">Messages</p>
              <p className="mt-1 text-[12px] text-neutral-500">Chat after a match</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/initiatives")}
              className="apple-glass-card p-4 text-left transition hover:shadow-lg"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0071e3]">Give back</p>
              <p className="mt-1 font-semibold text-[#1d1d1f]">Funding &amp; events</p>
              <p className="mt-1 text-[12px] text-neutral-500">College drives &amp; Meet sessions</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/referrals")}
              className="apple-glass-card p-4 text-left transition hover:shadow-lg lg:col-span-1"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0071e3]">Referrals</p>
              <p className="mt-1 font-semibold text-[#1d1d1f]">Seek intros</p>
              <p className="mt-1 text-[12px] text-neutral-500">Post what you need; alumni browse the board</p>
            </button>
          </div>

          <h2 className="pt-2 text-[20px] font-semibold tracking-tight text-[#1d1d1f]">
            Explore alumni ({alumni.length})
          </h2>

          {loadingAlumni ? (
            <p className="text-[15px] text-neutral-500">Loading…</p>
          ) : (
            alumni.map((alumnus) => (
              <AlumniCard
                key={alumnus._id}
                alumni={alumnus}
                requestStatus={getRequestStatus(alumnus._id)}
                onSendRequest={handleSendRequest}
                loading={sendingRequest === alumnus._id}
              />
            ))
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-3">
          <RightPanel />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
