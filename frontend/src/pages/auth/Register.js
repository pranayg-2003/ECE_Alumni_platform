// src/pages/auth/Register.js
// Modern registration page with attractive design and animations

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Available options for dropdowns
const BRANCHES = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Electrical", "Chemical", "Other"];
const INTERESTS = ["Web Development", "Mobile Apps", "AI/ML", "Data Science", "DevOps", "Cybersecurity", "UI/UX Design", "Blockchain", "Cloud Computing", "Research"];
const SKILLS = ["JavaScript", "Python", "React", "Node.js", "Java", "C++", "SQL", "MongoDB", "AWS", "Docker", "Figma", "Git"];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  // Form state — covers all possible fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",    // Default role
    company: "",        // Alumni only
    branch: "",         // Student only
    year: "",           // Student only
    interests: [],
    skills: [],
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle text input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  // Toggle an item in an array field (interests / skills)
  const toggleArrayItem = (field, item) => {
    const currentArray = formData[field];
    if (currentArray.includes(item)) {
      // Remove item
      setFormData({ ...formData, [field]: currentArray.filter((i) => i !== item) });
    } else {
      // Add item (max 5)
      if (currentArray.length < 5) {
        setFormData({ ...formData, [field]: [...currentArray, item] });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);

    try {
      // Build payload (exclude confirmPassword)
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        interests: formData.interests,
        skills: formData.skills,
      };

      // Add role-specific fields
      if (formData.role === "alumni") {
        payload.company = formData.company;
      }
      if (formData.role === "student") {
        payload.branch = formData.branch;
        payload.year = parseInt(formData.year);
      }

      const user = await register(payload);

      // Redirect to role-specific dashboard
      const redirectMap = {
        student: "/dashboard/student",
        alumni: "/menteeProgram",
        admin: "/dashboard/admin",
      };
      navigate(redirectMap[user.role]);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main container */}
      <div className="relative w-full max-w-2xl">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
          {/* Header with animation */}
          <div className="text-center mb-8 animate-fade-in">
            {/* Logo */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform duration-300">
              <span className="text-white font-bold text-3xl">M</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Join MentorBridge
            </h1>
            <p className="text-gray-500 text-sm mt-2">Connect with mentors, grow your career</p>
          </div>

          {/* Error message with animation */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 animate-slide-in-top flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection — shown first so fields update dynamically */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
              <label className="block text-sm font-bold text-gray-700 mb-3">🎯 Who are you?</label>
              <div className="grid grid-cols-2 gap-3">
                {["student", "alumni"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: r })}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold capitalize transition-all transform hover:scale-105 ${
                      formData.role === r
                        ? "border-blue-600 bg-blue-600 text-white shadow-lg"
                        : "border-gray-200 text-gray-600 bg-white hover:border-blue-400"
                    }`}
                  >
                    {r === "student" ? "🎓 Student" : "💼 Alumni"}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Fields */}
            <div className="space-y-4">
              {/* Full Name */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-gray-50 group-hover:bg-white"
                />
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-gray-50 group-hover:bg-white"
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🔐 Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-gray-50 group-hover:bg-white"
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">✓ Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-gray-50 group-hover:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Show password checkbox */}
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span>Show password</span>
              </label>
            </div>

            {/* Role-specific fields with smooth transitions */}
            {formData.role === "alumni" && (
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 mb-2">💼 Current Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Google, Microsoft, Startup..."
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-white"
                />
              </div>
            )}

            {formData.role === "student" && (
              <div className="bg-green-50 rounded-2xl p-4 border border-green-100 space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🎓 Branch</label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 bg-white"
                    >
                      <option value="">Select branch</option>
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Year</label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 bg-white"
                    >
                      <option value="">Select year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Interests — multi-select chips */}
            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                ⭐ Interests <span className="text-xs font-normal text-gray-500">(pick up to 5)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem("interests", item)}
                    className={`px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all transform hover:scale-105 ${
                      formData.interests.includes(item)
                        ? "bg-purple-600 text-white border-purple-600 shadow-md"
                        : "bg-white text-gray-600 border-gray-300 hover:border-purple-400"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills — multi-select chips */}
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🛠️ Skills <span className="text-xs font-normal text-gray-500">(pick up to 5)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem("skills", item)}
                    className={`px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all transform hover:scale-105 ${
                      formData.skills.includes(item)
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="text-blue-600 font-bold hover:text-purple-600 transition-colors underline-offset-2 hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Bottom decorative element */}
        <div className="mt-6 text-center text-white/60 text-xs">
          <p>🚀 Start your mentorship journey today</p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-top {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-in-top {
          animation: slide-in-top 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Register;
