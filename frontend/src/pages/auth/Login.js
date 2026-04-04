// src/pages/auth/Login.js
// Landing-style auth: hero + floating alumni updates + login form

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toastApiError } from "../../utils/toast";
import AuthHeroPanel from "../../components/landing/AuthHeroPanel";
import { useLandingContent } from "../../hooks/useLandingContent";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { landing } = useLandingContent();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      const redirectMap = {
        student: "/feed",
        alumni: "/feed",
        admin: "/dashboard/admin",
      };
      navigate(redirectMap[user.role]);
    } catch (err) {
      toastApiError(err, "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:gap-10">
        <AuthHeroPanel landing={landing} />

        <div className="flex flex-col justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl md:p-10">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xl font-bold text-white shadow-md lg:mx-0">
                M
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-500">
                Sign in to MentorBridge — feed, mentors, and messages.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    aria-label="Toggle password"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-base font-bold text-white shadow-lg transition hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
              <p className="mb-2 font-semibold text-slate-700">Demo access</p>
              <p className="font-mono">student / alumni from seed · password123</p>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              New here?{" "}
              <Link
                to="/register"
                className="font-bold text-violet-700 hover:text-fuchsia-600"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: show slim hero strip */}
      <div className="mt-6 text-center text-xs text-slate-500 lg:hidden">
        <Link to="/" className="font-medium text-violet-700">
          ← Back to landing
        </Link>
      </div>
    </div>
  );
};

export default Login;
