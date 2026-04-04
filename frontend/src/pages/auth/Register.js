// src/pages/auth/Register.js
// Modern registration page with attractive design and animations

import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toastApiError } from "../../utils/toast";
import AuthHeroPanel from "../../components/landing/AuthHeroPanel";
import { useLandingContent } from "../../hooks/useLandingContent";

// Available options for dropdowns
const BRANCHES = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Electrical", "Chemical", "Other"];
const INTERESTS = ["Web Development", "Mobile Apps", "AI/ML", "Data Science", "DevOps", "Cybersecurity", "UI/UX Design", "Blockchain", "Cloud Computing", "Research"];
const SKILLS = ["JavaScript", "Python", "React", "Node.js", "Java", "C++", "SQL", "MongoDB", "AWS", "Docker", "Figma", "Git"];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { landing } = useLandingContent();

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
  const submitLock = useRef(false);

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
    if (submitLock.current) return;
    submitLock.current = true;
    setError("");

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      submitLock.current = false;
      return setError("Passwords do not match.");
    }
    if (formData.password.length < 6) {
      submitLock.current = false;
      return setError("Password must be at least 6 characters.");
    }
    if (formData.role === "alumni" && !formData.company?.trim()) {
      submitLock.current = false;
      return setError("Please enter your current company.");
    }

    setLoading(true);

    try {
      // Build payload (exclude confirmPassword)
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        interests: formData.interests,
        skills: formData.skills,
      };

      // Add role-specific fields
      if (formData.role === "alumni") {
        payload.company = formData.company.trim();
      }
      if (formData.role === "student") {
        payload.branch = formData.branch;
        payload.year = parseInt(formData.year);
      }

      const user = await register(payload);

      // Redirect to role-specific dashboard
      const redirectMap = {
        student: "/feed",
        alumni: "/feed",
        admin: "/dashboard/admin",
      };
      navigate(redirectMap[user.role]);
    } catch (err) {
      toastApiError(err, "Registration failed. Please try again.");
    } finally {
      setLoading(false);
      submitLock.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:gap-10">
        <AuthHeroPanel landing={landing} />

        <div className="flex flex-col justify-center">
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
          <div className="mb-6 text-center lg:text-left">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-md lg:mx-0">
              M
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Join MentorBridge</h1>
            <p className="text-sm text-slate-500">Connect with mentors, grow your career</p>
          </div>

          {/* Error message with animation */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-3">
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

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-violet-700 hover:text-fuchsia-600">
              Sign in
            </Link>
          </p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-slate-500 lg:hidden">
        <Link to="/" className="font-medium text-violet-700">
          ← Back to landing
        </Link>
      </div>
    </div>
  );
};

export default Register;
