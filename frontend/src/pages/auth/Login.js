// src/pages/auth/Login.js
// Apple-inspired auth: calm typography, glass card, subtle motion

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

  const inputClass =
    "w-full rounded-2xl border border-black/[0.06] bg-[#f5f5f7] px-4 py-3.5 text-[17px] text-[#1d1d1f] outline-none transition duration-300 placeholder:text-neutral-400 focus:border-[#0071e3]/35 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20";

  return (
    <div className="auth-apple-page font-apple relative min-h-screen overflow-hidden px-4 py-10 lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[#0071e3]/[0.07] blur-3xl animate-auth-float" />
        <div className="absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-[#5e5ce6]/[0.06] blur-3xl animate-auth-float-delayed" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12">
        <AuthHeroPanel landing={landing} />

        <div className="flex flex-col justify-center">
          <div className="animate-auth-fade-up rounded-[28px] border border-white/80 bg-white/75 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-2xl backdrop-saturate-150 md:p-10">
            <div className="mb-10 text-center lg:text-left">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#1d1d1f] text-[15px] font-semibold tracking-tight text-white shadow-lg lg:mx-0">
                M
              </div>
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#1d1d1f] md:text-[32px]">
                Welcome back.
              </h1>
              <p className="mt-2 text-[17px] leading-snug text-neutral-500">
                Sign in to MentorBridge — feed, mentors, and messages.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-black/[0.04] hover:text-[#1d1d1f]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-[14px] font-medium text-[#0071e3] underline-offset-4 transition hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-[#0071e3] py-3.5 text-[17px] font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.25)_inset] transition duration-300 hover:bg-[#0077ed] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-black/[0.08]" />
              <span className="text-[12px] font-medium uppercase tracking-wider text-neutral-400">or</span>
              <div className="h-px flex-1 bg-black/[0.08]" />
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7]/80 px-4 py-3.5 text-[13px] leading-relaxed text-neutral-600">
              <p className="font-semibold text-[#1d1d1f]">Demo access</p>
              <p className="mt-1 font-mono text-[12px] text-neutral-500">
                student / alumni from seed · password123
              </p>
            </div>

            <p className="mt-8 text-center text-[15px] text-neutral-600 lg:text-left">
              New here?{" "}
              <Link
                to="/register"
                className="font-medium text-[#0071e3] underline-offset-4 transition hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-8 text-center text-[13px] text-neutral-500 lg:hidden">
        <Link to="/" className="font-medium text-[#0071e3] underline-offset-4 hover:underline">
          Back to landing
        </Link>
      </div>
    </div>
  );
};

export default Login;
