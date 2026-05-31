import React, { useEffect, useRef, useState } from "react";
import api, { fetchLandingContent, uploadPostMedia } from "../../utils/api";
import { toastSuccess, toastApiError } from "../../utils/toast";
import toast from "react-hot-toast";
import { urlLooksLikeVideoFile, youtubeHeroEmbedSrc } from "../../utils/landingMedia";

const emptyStat = () => ({ label: "", value: "", sublabel: "" });
const emptySpotlight = () => ({
  name: "",
  role: "",
  company: "",
  contribution: "",
  imageUrl: "",
});
const emptyTimeline = () => ({ year: "", title: "", description: "" });
const emptyGalleryItem = () => ({ url: "", kind: "image", caption: "" });

/** Matches public landing layout (NITJAA-style). Order = top-to-bottom on site. */
const SECTIONS = [
  {
    id: "hero",
    label: "Hero banner",
    desc: "Top campus carousel",
    placement: "Full-width image/video under the navy header. Title and Join / Log in buttons overlay the media.",
  },
  {
    id: "gallery",
    label: "Recent events",
    desc: "Carousel + gallery grid",
    placement:
      "Center column “Recent Events” carousel (first item shown; visitors can step through). Same items also appear in “Campus & community” below the department section.",
  },
  {
    id: "timeline",
    label: "News & timeline",
    desc: "Sidebar news + full list",
    placement:
      "Right column “News” shows up to 6 entries (title + year). Full “Timeline” section lists every entry with descriptions.",
  },
  {
    id: "department",
    label: "Department",
    desc: "Story + side image",
    placement: "Light panel after the institute block. Eyebrow, title, body paragraphs, highlight, optional photo.",
  },
  {
    id: "stats",
    label: "Alumni network",
    desc: "3 metrics (navy band)",
    placement:
      "Navy “Alumni Network” band and repeated in the footer. Use short values (e.g. 200+, 2,600+).",
  },
  {
    id: "spotlights",
    label: "Impact stories",
    desc: "Alumni spotlight cards",
    placement:
      "“Impact” section with large cards. If gallery is empty, spotlights also feed the Recent Events carousel.",
  },
  {
    id: "closing",
    label: "Past events & CTA",
    desc: "Closing card + buttons",
    placement:
      "“Past Events” centered card (title + subtitle) and Create account / Log in buttons at the bottom.",
  },
];

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/35 px-3.5 py-2.5 text-[14px] text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-[#1a6bb5]/50 focus:ring-2 focus:ring-[#1a6bb5]/25";
const labelClass = "text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500";

function SectionPlacement({ title, children }) {
  return (
    <div className="rounded-lg border border-[#1a6bb5]/25 bg-[#001a33]/40 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7eb8e8]">
        Where this appears · {title}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">{children}</p>
    </div>
  );
}

function PageLayoutMap() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
        Public page map (NITJAA layout)
      </p>
      <div className="mt-3 space-y-2 text-[12px] text-zinc-400">
        <div className="rounded bg-[#001a33] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-white/90">
          Navy header · Login
        </div>
        <div className="rounded bg-[#002952] px-3 py-6 text-center text-[11px] text-white/70">
          Hero banner (your media + headline)
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded border border-white/10 bg-white/5 px-2 py-3 text-center text-[10px] leading-tight">
            Quick links
            <span className="mt-1 block text-zinc-600">(fixed)</span>
          </div>
          <div className="rounded border border-[#1a6bb5]/40 bg-[#1a6bb5]/10 px-2 py-3 text-center text-[10px] leading-tight text-[#9ec9ef]">
            Recent events
            <span className="mt-1 block text-zinc-500">Gallery</span>
          </div>
          <div className="rounded border border-[#1a6bb5]/40 bg-[#1a6bb5]/10 px-2 py-3 text-center text-[10px] leading-tight text-[#9ec9ef]">
            News
            <span className="mt-1 block text-zinc-500">Timeline</span>
          </div>
        </div>
        <div className="rounded border border-dashed border-white/15 px-3 py-2 text-center text-[10px]">
          Institute (fixed) → Department → Gallery grid → Stats band → Impact → Timeline → Past events → Footer
        </div>
      </div>
    </div>
  );
}

