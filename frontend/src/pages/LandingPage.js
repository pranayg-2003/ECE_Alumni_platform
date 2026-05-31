import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import ScrollSection from "../components/landing/ScrollSection";
import { useLandingContent } from "../hooks/useLandingContent";
import { youtubeHeroEmbedSrc } from "../utils/landingMedia";

const splitParagraphs = (text) => {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
};

const NavLink = ({ href, children }) => (
  <a href={href} className="landing-nitj-nav-link">
    {children}
  </a>
);

const LandingPage = () => {
  const { landing, loading } = useLandingContent();
  const [eventIndex, setEventIndex] = useState(0);

  const stats = Array.isArray(landing.stats) && landing.stats.length
    ? landing.stats
    : [
        { label: "Community", value: "ECE", sublabel: "Focused network" },
        { label: "Mentorship", value: "Live", sublabel: "Requests & chat" },
        { label: "Stories", value: "Real", sublabel: "Alumni & students" },
      ];

  const spotlights = Array.isArray(landing.spotlights) ? landing.spotlights : [];
  const timeline = Array.isArray(landing.timeline) ? landing.timeline : [];
  const gallery = Array.isArray(landing.gallery) ? landing.gallery : [];

  const deptParas = splitParagraphs(landing.departmentBody);
  const heroYoutubeSrc = youtubeHeroEmbedSrc(landing.heroYoutubeUrl || "");

  const eventCards =
    gallery.length > 0
      ? gallery
      : spotlights.map((sp) => ({
          url: sp.imageUrl,
          caption: sp.name,
          kind: "image",
          meta: sp.role,
          description: sp.contribution,
        }));

  const eventCount = eventCards.length;
  const safeEventIndex = eventCount ? eventIndex % eventCount : 0;

  const goEvent = useCallback(
    (dir) => {
      if (!eventCount) return;
      setEventIndex((i) => (i + dir + eventCount) % eventCount);
    },
    [eventCount]
  );

  const newsItems = timeline.slice(0, 6);
  const currentEvent = eventCount ? eventCards[safeEventIndex] : null;

  return (
    <div className="landing-nitj-page">
      {/* —— Header (NITJAA-style navy bar) —— */}
      <header className="landing-nitj-header fixed left-0 right-0 top-0 z-50">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-white p-1 shadow-sm">
              <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-nitj-navy text-[9px] font-bold leading-tight text-nitj-navy">
                ECE
              </div>
            </div>
            <span className="hidden text-sm font-semibold text-white sm:inline">
              ECE Alumni · NIT Jalandhar
            </span>
          </div>
          <nav className="hidden flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-1 lg:flex xl:gap-x-6">
            <NavLink href="#top">Home</NavLink>
            <NavLink href="#department">Department</NavLink>
            <NavLink href="#gallery">Events</NavLink>
            <NavLink href="#impact">Impact</NavLink>
            <NavLink href="#timeline">News</NavLink>
            <NavLink href="#footer-contact">Contact</NavLink>
          </nav>
          <Link to="/login" className="landing-nitj-login-btn shrink-0">
            Login
          </Link>
        </div>
      </header>

      {/* —— Hero carousel area —— */}
      <section id="top" className="relative mt-[60px] bg-nitj-navy">
        <div className="relative aspect-[21/9] min-h-[220px] w-full overflow-hidden sm:min-h-[280px] md:min-h-[360px] lg:min-h-[420px]">
          {heroYoutubeSrc ? (
            <iframe
              title="Hero video"
              src={heroYoutubeSrc}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : landing.heroVideoUrl ? (
            <video
              src={landing.heroVideoUrl}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : landing.heroImageUrl ? (
            <img src={landing.heroImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[280px] w-full items-center justify-center bg-gradient-to-br from-nitj-navy via-nitj-navy-light to-nitj-navy px-6 text-center">
              {loading ? (
                <p className="text-white/60">Loading…</p>
              ) : (
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    {landing.heroBadge}
                  </p>
                  <h1 className="mt-4 font-nitj text-2xl font-bold text-white md:text-4xl">
                    {landing.heroTitle}
                  </h1>
                  <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 md:text-lg">
                    {landing.heroSubtitle}
                  </p>
                </div>
              )}
            </div>
          )}
          {(landing.heroImageUrl || landing.heroVideoUrl || heroYoutubeSrc) && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-nitj-navy/75 via-transparent to-transparent" />
          )}
          {(landing.heroImageUrl || landing.heroVideoUrl || heroYoutubeSrc) && !loading && (
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-16 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                {landing.heroBadge}
              </p>
              <h1 className="mt-2 font-nitj text-2xl font-bold text-white md:text-4xl">
                {landing.heroTitle}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 md:text-base">
                {landing.heroSubtitle}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link to="/register" className="landing-nitj-login-btn">
                  Join the platform
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Log in
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* —— Three-column main (Quick Links · Events · News) —— */}
      <section className="border-b border-nitj-border bg-nitj-panel py-10 md:py-12">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:gap-6">
          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h2 className="landing-nitj-section-title mb-4">Quick Links</h2>
            <ul className="space-y-2">
              <li>
                <Link to="/register" className="landing-nitj-quick-link landing-nitj-quick-link--active">
                  <span className="flex items-center gap-2">
                    <span aria-hidden>👤</span>
                    Registration
                  </span>
                  <span className="text-nitj-link">→</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="landing-nitj-quick-link">
                  <span>Log in</span>
                  <span className="text-nitj-link">→</span>
                </Link>
              </li>
              <li>
                <a href="#impact" className="landing-nitj-quick-link">
                  <span className="flex items-center gap-2">
                    <span aria-hidden>✨</span>
                    Impact Stories
                  </span>
                  <span className="text-gray-400">▾</span>
                </a>
              </li>
              <li>
                <a href="#department" className="landing-nitj-quick-link">
                  <span>Department</span>
                  <span className="text-nitj-link">→</span>
                </a>
              </li>
              <li>
                <a href="#gallery" className="landing-nitj-quick-link">
                  <span>Campus &amp; community</span>
                  <span className="text-nitj-link">→</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Recent Events */}
          <div className="lg:col-span-6">
            <h2 className="landing-nitj-section-title mb-4 text-center lg:text-left">
              Recent Events
            </h2>
            {currentEvent ? (
              <div className="relative">
                <div className="landing-nitj-event-card">
                  {currentEvent.kind === "video" && currentEvent.url ? (
                    <video
                      src={currentEvent.url}
                      controls
                      className="aspect-video w-full bg-black object-cover"
                      playsInline
                    />
                  ) : currentEvent.url ? (
                    <img
                      src={currentEvent.url}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-nitj-news text-gray-500">
                      No image
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-nitj text-base font-bold text-nitj-navy">
                      {currentEvent.caption || "Event"}
                    </h3>
                    {currentEvent.meta ? (
                      <p className="mt-1 text-xs text-gray-500">{currentEvent.meta}</p>
                    ) : null}
                    {currentEvent.description ? (
                      <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                        {currentEvent.description}
                      </p>
                    ) : null}
                    <a href="#gallery" className="landing-nitj-link mt-auto pt-3">
                      Read More →
                    </a>
                  </div>
                </div>
                {eventCount > 1 && (
                  <div className="mt-3 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => goEvent(-1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-nitj-border bg-white text-nitj-navy hover:border-nitj-link"
                      aria-label="Previous event"
                    >
                      ‹
                    </button>
                    <span className="text-xs text-gray-500">
                      {safeEventIndex + 1} / {eventCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => goEvent(1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-nitj-border bg-white text-nitj-navy hover:border-nitj-link"
                      aria-label="Next event"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-nitj-border bg-white p-8 text-center text-sm text-gray-500">
                Add gallery or spotlight entries in Admin → Landing page.
              </div>
            )}
          </div>

          {/* News */}
          <div className="lg:col-span-3">
            <h2 className="landing-nitj-section-title mb-4">News</h2>
            <Link
              to="/register"
              className="mb-4 inline-flex w-full items-center justify-center rounded-full bg-nitj-navy px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-nitj-navy-light"
            >
              GIVING BACK ✨
            </Link>
            <ul className="space-y-2">
              {newsItems.length === 0 ? (
                <li className="landing-nitj-news-item text-gray-500">
                  Add timeline entries in Admin → Landing page.
                </li>
              ) : (
                newsItems.map((t, i) => (
                  <li key={`${t.year}-${i}`}>
                    <a href="#timeline" className="landing-nitj-news-item block transition hover:bg-[#dceaf5]">
                      <span className="font-medium text-nitj-navy">{t.title}</span>
                      {t.year ? (
                        <span className="mt-0.5 block text-xs text-gray-500">{t.year}</span>
                      ) : null}
                    </a>
                  </li>
                ))
              )}
            </ul>
            {timeline.length > 0 && (
              <a href="#timeline" className="landing-nitj-link mt-4 inline-block">
                View All →
              </a>
            )}
          </div>
        </div>
      </section>

      {/* —— NIT Jalandhar —— */}
      <section className="border-b border-nitj-border bg-white py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
            <ScrollSection>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nitj-link">
                Institute
              </p>
              <h2 className="mt-3 font-nitj text-2xl font-bold leading-tight text-nitj-navy md:text-4xl">
                Dr B R Ambedkar National Institute of Technology Jalandhar
              </h2>
              <p className="mt-5 text-base leading-relaxed text-gray-600 md:text-lg">
                NIT Jalandhar is one of India’s National Institutes of Technology—an Institute of
                National Importance shaping engineers who lead in research, industry, and public
                service. Its vibrant campus in Punjab blends rigorous academics with student life,
                clubs, and national-level events.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Est. 1987 (as REC)", "Deemed NIT · 2002", "Jalandhar, Punjab", "INI status"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-nitj-border bg-nitj-panel px-3 py-1.5 text-xs font-medium text-nitj-navy"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </ScrollSection>
            <div className="grid gap-4 sm:grid-cols-2">
              <ScrollSection delayMs={80} className="rounded-lg border border-nitj-border bg-nitj-panel p-6 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-nitj-link">
                  Why it matters
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-base">
                  NITJ’s alumni network spans global tech, hardware, and research. MentorBridge
                  extends that corridor online—so today’s ECE students can learn directly from
                  graduates who’ve already walked the path.
                </p>
              </ScrollSection>
              <ScrollSection delayMs={120} className="rounded-lg border border-nitj-border bg-white p-6 text-center shadow-sm">
                <p className="font-nitj text-3xl font-bold text-nitj-navy md:text-4xl">31</p>
                <p className="mt-2 text-sm text-gray-500">NITs across India in the same national family</p>
              </ScrollSection>
              <ScrollSection delayMs={160} className="rounded-lg border border-nitj-border bg-white p-6 text-center shadow-sm">
                <p className="font-nitj text-3xl font-bold text-nitj-navy md:text-4xl">∞</p>
                <p className="mt-2 text-sm text-gray-500">
                  Connections possible when community meets intent
                </p>
              </ScrollSection>
            </div>
          </div>
        </div>
      </section>

      {/* —— Department (admin-managed) —— */}
      <section id="department" className="border-b border-nitj-border bg-nitj-panel py-14 md:py-20">
        <div
          className={`mx-auto px-4 sm:px-6 ${landing.departmentImageUrl ? "grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center" : "max-w-5xl"}`}
        >
          <div className={landing.departmentImageUrl ? "min-w-0" : ""}>
            <ScrollSection>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] text-nitj-link ${landing.departmentImageUrl ? "text-left" : "text-center"}`}
              >
                {landing.departmentEyebrow || "Department"}
              </p>
              <h2
                className={`mt-3 font-nitj text-2xl font-bold leading-tight text-nitj-navy md:text-4xl ${landing.departmentImageUrl ? "text-left" : "mx-auto text-center"}`}
              >
                {landing.departmentTitle ||
                  "Where rigorous curriculum meets open-ended possibility."}
              </h2>
            </ScrollSection>
            <div
              className={`mx-auto mt-8 max-w-3xl space-y-5 text-base leading-relaxed text-gray-600 md:text-lg ${landing.departmentImageUrl ? "text-left" : "text-center"}`}
            >
              {deptParas.length > 0 ? (
                deptParas.map((p, i) => (
                  <ScrollSection key={i} delayMs={i * 90}>
                    <p>{p}</p>
                  </ScrollSection>
                ))
              ) : (
                <ScrollSection>
                  <p>{landing.departmentBody}</p>
                </ScrollSection>
              )}
            </div>
            <ScrollSection className={`mt-8 ${landing.departmentImageUrl ? "text-left" : "text-center"}`}>
              <p className="text-sm font-medium text-nitj-navy/70 md:text-base">
                {landing.departmentHighlight}
              </p>
            </ScrollSection>
          </div>
          {landing.departmentImageUrl ? (
            <ScrollSection className="min-w-0">
              <div className="overflow-hidden rounded-lg border border-nitj-border bg-white shadow-md">
                <img
                  src={landing.departmentImageUrl}
                  alt=""
                  className="aspect-[4/3] w-full object-cover md:aspect-auto md:min-h-[320px]"
                />
              </div>
            </ScrollSection>
          ) : null}
        </div>
      </section>

      {/* —— Gallery —— */}
      {gallery.length > 0 ? (
        <section id="gallery" className="border-b border-nitj-border bg-white py-14 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <ScrollSection className="text-center">
              <h2 className="landing-nitj-section-title text-3xl">Campus &amp; community</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500 md:text-base">
                Moments and media from the department — curated from the admin console.
              </p>
            </ScrollSection>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item, i) => (
                <ScrollSection key={`${item.url}-${i}`} delayMs={(i % 3) * 80}>
                  <figure className="landing-nitj-event-card">
                    {item.kind === "video" ? (
                      <video
                        src={item.url}
                        controls
                        className="aspect-video w-full bg-black object-cover"
                        playsInline
                      />
                    ) : (
                      <img src={item.url} alt="" className="aspect-video w-full object-cover" />
                    )}
                    {item.caption ? (
                      <figcaption className="border-t border-nitj-border px-4 py-3 text-sm text-gray-600">
                        {item.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                </ScrollSection>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* —— Stats (footer-style band) —— */}
      <section className="border-b border-white/10 bg-nitj-navy py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-white/80">
            Alumni Network
          </p>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
            {stats.slice(0, 3).map((s, i) => (
              <ScrollSection key={`${s.label}-${i}`} delayMs={i * 100} className="text-center">
                <p className="font-nitj text-4xl font-bold text-white md:text-5xl">{s.value}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-white/70">
                  {s.label}
                </p>
                <p className="mt-1 text-sm text-white/55">{s.sublabel}</p>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* —— Impact / spotlights —— */}
      <section id="impact" className="border-b border-nitj-border bg-nitj-panel py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollSection className="text-center">
            <h2 className="landing-nitj-section-title text-3xl">
              {landing.impactTitle || "People who carry the department forward"}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-gray-600 md:text-lg">
              {landing.impactSubtitle}
            </p>
          </ScrollSection>

          <div className="mt-12 space-y-6">
            {spotlights.length === 0 ? (
              <ScrollSection className="rounded-lg border border-dashed border-nitj-border bg-white p-8 text-center text-gray-500">
                Content for this section can be added in Admin → Landing page.
              </ScrollSection>
            ) : (
              spotlights.map((sp, i) => (
                <ScrollSection
                  key={`${sp.name}-${i}`}
                  delayMs={(i % 3) * 100}
                  className="overflow-hidden rounded-lg border border-nitj-border bg-white shadow-sm"
                >
                  <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                    <div
                      className={`relative flex min-h-[220px] flex-col justify-end p-8 text-white md:min-h-full md:justify-center md:p-10 ${
                        sp.imageUrl
                          ? "bg-nitj-navy bg-cover bg-center"
                          : "bg-gradient-to-br from-nitj-navy to-nitj-navy-light"
                      }`}
                      style={
                        sp.imageUrl ? { backgroundImage: `url(${sp.imageUrl})` } : undefined
                      }
                    >
                      {sp.imageUrl ? (
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-nitj-navy/95 via-nitj-navy/60 to-nitj-navy/30"
                          aria-hidden
                        />
                      ) : null}
                      <div className="relative z-10">
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-xl font-bold">
                          {sp.name?.charAt(0) || "?"}
                        </div>
                        <p className="mt-5 text-xl font-semibold">{sp.name}</p>
                        <p className="mt-1 text-sm text-white/75">{sp.role}</p>
                        <p className="mt-2 text-sm font-medium text-sky-200">{sp.company}</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center border-t border-nitj-border p-8 md:border-l md:border-t-0 md:p-10">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-nitj-link">
                        Contribution
                      </p>
                      <p className="mt-4 text-base leading-relaxed text-gray-600 md:text-lg">
                        {sp.contribution}
                      </p>
                    </div>
                  </div>
                </ScrollSection>
              ))
            )}
          </div>
        </div>
      </section>

      {/* —— Timeline —— */}
      <section id="timeline" className="border-b border-nitj-border bg-white py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ScrollSection className="text-center">
            <h2 className="landing-nitj-section-title text-3xl">
              {landing.timelineTitle || "A short arc of impact"}
            </h2>
            <p className="mt-3 text-sm text-gray-500 md:text-base">
              {landing.timelineSubtitle ||
                "How the department’s story reads when you scroll through decades."}
            </p>
          </ScrollSection>
          <div className="relative mt-12 space-y-0">
            <div className="absolute bottom-2 left-[11px] top-2 w-px bg-nitj-border md:left-4" />
            {timeline.length === 0 ? (
              <ScrollSection className="pl-10 text-gray-500">
                Add timeline entries from the admin panel.
              </ScrollSection>
            ) : (
              timeline.map((t, i) => (
                <ScrollSection
                  key={`${t.year}-${i}`}
                  delayMs={i * 120}
                  className="relative pb-12 pl-10 last:pb-0 md:pl-14"
                >
                  <div className="absolute left-0 top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-nitj-navy bg-white md:left-[9px]" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-nitj-link">
                    {t.year}
                  </p>
                  <h3 className="mt-2 font-nitj text-lg font-bold text-nitj-navy md:text-xl">
                    {t.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-gray-600">{t.description}</p>
                </ScrollSection>
              ))
            )}
          </div>
        </div>
      </section>

      {/* —— Past events / closing CTA —— */}
      <section className="border-b border-nitj-border bg-nitj-panel py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <ScrollSection>
            <h2 className="landing-nitj-section-title text-3xl">Past Events</h2>
            <div className="mx-auto mt-8 max-w-xl rounded-lg border border-nitj-border bg-white px-6 py-8 shadow-sm">
              <p className="font-nitj text-lg font-bold text-nitj-navy">
                {landing.closingTitle || "Start where you are. Reach who came before."}
              </p>
              <p className="mt-3 text-sm text-gray-600 md:text-base">{landing.closingSubtitle}</p>
              <a href="#gallery" className="landing-nitj-link mt-4 inline-block">
                View All Events →
              </a>
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/register" className="landing-nitj-btn-primary min-w-[200px]">
                Create account
              </Link>
              <Link to="/login" className="landing-nitj-btn-outline min-w-[200px]">
                Log in
              </Link>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* —— Footer (NITJAA two-band) —— */}
      <footer id="footer-contact">
        <div className="bg-nitj-navy py-10 text-white md:py-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-white p-1">
                <span className="text-[10px] font-bold text-nitj-navy">ECE</span>
              </div>
              <div>
                <p className="text-sm font-semibold">ECE Alumni Platform</p>
                <p className="text-xs text-white/60">NIT Jalandhar · MentorBridge</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Alumni Network</p>
              <div className="mt-3 flex flex-wrap justify-center gap-6 md:justify-start">
                {stats.slice(0, 3).map((s, i) => (
                  <div key={i}>
                    <p className="text-lg font-bold text-sky-200">{s.value}</p>
                    <p className="text-xs text-white/70">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-sm text-white/80">
              <p>
                <a href="mailto:ece@nitj.ac.in" className="hover:text-white hover:underline">
                  Contact the department
                </a>
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-nitj-border bg-white py-4">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-center text-xs text-gray-500 sm:flex-row sm:px-6 sm:text-left">
            <p>© {new Date().getFullYear()} ECE Alumni Platform · NIT Jalandhar</p>
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-nitj-link">
                Log in
              </Link>
              <Link to="/register" className="hover:text-nitj-link">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
