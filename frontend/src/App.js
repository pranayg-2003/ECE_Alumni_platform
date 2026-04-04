// // src/App.js
// // Root component — sets up React Router and all routes

// import React from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";
// import { AuthProvider, useAuth } from "./context/AuthContext";
// import { ChatProvider } from "./context/ChatContext";

// // Pages
// import Login from "./pages/auth/Login";
// import Register from "./pages/auth/Register";
// import StudentDashboard from "./pages/dashboards/StudentDashboard";
// import AlumniDashboard from "./pages/dashboards/AlumniDashboard";
// import AdminDashboard from "./pages/dashboards/AdminDashboard";
// import ChatDashboard from "./pages/dashboards/ChatDashboard";

// // Components
// import ProtectedRoute from "./components/common/ProtectedRoute";

// // ============================================
// // ROOT REDIRECT
// // ============================================
// // If user is already logged in, send to their dashboard
// // Otherwise send to /login
// const RootRedirect = () => {
//   const { user, loading } = useAuth();

//   if (loading) return null; // Wait for auth check

//   if (!user) return <Navigate to="/login" replace />;

//   const redirectMap = {
//     student: "/dashboard/student",
//     alumni: "/dashboard/alumni",
//     admin: "/dashboard/admin",
//   };

//   return <Navigate to={redirectMap[user.role]} replace />;
// };

// function App() {
//   return (
//     // AuthProvider wraps the entire app to provide auth state
//     <AuthProvider>
//       {/* ChatProvider for real-time chat functionality */}
//       <ChatProvider>
//         <Router>
//           <Routes>
//             {/* Root — smart redirect */}
//             <Route path="/" element={<RootRedirect />} />

//             {/* ---- PUBLIC ROUTES ---- */}
//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />

//             {/* ---- PROTECTED ROUTES ---- */}

//             {/* Student Dashboard — only students can access */}
//             <Route
//               path="/dashboard/student"
//               element={
//                 <ProtectedRoute allowedRoles={["student"]}>
//                   <StudentDashboard />
//                 </ProtectedRoute>
//               }
//             />

//             {/* Alumni Dashboard — only alumni can access */}
//             <Route
//               path="/dashboard/alumni"
//               element={
//                 <ProtectedRoute allowedRoles={["alumni"]}>
//                   <AlumniDashboard />
//                 </ProtectedRoute>
//               }
//             />

//             {/* Admin Dashboard — only admin can access */}
//             <Route
//               path="/dashboard/admin"
//               element={
//                 <ProtectedRoute allowedRoles={["admin"]}>
//                   <AdminDashboard />
//                 </ProtectedRoute>
//               }
//             />

//             {/* Chat Dashboard — students and alumni can access */}
//             <Route
//               path="/chat"
//               element={
//                 <ProtectedRoute allowedRoles={["student", "alumni"]}>
//                   <ChatDashboard />
//                 </ProtectedRoute>
//               }
//             />

//             {/* Catch-all: redirect unknown routes to root */}
//             <Route path="*" element={<Navigate to="/" replace />} />
//           </Routes>
//         </Router>
//       </ChatProvider>
//     </AuthProvider>
//   );
// }

// export default App;
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { PostProvider } from "./context/PostContext"; // ✅ NEW

// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import AlumniDashboard from "./pages/dashboards/AlumniDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import ChatDashboard from "./pages/dashboards/ChatDashboard";
import Feed from "./pages/Feed"; // ✅ NEW
import Profile from "./pages/Profile";

// Components
import ProtectedRoute from "./components/common/ProtectedRoute";
import MessagesPanel from "./components/chat/MessagesPanel";

/* Messages drawer: must live outside individual pages so /chat redirect can open it before Navbar mounts */
const GlobalMessagesPanel = () => {
  const { user } = useAuth();
  if (!user || user.role === "admin") return null;
  return <MessagesPanel />;
};

/* ================= ROOT REDIRECT ================= */
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "admin") {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return <Navigate to="/feed" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <PostProvider>
          {" "}
          {/* ✅ NEW */}
          <Router>
            <GlobalMessagesPanel />
            <Routes>
              {/* Root */}
              <Route path="/" element={<RootRedirect />} />

              {/* PUBLIC */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* 🔥 FEED (MAIN PAGE LIKE LINKEDIN) */}
              <Route
                path="/feed"
                element={
                  <ProtectedRoute allowedRoles={["student", "alumni"]}>
                    <Feed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={["student", "alumni", "admin"]}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* DASHBOARDS */}
              <Route
                path="/dashboard/student"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/menteeProgram"
                element={
                  <ProtectedRoute allowedRoles={["alumni"]}>
                    <AlumniDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/alumni"
                element={<Navigate to="/menteeProgram" replace />}
              />

              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* CHAT */}
              <Route
                path="/chat"
                element={
                  <ProtectedRoute allowedRoles={["student", "alumni"]}>
                    <ChatDashboard />
                  </ProtectedRoute>
                }
              />

              {/* FALLBACK */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </PostProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