function MediaField({
  label,
  value,
  onChange,
  accept = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime",
  hint,
  onUploadedKind,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const runUpload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadPostMedia([file]);
      if (res.success && res.data?.[0]?.url) {
        onChange(res.data[0].url);
        if (onUploadedKind) {
          const rt = res.data[0].resourceType;
          if (rt === "video") onUploadedKind("video");
          else if (rt === "image") onUploadedKind("image");
        }
      } else {
        toast.error(res.message || "Upload failed.");
      }
    } catch (err) {
      toastApiError(err, "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const isVideoPreview = value && urlLooksLikeVideoFile(value);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <p className={labelClass}>{label}</p>
      {value ? (
        <div className="relative mt-3 aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
          {isVideoPreview ? (
            <video src={value} className="h-full w-full object-cover" muted playsInline controls={false} />
          ) : (
            <img src={value} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-zinc-600">No file selected — upload or paste a URL.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => runUpload(e.target.files?.[0])} />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-[#1a6bb5]/40 bg-[#1a6bb5]/15 px-3 py-2 text-[13px] font-semibold text-[#9ec9ef] transition hover:bg-[#1a6bb5]/25 disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
        <input
          type="url"
          placeholder="https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} min-w-[12rem] flex-1`}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-lg px-3 py-2 text-[13px] font-medium text-red-300 hover:bg-red-500/10"
          >
            Clear
          </button>
        ) : null}
      </div>
      {hint ? <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">{hint}</p> : null}
    </div>
  );
}

const defaultForm = () => ({
  heroTitle: "",
  heroSubtitle: "",
  heroBadge: "",
  heroImageUrl: "",
  heroVideoUrl: "",
  heroYoutubeUrl: "",
  departmentEyebrow: "",
  departmentTitle: "",
  departmentBody: "",
  departmentHighlight: "",
  departmentImageUrl: "",
  gallery: [],
  stats: [emptyStat(), emptyStat(), emptyStat()],
  impactTitle: "",
  impactSubtitle: "",
  spotlights: [emptySpotlight(), emptySpotlight()],
  timelineTitle: "",
  timelineSubtitle: "",
  timeline: [emptyTimeline(), emptyTimeline()],
  closingTitle: "",
  closingSubtitle: "",
});

const LandingPageEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [active, setActive] = useState("hero");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const body = await fetchLandingContent();
        if (!cancelled && body?.success && body.data) {
          const d = body.data;
          setForm({
            heroTitle: d.heroTitle || "",
            heroSubtitle: d.heroSubtitle || "",
            heroBadge: d.heroBadge || "",
            heroImageUrl: d.heroImageUrl || "",
            heroVideoUrl: d.heroVideoUrl || "",
            heroYoutubeUrl: d.heroYoutubeUrl || "",
            departmentEyebrow: d.departmentEyebrow || "",
            departmentTitle: d.departmentTitle || "",
            departmentBody: d.departmentBody || "",
            departmentHighlight: d.departmentHighlight || "",
            departmentImageUrl: d.departmentImageUrl || "",
            gallery:
              Array.isArray(d.gallery) && d.gallery.length
                ? d.gallery.map((g) => ({
                    url: g.url || "",
                    kind: g.kind === "video" ? "video" : "image",
                    caption: g.caption || "",
                  }))
                : [],
            stats:
              Array.isArray(d.stats) && d.stats.length
                ? d.stats.map((s) => ({
                    label: s.label || "",
                    value: s.value || "",
                    sublabel: s.sublabel || "",
                  }))
                : [emptyStat(), emptyStat(), emptyStat()],
            impactTitle: d.impactTitle || "",
            impactSubtitle: d.impactSubtitle || "",
            spotlights:
              Array.isArray(d.spotlights) && d.spotlights.length
                ? d.spotlights.map((s) => ({
                    name: s.name || "",
                    role: s.role || "",
                    company: s.company || "",
                    contribution: s.contribution || "",
                    imageUrl: s.imageUrl || "",
                  }))
                : [emptySpotlight(), emptySpotlight()],
            timelineTitle: d.timelineTitle || "",
            timelineSubtitle: d.timelineSubtitle || "",
            timeline:
              Array.isArray(d.timeline) && d.timeline.length
                ? d.timeline.map((t) => ({
                    year: t.year || "",
                    title: t.title || "",
                    description: t.description || "",
                  }))
                : [emptyTimeline(), emptyTimeline()],
            closingTitle: d.closingTitle || "",
            closingSubtitle: d.closingSubtitle || "",
          });
        }
      } catch (e) {
        toastApiError(e, "Could not load landing content.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/site/landing", {
        landing: {
          heroTitle: form.heroTitle.trim(),
          heroSubtitle: form.heroSubtitle.trim(),
          heroBadge: form.heroBadge.trim(),
          heroImageUrl: form.heroImageUrl.trim(),
          heroVideoUrl: form.heroVideoUrl.trim(),
          heroYoutubeUrl: form.heroYoutubeUrl.trim(),
          departmentEyebrow: form.departmentEyebrow.trim(),
          departmentTitle: form.departmentTitle.trim(),
          departmentBody: form.departmentBody.trim(),
          departmentHighlight: form.departmentHighlight.trim(),
          departmentImageUrl: form.departmentImageUrl.trim(),
          gallery: form.gallery
            .filter((g) => g.url?.trim())
            .map((g) => ({
              url: g.url.trim(),
              kind: g.kind === "video" ? "video" : "image",
              caption: (g.caption || "").trim(),
            })),
          stats: form.stats.filter((s) => s.label?.trim() || s.value?.trim()),
          impactTitle: form.impactTitle.trim(),
          impactSubtitle: form.impactSubtitle.trim(),
          spotlights: form.spotlights.filter((s) => s.name?.trim() || s.contribution?.trim()),
          timelineTitle: form.timelineTitle.trim(),
          timelineSubtitle: form.timelineSubtitle.trim(),
          timeline: form.timeline.filter((t) => t.year?.trim() || t.title?.trim()),
          closingTitle: form.closingTitle.trim(),
          closingSubtitle: form.closingSubtitle.trim(),
        },
      });
      toastSuccess("Saved. Open the home page in a new tab to preview.");
    } catch (err) {
      toastApiError(err, "Could not save landing page.");
    } finally {
      setSaving(false);
    }
  };

  const heroPreviewYoutube = youtubeHeroEmbedSrc(form.heroYoutubeUrl);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[15px] text-zinc-500">
        Loading editor…
      </div>
    );
  }

  const activeSection = SECTIONS.find((s) => s.id === active);

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 lg:flex-row lg:gap-0">
      <aside className="lg:w-60 lg:shrink-0">
        <PageLayoutMap />
        <nav className="mt-4 flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:border-t lg:border-white/10 lg:pt-4">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={`shrink-0 rounded-xl px-3 py-2.5 text-left transition lg:w-full ${
                active === s.id
                  ? "bg-white text-[#001a33] shadow-md"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span className="block text-[14px] font-semibold">{s.label}</span>
              <span className={`mt-0.5 block text-[11px] ${active === s.id ? "text-zinc-600" : "text-zinc-600"}`}>
                {s.desc}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-6 lg:pl-6">
        {activeSection?.placement ? (
          <SectionPlacement title={activeSection.label}>{activeSection.placement}</SectionPlacement>
        ) : null}

        {active === "hero" && (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#001a33]/80 to-zinc-950/80 p-4 ring-1 ring-[#1a6bb5]/15">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9ec9ef]">
                  Live hero preview (public site)
                </p>
                <div className="relative aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
                  {heroPreviewYoutube ? (
                    <iframe
                      title="Preview"
                      src={heroPreviewYoutube}
                      className="pointer-events-none absolute inset-0 h-full w-full scale-[1.02] border-0"
                    />
                  ) : form.heroVideoUrl ? (
                    <video
                      src={form.heroVideoUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      autoPlay
                      loop
                    />
                  ) : form.heroImageUrl ? (
                    <img src={form.heroImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[13px] text-zinc-500">
                      Add YouTube, video, or image
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#001a33]/85 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-center">
                    <p className="truncate text-[10px] font-bold uppercase tracking-wider text-white/70">
                      {form.heroBadge || "Badge"}
                    </p>
                    <p className="mt-1 line-clamp-2 font-serif text-[13px] font-bold text-white">
                      {form.heroTitle || "Headline"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-white/85">
                      {form.heroSubtitle || "Subtitle"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <p className={labelClass}>YouTube (optional — overrides MP4)</p>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={form.heroYoutubeUrl}
                  onChange={(e) => setForm({ ...form, heroYoutubeUrl: e.target.value })}
                  className={inputClass}
                />
                <p className="text-[12px] text-zinc-500">If set, plays behind the hero (muted loop). MP4/WebM below is ignored while this is valid.</p>
              </div>
            </div>

            <MediaField
              label="Hero image (campus photo)"
              value={form.heroImageUrl}
              onChange={(v) => setForm({ ...form, heroImageUrl: v })}
              accept="image/jpeg,image/png,image/gif,image/webp"
              hint="Wide campus shot works best (21:9). Used when no YouTube/video. Also on login/register side panel."
            />
            <MediaField
              label="Hero background video (MP4 / WebM / MOV)"
              value={form.heroVideoUrl}
              onChange={(v) => setForm({ ...form, heroVideoUrl: v })}
              accept="video/mp4,video/webm,video/quicktime"
              hint="Loops muted behind the headline. Ignored if a valid YouTube URL is set."
            />

            <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <p className={labelClass}>Hero text (overlaid on media)</p>
              <input
                placeholder="Badge — e.g. Department of ECE"
                value={form.heroBadge}
                onChange={(e) => setForm({ ...form, heroBadge: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Headline"
                value={form.heroTitle}
                onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                className={inputClass}
              />
              <textarea
                placeholder="Subtitle"
                value={form.heroSubtitle}
                onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                rows={3}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {active === "department" && (
          <div className="space-y-5">
            <p className="text-[13px] text-zinc-500">
              Main department story on a light gray panel. Use a blank line in the body for separate paragraphs.
            </p>
            <MediaField
              label="Department section image"
              value={form.departmentImageUrl}
              onChange={(v) => setForm({ ...form, departmentImageUrl: v })}
              accept="image/jpeg,image/png,image/gif,image/webp"
              hint="Appears beside the department story on large screens."
            />
            <div className="space-y-3">
              <input
                placeholder="Eyebrow"
                value={form.departmentEyebrow}
                onChange={(e) => setForm({ ...form, departmentEyebrow: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Title"
                value={form.departmentTitle}
                onChange={(e) => setForm({ ...form, departmentTitle: e.target.value })}
                className={inputClass}
              />
              <textarea
                placeholder="Body — blank line between paragraphs"
                value={form.departmentBody}
                onChange={(e) => setForm({ ...form, departmentBody: e.target.value })}
                rows={7}
                className={inputClass}
              />
              <input
                placeholder="Highlight line"
                value={form.departmentHighlight}
                onChange={(e) => setForm({ ...form, departmentHighlight: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {active === "gallery" && (
          <div className="space-y-4">
            <p className="text-[13px] leading-relaxed text-zinc-500">
              Each item powers the <strong className="text-zinc-300">Recent Events</strong> carousel (caption = event
              title). Order matters: item 1 shows first. Add up to 12 entries.
            </p>
            {form.gallery.map((g, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-zinc-500">
                    Event {i + 1}
                    {i === 0 ? (
                      <span className="ml-2 rounded bg-[#1a6bb5]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#9ec9ef]">
                        Carousel default
                      </span>
                    ) : null}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={g.kind}
                      onChange={(e) => {
                        const gallery = [...form.gallery];
                        gallery[i] = { ...gallery[i], kind: e.target.value };
                        setForm({ ...form, gallery });
                      }}
                      className={`${inputClass} w-auto py-2`}
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                    <button
                      type="button"
                      className="text-[12px] font-semibold text-red-400 hover:underline"
                      onClick={() => setForm({ ...form, gallery: form.gallery.filter((_, j) => j !== i) })}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <MediaField
                  label="Media URL"
                  value={g.url}
                  onChange={(v) => setForm({ ...form, gallery: form.gallery.map((row, j) => (j === i ? { ...row, url: v } : row)) })}
                  accept={g.kind === "video" ? "video/mp4,video/webm,video/quicktime,image/*" : "image/*,video/mp4,video/webm,video/quicktime"}
                  onUploadedKind={(kind) => {
                    const gallery = [...form.gallery];
                    gallery[i] = { ...gallery[i], kind };
                    setForm({ ...form, gallery });
                  }}
                />
                <input
                  type="text"
                  placeholder="Event title (shown on card — e.g. Distinguished Alumni Talk)"
                  value={g.caption}
                  onChange={(e) => {
                    const gallery = [...form.gallery];
                    gallery[i] = { ...gallery[i], caption: e.target.value };
                    setForm({ ...form, gallery });
                  }}
                  className={inputClass}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm({ ...form, gallery: [...form.gallery, emptyGalleryItem()] })}
              disabled={form.gallery.length >= 12}
              className="rounded-xl border border-dashed border-[#1a6bb5]/40 px-4 py-3 text-[14px] font-semibold text-[#9ec9ef] transition hover:bg-[#1a6bb5]/10 disabled:opacity-40"
            >
              + Add event / gallery item
            </button>
          </div>
        )}

        {active === "stats" && (
          <div className="space-y-4">
            <p className="text-[13px] text-zinc-500">
              Three metrics in the navy <strong className="text-zinc-300">Alumni Network</strong> band and footer (e.g.{" "}
              <em>200+</em> Events, <em>2,600+</em> Members).
            </p>
            <div className="grid gap-4 md:grid-cols-3">
            {form.stats.map((s, i) => (
              <div key={i} className="rounded-2xl border border-[#001a33]/50 bg-[#001a33]/30 p-4 space-y-2">
                <span className="text-[11px] font-bold text-[#9ec9ef]">Metric {i + 1}</span>
                <input
                  placeholder="Value — e.g. 200+ or Live"
                  value={s.value}
                  onChange={(e) => {
                    const stats = [...form.stats];
                    stats[i] = { ...stats[i], value: e.target.value };
                    setForm({ ...form, stats });
                  }}
                  className={inputClass}
                />
                <input
                  placeholder="Label"
                  value={s.label}
                  onChange={(e) => {
                    const stats = [...form.stats];
                    stats[i] = { ...stats[i], label: e.target.value };
                    setForm({ ...form, stats });
                  }}
                  className={inputClass}
                />
                <input
                  placeholder="Sublabel"
                  value={s.sublabel}
                  onChange={(e) => {
                    const stats = [...form.stats];
                    stats[i] = { ...stats[i], sublabel: e.target.value };
                    setForm({ ...form, stats });
                  }}
                  className={inputClass}
                />
              </div>
            ))}
            </div>
          </div>
        )}

        {active === "spotlights" && (
          <div className="space-y-4">
            <p className="text-[13px] text-zinc-500">
              Large cards in the <strong className="text-zinc-300">Impact stories</strong> section. Used as Recent Events
              fallback only when no gallery items exist.
            </p>
            <input
              placeholder="Section title — e.g. People who carry the department forward"
              value={form.impactTitle}
              onChange={(e) => setForm({ ...form, impactTitle: e.target.value })}
              className={inputClass}
            />
            <textarea
              placeholder="Section subtitle"
              value={form.impactSubtitle}
              onChange={(e) => setForm({ ...form, impactSubtitle: e.target.value })}
              rows={2}
              className={inputClass}
            />
            {form.spotlights.map((sp, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-[11px] font-bold text-zinc-500">Spotlight {i + 1}</span>
                  <button
                    type="button"
                    className="text-[12px] text-red-400 hover:underline"
                    onClick={() => setForm({ ...form, spotlights: form.spotlights.filter((_, j) => j !== i) })}
                  >
                    Remove
                  </button>
                </div>
                <MediaField
                  label="Card photo (optional)"
                  value={sp.imageUrl}
                  onChange={(v) => {
                    const spotlights = [...form.spotlights];
                    spotlights[i] = { ...spotlights[i], imageUrl: v };
                    setForm({ ...form, spotlights });
                  }}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  hint="Full-bleed background on the left column of the card."
                />
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    placeholder="Name"
                    value={sp.name}
                    onChange={(e) => {
                      const spotlights = [...form.spotlights];
                      spotlights[i] = { ...spotlights[i], name: e.target.value };
                      setForm({ ...form, spotlights });
                    }}
                    className={inputClass}
                  />
                  <input
                    placeholder="Role"
                    value={sp.role}
                    onChange={(e) => {
                      const spotlights = [...form.spotlights];
                      spotlights[i] = { ...spotlights[i], role: e.target.value };
                      setForm({ ...form, spotlights });
                    }}
                    className={inputClass}
                  />
                  <input
                    placeholder="Company"
                    value={sp.company}
                    onChange={(e) => {
                      const spotlights = [...form.spotlights];
                      spotlights[i] = { ...spotlights[i], company: e.target.value };
                      setForm({ ...form, spotlights });
                    }}
                    className={`${inputClass} md:col-span-2`}
                  />
                  <textarea
                    placeholder="Story"
                    value={sp.contribution}
                    onChange={(e) => {
                      const spotlights = [...form.spotlights];
                      spotlights[i] = { ...spotlights[i], contribution: e.target.value };
                      setForm({ ...form, spotlights });
                    }}
                    rows={3}
                    className={`${inputClass} md:col-span-2`}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm({ ...form, spotlights: [...form.spotlights, emptySpotlight()] })}
              className="text-[14px] font-semibold text-[#9ec9ef] hover:underline"
            >
              + Add impact story
            </button>
          </div>
        )}

        {active === "timeline" && (
          <div className="space-y-4">
            <p className="text-[13px] text-zinc-500">
              <strong className="text-zinc-300">News column:</strong> first 6 entries (title + year).{" "}
              <strong className="text-zinc-300">Timeline section:</strong> all entries with full description.
            </p>
            <input
              placeholder="Timeline section title — e.g. A short arc of impact"
              value={form.timelineTitle}
              onChange={(e) => setForm({ ...form, timelineTitle: e.target.value })}
              className={inputClass}
            />
            <textarea
              placeholder="Section subtitle"
              value={form.timelineSubtitle}
              onChange={(e) => setForm({ ...form, timelineSubtitle: e.target.value })}
              rows={2}
              className={inputClass}
            />
            {form.timeline.map((t, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[11px] font-bold text-zinc-500">
                    News / timeline {i + 1}
                    {i < 6 ? (
                      <span className="ml-2 text-[10px] font-normal text-[#9ec9ef]">· visible in News sidebar</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    className="text-[12px] text-red-400 hover:underline"
                    onClick={() => setForm({ ...form, timeline: form.timeline.filter((_, j) => j !== i) })}
                  >
                    Remove
                  </button>
                </div>
                <input
                  placeholder="Year / era"
                  value={t.year}
                  onChange={(e) => {
                    const timeline = [...form.timeline];
                    timeline[i] = { ...timeline[i], year: e.target.value };
                    setForm({ ...form, timeline });
                  }}
                  className={inputClass}
                />
                <input
                  placeholder="Headline — shown in News sidebar"
                  value={t.title}
                  onChange={(e) => {
                    const timeline = [...form.timeline];
                    timeline[i] = { ...timeline[i], title: e.target.value };
                    setForm({ ...form, timeline });
                  }}
                  className={inputClass}
                />
                <textarea
                  placeholder="Description"
                  value={t.description}
                  onChange={(e) => {
                    const timeline = [...form.timeline];
                    timeline[i] = { ...timeline[i], description: e.target.value };
                    setForm({ ...form, timeline });
                  }}
                  rows={2}
                  className={inputClass}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm({ ...form, timeline: [...form.timeline, emptyTimeline()] })}
              className="text-[14px] font-semibold text-[#9ec9ef] hover:underline"
            >
              + Add news / timeline entry
            </button>
          </div>
        )}

        {active === "closing" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-nitj-border bg-[#f4f6f8] p-6 text-center text-[#001a33] shadow-inner ring-1 ring-white/10">
              <p className="font-serif text-lg font-bold">{form.closingTitle || "Past Events title"}</p>
              <p className="mt-2 text-sm text-gray-600">{form.closingSubtitle || "Subtitle preview"}</p>
              <p className="mt-3 text-xs text-[#1a6bb5]">View All Events →</p>
            </div>
            <input
              placeholder="Past Events card title"
              value={form.closingTitle}
              onChange={(e) => setForm({ ...form, closingTitle: e.target.value })}
              className={inputClass}
            />
            <textarea
              placeholder="Past Events card subtitle"
              value={form.closingSubtitle}
              onChange={(e) => setForm({ ...form, closingSubtitle: e.target.value })}
              rows={3}
              className={inputClass}
            />
            <p className="text-[12px] text-zinc-500">
              Create account and Log in buttons below this card are fixed links — not editable here.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#001a33] px-6 py-3 text-[15px] font-bold text-white shadow-lg transition hover:bg-[#002952] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save landing page"}
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-[#1a6bb5]/35 bg-[#1a6bb5]/10 px-5 py-3 text-[14px] font-semibold text-[#9ec9ef] transition hover:bg-[#1a6bb5]/20"
          >
            Preview public site ↗
          </a>
        </div>
      </div>
    </form>
  );
};

export default LandingPageEditor;
