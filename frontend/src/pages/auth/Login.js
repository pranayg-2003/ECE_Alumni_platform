// src/pages/auth/Login.js
// Modern login page with attractive design and animations

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Call login from AuthContext
      const user = await login(formData.email, formData.password);

      // Redirect based on role
      const redirectMap = {
        student: "/dashboard/student",
        alumni: "/menteeProgram",
        admin: "/dashboard/admin",
      };
      navigate(redirectMap[user.role]);
    } catch (err) {
      // Show error message from backend
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-700 to-pink-600 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main container */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
          {/* Header with animation */}
          <div className="text-center mb-8 animate-fade-in">
            {/* Logo */}
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform duration-300">
              <span className="text-white font-bold text-3xl">M</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-500 text-sm mt-2">Sign in to your MentorBridge account</p>
          </div>

          {/* Error message with animation */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 animate-slide-in-top flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📧 Email Address
              </label>
              <div className="relative">
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
            </div>

            {/* Password Field */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔐 Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-gray-50 group-hover:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-400 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Demo credentials */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
            <p className="text-xs text-gray-600 mb-3 font-semibold">💡 Try Demo Credentials:</p>
            <div className="space-y-2 text-xs">
              <div className="font-mono bg-white rounded px-2 py-1 text-gray-700">
                👨‍🎓 Student: <span className="text-blue-600">aditya@student.com</span>
              </div>
              <div className="font-mono bg-white rounded px-2 py-1 text-gray-700">
                💼 Alumni: <span className="text-blue-600">jatin@alumni.com</span>
              </div>
              <div className="font-mono bg-white rounded px-2 py-1 text-gray-700">
                🔑 Password: <span className="text-blue-600">password123</span>
              </div>
            </div>
          </div>

          {/* Footer link */}
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link 
              to="/register" 
                className="text-purple-700 font-bold hover:text-pink-600 transition-colors underline-offset-2 hover:underline"
            >
              Create one now
            </Link>
          </p>
        </div>

        {/* Bottom decorative element */}
        <div className="mt-6 text-center text-white/60 text-xs">
          <p>🌟 Connecting students and alumni through mentorship</p>
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

export default Login;
