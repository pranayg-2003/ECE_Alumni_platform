import React from "react";
import { Link } from "react-router-dom";

const AuthHeroPanel = ({ landing }) => {
  const l = landing || {};
  return (
    <div className="landing-hero-mesh relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-3xl p-6 text-white sm:p-8 lg:min-h-[520px]">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="absolute -right-10 bottom-10 h-48 w-48 rounded-full bg-violet-500/25 blur-3xl" />
      </div>
      <div className="relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white"
        >
          ← Back to home
        </Link>
        <p className="mt-8 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200">
          {l.heroBadge || "MentorBridge"}
        </p>
        <h1 className="mt-4 max-w-lg text-3xl font-bold leading-tight md:text-4xl">
          {l.heroTitle}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-violet-100/90">
          {l.heroSubtitle}
        </p>
      </div>
      <p className="relative z-10 text-xs text-white/45">
        Same brand story as the public landing — scroll the home page for the full experience.
      </p>
    </div>
  );
};

export default AuthHeroPanel;
