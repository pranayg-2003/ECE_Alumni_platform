// src/pages/auth/Register.js
// Apple-inspired registration — calm layout, glass card, subtle motion

import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { toastApiError } from "../../utils/toast";
import AuthHeroPanel from "../../components/landing/AuthHeroPanel";
import { useLandingContent } from "../../hooks/useLandingContent";

const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical",
  "Chemical",
  "Other",
];
const INTERESTS = [
  "Web Development",
  "Mobile Apps",
  "AI/ML",
  "Data Science",
  "DevOps",
  "Cybersecurity",
  "UI/UX Design",
  "Blockchain",
  "Cloud Computing",
  "Research",
];
const SKILLS = [
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "Java",
  "C++",
  "SQL",
  "MongoDB",
  "AWS",
  "Docker",
  "Figma",
  "Git",
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { landing } = useLandingContent();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    company: "",
    branch: "",
    year: "",
    interests: [],
    skills: [],
    adminSecret: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submitLock = useRef(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const toggleArrayItem = (field, item) => {
    const currentArray = formData[field];
    if (currentArray.includes(item)) {
      setFormData({ ...formData, [field]: currentArray.filter((i) => i !== item) });
    } else if (currentArray.length < 5) {
      setFormData({ ...formData, [field]: [...currentArray, item] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    setError("");

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
    if (formData.role === "admin" && !formData.adminSecret?.trim()) {
      submitLock.current = false;
      return setError("Admin signup requires the registration secret from your server administrator.");
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        interests: formData.interests,
        skills: formData.skills,
      };

      if (formData.role === "alumni") {
        payload.company = formData.company.trim();
      }
      if (formData.role === "student") {
        payload.branch = formData.branch;
        payload.year = parseInt(formData.year, 10);
      }
      if (formData.role === "admin") {
        payload.adminSecret = formData.adminSecret.trim();
      }

      const { user, welcomeEmailSent } = await register(payload);

      if (welcomeEmailSent) {
        toast.success(
          `Welcome! We sent a registration email to ${user.email}. Check your inbox and spam folder.`,
          { duration: 6500 },
        );
      } else {
        toast.success("Account created — you’re signed in.", { duration: 4000 });
      }

      const redirectMap = {
        student: "/feed",
        alumni: "/feed",
        admin: "/admin",
      };
      navigate(redirectMap[user.role]);
    } catch (err) {
      toastApiError(err, "Registration failed. Please try again.");
    } finally {
      setLoading(false);
      submitLock.current = false;
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-black/[0.06] bg-[#f5f5f7] px-4 py-3.5 text-[17px] text-[#1d1d1f] outline-none transition duration-300 placeholder:text-neutral-400 focus:border-[#0071e3]/35 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20";

  const chipBase =
    "rounded-full border px-3.5 py-2 text-[12px] font-medium transition duration-300";

  return (
    <div className="auth-apple-page font-apple relative min-h-screen overflow-hidden px-4 py-10 lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[#0071e3]/[0.07] blur-3xl animate-auth-float" />
        <div className="absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-[#5e5ce6]/[0.06] blur-3xl animate-auth-float-delayed" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12">
        <AuthHeroPanel landing={landing} />

        <div className="flex flex-col justify-center">
          <div className="animate-auth-fade-up max-h-[calc(100vh-5rem)] overflow-y-auto rounded-[28px] border border-white/80 bg-white/75 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-2xl backdrop-saturate-150 md:p-9">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#1d1d1f] text-[15px] font-semibold tracking-tight text-white shadow-lg lg:mx-0">
                M
              </div>
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#1d1d1f] md:text-[32px]">
                Join MentorBridge.
              </h1>
              <p className="mt-2 text-[17px] text-neutral-500">Connect with mentors and grow your career.</p>
            </div>

            {error && (
              <div
                className="animate-auth-fade-in mb-6 rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-[14px] text-red-800"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <p className="mb-3 text-[13px] font-semibold text-[#1d1d1f]">I am a</p>
                <div className="grid grid-cols-3 gap-1 rounded-2xl bg-[#f5f5f7] p-1">
                  {["student", "alumni", "admin"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          role: r,
                          adminSecret: r === "admin" ? formData.adminSecret : "",
                          interests: r === "admin" ? [] : formData.interests,
                          skills: r === "admin" ? [] : formData.skills,
                        })
                      }
                      className={`rounded-[14px] py-2.5 text-[13px] font-medium capitalize transition duration-300 sm:text-[14px] ${
                        formData.role === r
                          ? "bg-white text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                          : "text-neutral-500 hover:text-[#1d1d1f]"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {formData.role === "admin" && (
                  <p className="mt-2 text-[12px] leading-snug text-neutral-500">
                    Set <code className="rounded bg-black/[0.04] px-1">ADMIN_REGISTER_SECRET</code> in{" "}
                    <code className="rounded bg-black/[0.04] px-1">backend/.env</code>, restart the API server, then enter
                    the exact same value below (8+ characters in production).
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">Full name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">Email</label>
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      required
                      autoComplete="new-password"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">Confirm</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      required
                      autoComplete="new-password"
                      className={inputClass}
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-neutral-600">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="h-4 w-4 rounded border-neutral-300 text-[#0071e3] focus:ring-[#0071e3]/30"
                  />
                  Show password
                </label>
              </div>

              {formData.role === "alumni" && (
                <div className="animate-auth-fade-in rounded-2xl border border-black/[0.06] bg-[#f5f5f7]/60 p-4">
                  <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">Current company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Company or organization"
                    required
                    className={inputClass}
                  />
                </div>
              )}

              {formData.role === "admin" && (
                <div className="animate-auth-fade-in rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4">
                  <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">Admin registration secret</label>
                  <input
                    type="password"
                    name="adminSecret"
                    value={formData.adminSecret}
                    onChange={handleChange}
                    placeholder="Same as ADMIN_REGISTER_SECRET in backend/.env"
                    autoComplete="off"
                    required
                    className={inputClass}
                  />
                </div>
              )}

              {formData.role === "student" && (
                <div className="animate-auth-fade-in space-y-4 rounded-2xl border border-black/[0.06] bg-[#f5f5f7]/60 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">Branch</label>
                      <select
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      >
                        <option value="">Select</option>
                        {BRANCHES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">Year</label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      >
                        <option value="">Select</option>
                        <option value="1">1st year</option>
                        <option value="2">2nd year</option>
                        <option value="3">3rd year</option>
                        <option value="4">4th year</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {formData.role !== "admin" && (
                <>
                  <div className="rounded-2xl border border-black/[0.06] bg-[#fafafc] p-4">
                    <label className="mb-3 block text-[13px] font-semibold text-[#1d1d1f]">
                      Interests <span className="font-normal text-neutral-500">(up to 5)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleArrayItem("interests", item)}
                          className={`${chipBase} border-black/[0.08] ${
                            formData.interests.includes(item)
                              ? "border-transparent bg-[#1d1d1f] text-white shadow-sm"
                              : "bg-white text-neutral-600 hover:border-black/[0.12]"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/[0.06] bg-[#fafafc] p-4">
                    <label className="mb-3 block text-[13px] font-semibold text-[#1d1d1f]">
                      Skills <span className="font-normal text-neutral-500">(up to 5)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleArrayItem("skills", item)}
                          className={`${chipBase} border-black/[0.08] ${
                            formData.skills.includes(item)
                              ? "border-transparent bg-[#1d1d1f] text-white shadow-sm"
                              : "bg-white text-neutral-600 hover:border-black/[0.12]"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#0071e3] py-3.5 text-[17px] font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.25)_inset] transition duration-300 hover:bg-[#0077ed] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Creating account…
                  </span>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-[15px] text-neutral-600 lg:text-left">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-[#0071e3] underline-offset-4 transition hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-6 text-center text-[13px] text-neutral-500 lg:hidden">
        <Link to="/" className="font-medium text-[#0071e3] underline-offset-4 hover:underline">
          Back to landing
        </Link>
      </div>
    </div>
  );
};

export default Register;
