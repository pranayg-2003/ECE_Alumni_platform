import React from "react";
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

const LandingPage = () => {
  const { landing, loading } = useLandingContent();

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

  return (
    <div className="bg-black text-white">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-white to-white/85 text-sm font-bold tracking-tight text-black shadow-lg shadow-black/20">
              MB
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white/95">
              MentorBridge
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-white/90 transition hover:text-white"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* —— Hero —— */}
      <section className="landing-hero-mesh relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pt-24 text-center">
        <div className="absolute inset-0 z-0">
          {heroYoutubeSrc ? (
            <iframe
              title="Hero video"
              src={heroYoutubeSrc}
              className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.77vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0 opacity-95"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : landing.heroVideoUrl ? (
            <video
              src={landing.heroVideoUrl}
              className="absolute inset-0 h-full w-full object-cover object-center"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : landing.heroImageUrl ? (
            <img
              src={landing.heroImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : null}
        </div>
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.45)_55%,#000_100%)]" />
        <div className="relative z-10 max-w-4xl">
          {loading ? (
            <p className="text-white/50">Loading…</p>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                {landing.heroBadge}
              </p>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-6xl md:leading-[1.05]">
                {landing.heroTitle}
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-lg font-medium leading-relaxed text-white/75 md:text-xl md:leading-relaxed">
                {landing.heroSubtitle}
              </p>
              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-white px-8 py-3.5 text-base font-semibold text-black transition hover:bg-white/90"
                >
                  Join the platform
                </Link>
                <Link
                  to="/login"
                  className="inline-flex min-w-[200px] items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Log in
                </Link>
              </div>
            </>
          )}
        </div>
        <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 animate-bounce text-white/40">
          <span className="text-2xl" aria-hidden>
            ↓
          </span>
        </div>
      </section>

      {/* —— NIT Jalandhar —— */}
      <section className="relative overflow-hidden border-y border-white/10 bg-gradient-to-b from-[#0a0a0c] via-[#111113] to-black py-20 md:py-28">
        <div className="pointer-events-none absolute -left-32 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[#0071e3]/[0.12] blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-6xl px-5">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2997ff]/90">
                Institute
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl md:leading-[1.08]">
                Dr B R Ambedkar National Institute of Technology Jalandhar
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-white/72 md:text-xl md:leading-relaxed">
                NIT Jalandhar is one of India’s National Institutes of Technology—an Institute of National Importance
                shaping engineers who lead in research, industry, and public service. Its vibrant campus in Punjab
                blends rigorous academics with student life, clubs, and national-level events.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Est. 1987 (as REC)", "Deemed NIT · 2002", "Jalandhar, Punjab", "INI status"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-white/85 backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 backdrop-blur-md md:col-span-2 md:p-8">
                <p className="text-sm font-semibold uppercase tracking-wider text-[#7dd3fc]">Why it matters</p>
                <p className="mt-3 text-base leading-relaxed text-white/75 md:text-lg">
                  NITJ’s alumni network spans global tech, hardware, and research. MentorBridge extends that corridor
                  online—so today’s ECE students can learn directly from graduates who’ve already walked the path.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
                <p className="text-3xl font-semibold text-white md:text-4xl">31</p>
                <p className="mt-2 text-sm font-medium text-white/55">NITs across India in the same national family</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
                <p className="text-3xl font-semibold text-white md:text-4xl">∞</p>
                <p className="mt-2 text-sm font-medium text-white/55">Connections possible when community meets intent</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* —— Department —— light panel like Apple product pages */}
      <section className="bg-[#f5f5f7] py-28 text-black md:py-36">
        <div
          className={`mx-auto px-5 ${landing.departmentImageUrl ? "grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center" : "max-w-5xl"}`}
        >
          <div className={landing.departmentImageUrl ? "min-w-0" : ""}>
            <ScrollSection>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.25em] text-black/45 ${landing.departmentImageUrl ? "text-left" : "text-center"}`}
              >
                {landing.departmentEyebrow || "Department"}
              </p>
              <h2
                className={`mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl md:leading-[1.08] ${landing.departmentImageUrl ? "text-left" : "mx-auto text-center"}`}
              >
                {landing.departmentTitle ||
                  "Where rigorous curriculum meets open-ended possibility."}
              </h2>
            </ScrollSection>
            <div
              className={`mx-auto mt-12 max-w-3xl space-y-6 text-lg leading-relaxed text-black/70 md:text-xl md:leading-relaxed ${landing.departmentImageUrl ? "text-left" : "text-center"}`}
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
            <ScrollSection className={`mt-14 ${landing.departmentImageUrl ? "text-left" : "text-center"}`}>
              <p className="text-sm font-medium text-black/50 md:text-base">{landing.departmentHighlight}</p>
            </ScrollSection>
          </div>
          {landing.departmentImageUrl ? (
            <ScrollSection className="min-w-0">
              <div className="overflow-hidden rounded-3xl bg-black/5 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.06]">
                <img
                  src={landing.departmentImageUrl}
                  alt=""
                  className="aspect-[4/3] w-full object-cover object-center md:aspect-auto md:min-h-[320px]"
                />
              </div>
            </ScrollSection>
          ) : null}
        </div>
      </section>

      {/* —— Media gallery (admin-managed) —— */}
      {gallery.length > 0 ? (
        <section className="border-y border-white/10 bg-[#0a0a0c] py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <ScrollSection className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Campus & community</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-white/50 md:text-base">
                Moments and media from the department — curated from the admin console.
              </p>
            </ScrollSection>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item, i) => (
                <ScrollSection key={`${item.url}-${i}`} delayMs={(i % 3) * 80}>
                  <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg">
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
                      <figcaption className="px-4 py-3 text-[14px] leading-snug text-white/65">{item.caption}</figcaption>
                    ) : null}
                  </figure>
                </ScrollSection>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* —— Stats —— */}
      <section className="border-y border-white/10 bg-black py-24 md:py-32">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-5 md:grid-cols-3 md:gap-8">
          {stats.slice(0, 3).map((s, i) => (
            <ScrollSection key={`${s.label}-${i}`} delayMs={i * 100} className="text-center">
              <p className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {s.value}
              </p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-white/50">
                {s.label}
              </p>
              <p className="mt-2 text-sm text-white/55">{s.sublabel}</p>
            </ScrollSection>
          ))}
        </div>
      </section>

      {/* —— Famous alumni / spotlights —— */}
      <section className="bg-[#f5f5f7] py-24 text-black md:py-32">
        <div className="mx-auto max-w-6xl px-5">
          <ScrollSection className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              {landing.impactTitle || "People who carry the department forward"}
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-black/65 md:text-xl">
              {landing.impactSubtitle}
            </p>
          </ScrollSection>

          <div className="mt-16 space-y-6">
            {spotlights.length === 0 ? (
              <ScrollSection className="rounded-3xl bg-white p-8 text-center text-black/50 shadow-sm">
                Content for this section can be added in Admin → Landing page.
              </ScrollSection>
            ) : (
              spotlights.map((sp, i) => (
                <ScrollSection
                  key={`${sp.name}-${i}`}
                  delayMs={(i % 3) * 100}
                  className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)]"
                >
                  <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                    <div
                      className={`relative flex min-h-[220px] flex-col justify-end p-8 text-white md:min-h-full md:justify-center md:p-10 ${
                        sp.imageUrl
                          ? "bg-neutral-900 bg-cover bg-center"
                          : "bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"
                      }`}
                      style={
                        sp.imageUrl
                          ? { backgroundImage: `url(${sp.imageUrl})` }
                          : undefined
                      }
                    >
                      {sp.imageUrl ? (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" aria-hidden />
                      ) : null}
                      <div className="relative z-10">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold backdrop-blur-sm">
                          {sp.name?.charAt(0) || "?"}
                        </div>
                        <p className="mt-6 text-xl font-semibold tracking-tight">{sp.name}</p>
                        <p className="mt-1 text-sm text-white/65">{sp.role}</p>
                        <p className="mt-3 text-sm font-medium text-violet-300">{sp.company}</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center p-8 md:p-10">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/40">
                        Contribution
                      </p>
                      <p className="mt-4 text-lg leading-relaxed text-black/75 md:text-xl md:leading-relaxed">
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
      <section className="bg-black py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-5">
          <ScrollSection className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {landing.timelineTitle || "A short arc of impact"}
            </h2>
            <p className="mt-3 text-sm text-white/45 md:text-base">
              {landing.timelineSubtitle ||
                "How the department’s story reads when you scroll through decades."}
            </p>
          </ScrollSection>
          <div className="relative mt-16 space-y-0">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-white/20 via-white/40 to-white/10 md:left-4" />
            {timeline.length === 0 ? (
              <ScrollSection className="pl-10 text-white/45">
                Add timeline entries from the admin panel.
              </ScrollSection>
            ) : (
              timeline.map((t, i) => (
                <ScrollSection
                  key={`${t.year}-${i}`}
                  delayMs={i * 120}
                  className="relative pl-10 pb-14 last:pb-0 md:pl-14"
                >
                  <div className="absolute left-0 top-1.5 flex h-[11px] w-[11px] items-center justify-center rounded-full border-2 border-white bg-black md:left-[9px] md:h-3 md:w-3" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
                    {t.year}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white md:text-2xl">{t.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-white/65 md:text-lg">
                    {t.description}
                  </p>
                </ScrollSection>
              ))
            )}
          </div>
        </div>
      </section>

      {/* —— Closing CTA —— */}
      <section className="relative overflow-hidden bg-[#f5f5f7] py-28 text-black md:py-36">
        <div className="pointer-events-none absolute -right-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-300/40 to-fuchsia-300/30 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
          <ScrollSection>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl md:leading-tight">
              {landing.closingTitle || "Start where you are. Reach who came before."}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-black/65 md:text-xl">
              {landing.closingSubtitle}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-black px-8 py-3.5 text-base font-semibold text-white transition hover:bg-black/85"
              >
                Create account
              </Link>
              <Link
                to="/login"
                className="inline-flex min-w-[200px] items-center justify-center rounded-full border border-black/15 bg-white px-8 py-3.5 text-base font-semibold text-black transition hover:bg-black/5"
              >
                Log in
              </Link>
            </div>
          </ScrollSection>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black py-10 text-center text-xs text-white/35">
        © {new Date().getFullYear()} MentorBridge · ECE Alumni Platform
      </footer>
    </div>
  );
};

export default LandingPage;
