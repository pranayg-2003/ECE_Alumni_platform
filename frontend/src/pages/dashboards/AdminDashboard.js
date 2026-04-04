// src/pages/dashboards/AdminDashboard.js
// Modern admin dashboard with control panel design

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/layout/Navbar";
import api from "../../utils/api";
import { usePost } from "../../context/PostContext";
import PostCard from "../../components/post/PostCard";

// Enhanced stat card with icon and hover effect
const StatCard = ({ icon, label, value, gradient, status }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold opacity-90">{label}</p>
        <p className="text-4xl font-bold mt-2">{value}</p>
        {status && <p className="text-xs opacity-75 mt-2">{status}</p>}
      </div>
      <div className="text-5xl opacity-20">{icon}</div>
    </div>
  </div>
);

// User row component for table
const UserRow = ({ user, index }) => (
  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
    <td className="px-4 py-4 text-sm text-gray-600 font-semibold">#{index}</td>
    <td className="px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
    </td>
    <td className="px-4 py-4">
      <span className={`text-xs font-bold px-4 py-2 rounded-full ${
        user.role === "student" ? "bg-blue-100 text-blue-700" :
        user.role === "alumni" ? "bg-green-100 text-green-700" :
        "bg-purple-100 text-purple-700"
      }`}>
        {user.role.toUpperCase()}
      </span>
    </td>
    <td className="px-4 py-4 text-sm">
      {user.role === "student" && <p className="text-gray-700">🎓 {user.branch || "—"} • Year {user.year || "—"}</p>}
      {user.role === "alumni" && <p className="text-gray-700">🏢 {user.company || "—"}</p>}
      {user.role === "admin" && <p className="text-gray-500">—</p>}
    </td>
    <td className="px-4 py-4 text-sm">
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold text-xs">
        ✓ Active
      </span>
    </td>
  </tr>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const { posts, loading: postsLoading } = usePost();
  const [students, setStudents] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, alumniRes] = await Promise.all([
          api.get("/users/students"),
          api.get("/users/alumni"),
        ]);
        setStudents(studentsRes.data.data || []);
        setAlumni(alumniRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const allUsers = [...students, ...alumni];
  const stats = [
    { icon: "👥", label: "Total Users", value: allUsers.length, gradient: "from-blue-500 to-cyan-600" },
    { icon: "🎓", label: "Students", value: students.length, gradient: "from-emerald-500 to-teal-600" },
    { icon: "💼", label: "Alumni", value: alumni.length, gradient: "from-indigo-500 to-purple-600" },
    { icon: "⭐", label: "Platform Rating", value: "4.8", gradient: "from-yellow-500 to-orange-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Admin Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <div className="absolute top-0 right-0 text-8xl opacity-10 transform translate-x-20 -translate-y-10">⚙️</div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Admin Control Panel 🛡️</h1>
                <p className="text-purple-200 text-base">
                  Welcome, {user?.name}. Monitor and manage the mentorship platform.
                </p>
              </div>
              <div className="text-6xl opacity-20">📊</div>
            </div>
            <div className="mt-4 flex gap-6 text-sm text-purple-200">
              <span className="flex items-center gap-1">✓ All Systems Operational</span>
              <span className="flex items-center gap-1">📈 Platform Status: Healthy</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <StatCard
              key={idx}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              gradient={stat.gradient}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Quick Actions & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Admin Profile */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="h-24 bg-gradient-to-r from-slate-800 to-purple-900 relative">
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-purple-800 flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="pt-12 px-4 pb-4 text-center">
                <h2 className="font-bold text-gray-800 text-lg">{user?.name}</h2>
                <p className="text-sm text-purple-600 font-semibold mt-1">👮 Administrator</p>
                <p className="text-xs text-gray-500 mt-1">Full Access</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 border border-blue-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">⚡ Quick Actions</h3>
              <div className="space-y-2 text-sm">
                <button className="w-full text-left px-3 py-2.5 rounded-lg bg-white hover:bg-blue-50 text-blue-600 font-semibold transition-colors duration-200">
                  📧 Send Announcement
                </button>
                <button className="w-full text-left px-3 py-2.5 rounded-lg bg-white hover:bg-blue-50 text-blue-600 font-semibold transition-colors duration-200">
                  🗑️ Remove User
                </button>
                <button className="w-full text-left px-3 py-2.5 rounded-lg bg-white hover:bg-blue-50 text-blue-600 font-semibold transition-colors duration-200">
                  📊 Generate Report
                </button>
                <button className="w-full text-left px-3 py-2.5 rounded-lg bg-white hover:bg-blue-50 text-blue-600 font-semibold transition-colors duration-200">
                  ⚙️ Settings
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">🔧 System Status</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-gray-700">Database</span>
                  <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span> Connected
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-700">API Server</span>
                  <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span> Running
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-700">Email Service</span>
                  <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span> Active
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-700">Uptime</span>
                  <span className="text-green-600 font-bold">99.9%</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content - User Management */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-800 text-xl">📋 All Users</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage platform members and their access</p>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="🔍 Search users..."
                      className="px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200">
                      ➕ Add User
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="px-6 py-12 text-center">
                  <div className="inline-block animate-spin">⏳</div>
                  <p className="text-gray-500 mt-3">Loading users...</p>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-5xl mb-3">📭</p>
                  <p className="text-gray-500 font-semibold">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Organization</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.slice(0, 10).map((u, idx) => (
                        <UserRow key={u._id} user={u} index={idx + 1} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {allUsers.length > 10 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-bold">1-10</span> of <span className="font-bold">{allUsers.length}</span> users
                  </p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200">
                      ← Previous
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-purple-600 text-sm text-white hover:bg-purple-700 transition-colors duration-200">
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-800 text-xl">
                      ✨ Latest Posts
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Edit any post from here
                    </p>
                  </div>
                  <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                    {posts?.length || 0}
                  </span>
                </div>
              </div>

              {postsLoading ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-gray-500">Loading posts...</p>
                </div>
              ) : (
                <div className="px-4 py-4 space-y-4">
                  {(posts || []).slice(0, 3).map((p) => (
                    <PostCard key={p._id} post={p} />
                  ))}
                  {(posts || []).length === 0 && (
                    <div className="px-3 pb-8 text-center">
                      <p className="text-gray-500 text-sm">No posts yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
