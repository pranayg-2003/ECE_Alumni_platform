import React from "react";
import { Link } from "react-router-dom";

const AuthHeroPanel = ({ landing }) => {
  const l = landing || {};
  return (
    <div className="auth-hero-apple relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[28px] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-9 lg:min-h-[520px]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#2997ff]/20 blur-3xl animate-auth-drift" />
        <div className="absolute -right-16 bottom-20 h-56 w-56 rounded-full bg-[#5e5ce6]/15 blur-3xl animate-auth-float" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.04] blur-3xl animate-auth-float-delayed" />
      </div>
      <div className="relative z-10 animate-auth-fade-up">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[15px] font-normal text-white/65 transition-colors duration-300 hover:text-white"
        >
          <span aria-hidden>‹</span>
          <span>Home</span>
        </Link>
        <p className="mt-10 inline-flex rounded-full border border-white/10 bg-white/[0.08] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75 backdrop-blur-md">
          {l.heroBadge || "MentorBridge"}
        </p>
        <h1 className="mt-5 max-w-lg text-[32px] font-semibold leading-[1.08] tracking-tight text-white md:text-[40px]">
          {l.heroTitle}
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/55 md:text-[17px]">
          {l.heroSubtitle}
        </p>
      </div>
      <p className="relative z-10 animate-auth-fade-up text-[12px] font-normal text-white/35 delay-150">
        Same story as the public landing — visit the home page for the full experience.
      </p>
    </div>
  );
};

export default AuthHeroPanel;
