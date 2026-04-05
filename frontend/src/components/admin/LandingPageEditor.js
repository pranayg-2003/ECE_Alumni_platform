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

const SECTIONS = [
  { id: "hero", label: "Hero", desc: "Headline, media, YouTube" },
  { id: "department", label: "Department", desc: "Copy + side image" },
  { id: "gallery", label: "Gallery", desc: "Images & videos" },
  { id: "stats", label: "Stats", desc: "Three metrics" },
  { id: "spotlights", label: "Spotlights", desc: "Alumni cards + photos" },
  { id: "timeline", label: "Timeline", desc: "Milestones" },
  { id: "closing", label: "Closing", desc: "Final CTA" },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/35 px-3.5 py-2.5 text-[14px] text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/25";
const labelClass = "text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500";

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
          className="rounded-lg border border-cyan-500/35 bg-cyan-500/15 px-3 py-2 text-[13px] font-semibold text-cyan-200 transition hover:bg-cyan-500/25 disabled:opacity-50"
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

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 lg:flex-row lg:gap-0">
      <nav className="flex gap-1 overflow-x-auto pb-1 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:border-r lg:border-white/10 lg:pr-4 lg:pb-0">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={`shrink-0 rounded-xl px-3 py-2.5 text-left transition lg:w-full ${
              active === s.id
                ? "bg-white text-zinc-900 shadow-md"
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

      <div className="min-w-0 flex-1 space-y-6 lg:pl-6">
        {active === "hero" && (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-cyan-950/40 to-zinc-950/80 p-4 ring-1 ring-cyan-500/10">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-cyan-400/90">Live hero preview</p>
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
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <p className="truncate text-[10px] font-bold uppercase tracking-wider text-white/60">
                      {form.heroBadge || "Badge"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] font-semibold text-white">{form.heroTitle || "Headline"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <p className={labelClass}>YouTube (optional)</p>
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
              label="Hero image (fallback / poster)"
              value={form.heroImageUrl}
              onChange={(v) => setForm({ ...form, heroImageUrl: v })}
              accept="image/jpeg,image/png,image/gif,image/webp"
              hint="Shown when no video, under YouTube, or as texture on auth pages."
            />
            <MediaField
              label="Hero background video (MP4 / WebM / MOV)"
              value={form.heroVideoUrl}
              onChange={(v) => setForm({ ...form, heroVideoUrl: v })}
              accept="video/mp4,video/webm,video/quicktime"
              hint="Loops muted on the public home hero. Upload up to ~45MB per file."
            />

            <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
              <p className={labelClass}>Copy</p>
              <input
                placeholder="Badge / eyebrow"
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
              Add up to 12 tiles. Use images for photos and video for hosted MP4/WebM (e.g. Cloudinary). Captions are optional.
            </p>
            {form.gallery.map((g, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-zinc-500">Item {i + 1}</span>
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
                  placeholder="Caption (optional)"
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
              className="rounded-xl border border-dashed border-cyan-500/40 px-4 py-3 text-[14px] font-semibold text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-40"
            >
              + Add gallery item
            </button>
          </div>
        )}

        {active === "stats" && (
          <div className="grid gap-4 md:grid-cols-3">
            {form.stats.map((s, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                <span className="text-[11px] font-bold text-zinc-500">Stat {i + 1}</span>
                <input
                  placeholder="Value"
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
        )}

        {active === "spotlights" && (
          <div className="space-y-4">
            <input
              placeholder="Section title"
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
              className="text-[14px] font-semibold text-cyan-400 hover:underline"
            >
              + Add spotlight
            </button>
          </div>
        )}

        {active === "timeline" && (
          <div className="space-y-4">
            <input
              placeholder="Section title"
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
                  <span className="text-[11px] font-bold text-zinc-500">Entry {i + 1}</span>
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
                  placeholder="Title"
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
              className="text-[14px] font-semibold text-cyan-400 hover:underline"
            >
              + Add timeline entry
            </button>
          </div>
        )}

        {active === "closing" && (
          <div className="space-y-3">
            <input
              placeholder="Title"
              value={form.closingTitle}
              onChange={(e) => setForm({ ...form, closingTitle: e.target.value })}
              className={inputClass}
            />
            <textarea
              placeholder="Subtitle"
              value={form.closingSubtitle}
              onChange={(e) => setForm({ ...form, closingSubtitle: e.target.value })}
              rows={3}
              className={inputClass}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-[15px] font-bold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save all changes"}
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-white/15 px-5 py-3 text-[14px] font-semibold text-zinc-300 transition hover:bg-white/[0.06]"
          >
            Open home page ↗
          </a>
        </div>
      </div>
    </form>
  );
};

export default LandingPageEditor;
