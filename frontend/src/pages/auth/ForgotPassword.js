import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import AuthHeroPanel from "../../components/landing/AuthHeroPanel";
import { useLandingContent } from "../../hooks/useLandingContent";
import { toastApiError } from "../../utils/toast";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const { landing } = useLandingContent();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full rounded-2xl border border-black/[0.06] bg-[#f5f5f7] px-4 py-3.5 text-[17px] text-[#1d1d1f] outline-none transition duration-300 placeholder:text-neutral-400 focus:border-[#0071e3]/35 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20";

  const sendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email: email.trim() });
      if (data.success) {
        toast.success(data.message || "Check your email for the code.");
        setStep(2);
      }
    } catch (err) {
      toastApiError(err, "Could not send code.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      if (data.success) {
        toast.success(data.message || "Password updated.");
        setStep(3);
      }
    } catch (err) {
      toastApiError(err, "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#1d1d1f] text-[15px] font-semibold tracking-tight text-white shadow-lg lg:mx-0">
                M
              </div>
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#1d1d1f] md:text-[32px]">
                {step === 3 ? "You’re all set." : "Reset password."}
              </h1>
              <p className="mt-2 text-[17px] leading-snug text-neutral-500">
                {step === 1 && "We’ll email a short verification code to confirm it’s you."}
                {step === 2 && "Enter the code from your email and choose a new password."}
                {step === 3 && "Sign in with your new password anytime."}
              </p>
            </div>

            {step === 1 && (
              <form onSubmit={sendCode} className="space-y-5">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#0071e3] py-3.5 text-[17px] font-medium text-white transition duration-300 hover:bg-[#0077ed] active:scale-[0.99] disabled:opacity-45"
                >
                  {loading ? "Sending…" : "Send code"}
                </button>
                <p className="text-[13px] leading-snug text-neutral-500">
                  Use the same email you registered with. If you don’t see the code, check spam and wait at least one
                  minute before requesting again.
                </p>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={resetPassword} className="space-y-5">
                <p className="text-[14px] text-neutral-600">
                  Code sent to <span className="font-medium text-[#1d1d1f]">{email}</span>
                  <button
                    type="button"
                    className="ml-2 font-medium text-[#0071e3] underline-offset-4 hover:underline"
                    onClick={() => setStep(1)}
                  >
                    Change
                  </button>
                </p>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit code"
                    required
                    className={`${inputClass} tracking-[0.35em] font-mono text-center text-[20px]`}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[#1d1d1f]">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#0071e3] py-3.5 text-[17px] font-medium text-white transition duration-300 hover:bg-[#0077ed] active:scale-[0.99] disabled:opacity-45"
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            )}

            {step === 3 && (
              <Link
                to="/login"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#0071e3] py-3.5 text-[17px] font-medium text-white transition hover:bg-[#0077ed]"
              >
                Sign in
              </Link>
            )}

            <p className="mt-8 text-center text-[15px] text-neutral-600 lg:text-left">
              <Link to="/login" className="font-medium text-[#0071e3] underline-offset-4 hover:underline">
                Back to sign in
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

export default ForgotPassword;
