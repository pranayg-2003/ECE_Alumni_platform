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
  <div className="bg-white rounded-xl shadow p-4">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-gray-300 mb-2"></div>
      <h2 className="font-semibold">{user?.name}</h2>
      <p className="text-sm text-gray-500">
        {user?.branch} • Year {user?.year}
      </p>
    </div>

    <div className="mt-4 border-t pt-4 text-sm space-y-2">
      <p className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">
        🏠 Feed
      </p>
      <p className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">
        👥 My Network
      </p>
      <p className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">
        💬 Messages
      </p>
    </div>
  </div>
);

/* ================= RIGHT PANEL ================= */
const RightPanel = () => (
  <div className="bg-white p-4 rounded-xl shadow">
    <h3 className="font-semibold mb-2">💡 Tips</h3>
    <p className="text-sm text-gray-500">
      Connect with alumni based on your career goals and interests.
    </p>
  </div>
);

/* ================= ALUMNI CARD ================= */
const AlumniCard = ({ alumni, requestStatus, onSendRequest, loading }) => {
  return (
    <div className="bg-white p-4 rounded-lg border hover:shadow-sm transition">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center font-bold">
          {alumni.name.charAt(0)}
        </div>

        <div>
          <h3 className="font-semibold text-gray-800">{alumni.name}</h3>
          <p className="text-sm text-gray-500">{alumni.company}</p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-1">{alumni.jobTitle}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mt-3">
        {alumni.skills?.slice(0, 3).map((skill) => (
          <span key={skill} className="text-xs bg-gray-100 px-2 py-1 rounded">
            {skill}
          </span>
        ))}
      </div>

      {/* Bio */}
      {alumni.bio && (
        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{alumni.bio}</p>
      )}

      {/* Buttons */}
      {requestStatus === "accepted" ? (
        <button className="mt-4 px-4 py-1 bg-green-600 text-white rounded-full">
          Connected
        </button>
      ) : requestStatus === "pending" ? (
        <button
          disabled
          className="mt-4 px-4 py-1 bg-gray-300 text-gray-500 rounded-full"
        >
          Pending
        </button>
      ) : (
        <button
          onClick={() => onSendRequest(alumni)}
          disabled={loading}
          className="mt-4 px-4 py-1 border border-blue-600 text-blue-600 rounded-full hover:bg-blue-50"
        >
          {loading ? "Sending..." : "Connect"}
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
    <div className="min-h-screen bg-[#f3f2ef]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* LEFT SIDEBAR */}
        <div className="col-span-3">
          <Sidebar user={user} />
        </div>

        {/* MAIN CONTENT */}
        <div className="col-span-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => navigate("/feed")}
              className="rounded-xl border border-blue-100 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase text-blue-600">Student</p>
              <p className="mt-1 font-semibold text-gray-900">Community feed</p>
              <p className="mt-1 text-xs text-gray-500">Posts, media & discussions</p>
            </button>
            <button
              type="button"
              onClick={() =>
                document.querySelector('[placeholder="Search alumni..."]')?.focus()
              }
              className="rounded-xl border border-emerald-100 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase text-emerald-600">Discover</p>
              <p className="mt-1 font-semibold text-gray-900">Search mentors</p>
              <p className="mt-1 text-xs text-gray-500">Use the bar in the header</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="rounded-xl border border-violet-100 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase text-violet-600">Connect</p>
              <p className="mt-1 font-semibold text-gray-900">Messages</p>
              <p className="mt-1 text-xs text-gray-500">Chat after a match</p>
            </button>
          </div>

          <h2 className="font-semibold text-gray-700 pt-2">
            Explore Alumni ({alumni.length})
          </h2>

          {loadingAlumni ? (
            <p>Loading...</p>
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
