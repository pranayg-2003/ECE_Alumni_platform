import React, { useEffect, useState } from "react";
import api, { fetchLandingContent } from "../../utils/api";
import { toastSuccess, toastApiError } from "../../utils/toast";

const emptyStat = () => ({ label: "", value: "", sublabel: "" });
const emptySpotlight = () => ({
  name: "",
  role: "",
  company: "",
  contribution: "",
});
const emptyTimeline = () => ({ year: "", title: "", description: "" });

const defaultForm = () => ({
  heroTitle: "",
  heroSubtitle: "",
  heroBadge: "",
  departmentEyebrow: "",
  departmentTitle: "",
  departmentBody: "",
  departmentHighlight: "",
  stats: [emptyStat(), emptyStat(), emptyStat()],
  impactTitle: "",
  impactSubtitle: "",
  spotlights: [emptySpotlight(), emptySpotlight(), emptySpotlight()],
  timelineTitle: "",
  timelineSubtitle: "",
  timeline: [emptyTimeline(), emptyTimeline(), emptyTimeline()],
  closingTitle: "",
  closingSubtitle: "",
});

const LandingPageEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);

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
            departmentEyebrow: d.departmentEyebrow || "",
            departmentTitle: d.departmentTitle || "",
            departmentBody: d.departmentBody || "",
            departmentHighlight: d.departmentHighlight || "",
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
          departmentEyebrow: form.departmentEyebrow.trim(),
          departmentTitle: form.departmentTitle.trim(),
          departmentBody: form.departmentBody.trim(),
          departmentHighlight: form.departmentHighlight.trim(),
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
      toastSuccess("Landing page saved. Refresh the home page to see changes.");
    } catch (err) {
      toastApiError(err, "Could not save landing page.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        Loading editor…
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900">Public landing page</h2>
        <p className="mt-1 text-sm text-slate-500">
          Edits the scroll-based home page at <code className="rounded bg-slate-100 px-1">/</code> and
          the hero panel on login / register.
        </p>
      </div>

      <section className="space-y-3 border-b border-slate-100 pb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Hero</h3>
        <input
          placeholder="Badge / eyebrow"
          value={form.heroBadge}
          onChange={(e) => setForm({ ...form, heroBadge: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Headline"
          value={form.heroTitle}
          onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Subtitle"
          value={form.heroSubtitle}
          onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </section>

      <section className="space-y-3 border-b border-slate-100 pb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Department (light section)
        </h3>
        <input
          placeholder="Small eyebrow, e.g. The department"
          value={form.departmentEyebrow}
          onChange={(e) => setForm({ ...form, departmentEyebrow: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Big title"
          value={form.departmentTitle}
          onChange={(e) => setForm({ ...form, departmentTitle: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Body — use blank lines between paragraphs"
          value={form.departmentBody}
          onChange={(e) => setForm({ ...form, departmentBody: e.target.value })}
          rows={6}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="One-line highlight under paragraphs"
          value={form.departmentHighlight}
          onChange={(e) => setForm({ ...form, departmentHighlight: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </section>

      <section className="space-y-4 border-b border-slate-100 pb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Stats row (3)</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {form.stats.map((s, i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
              <input
                placeholder="Big value"
                value={s.value}
                onChange={(e) => {
                  const stats = [...form.stats];
                  stats[i] = { ...stats[i], value: e.target.value };
                  setForm({ ...form, stats });
                }}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Label"
                value={s.label}
                onChange={(e) => {
                  const stats = [...form.stats];
                  stats[i] = { ...stats[i], label: e.target.value };
                  setForm({ ...form, stats });
                }}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Sublabel"
                value={s.sublabel}
                onChange={(e) => {
                  const stats = [...form.stats];
                  stats[i] = { ...stats[i], sublabel: e.target.value };
                  setForm({ ...form, stats });
                }}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-b border-slate-100 pb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Alumni spotlights</h3>
        <input
          placeholder="Section title"
          value={form.impactTitle}
          onChange={(e) => setForm({ ...form, impactTitle: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Section subtitle"
          value={form.impactSubtitle}
          onChange={(e) => setForm({ ...form, impactSubtitle: e.target.value })}
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <div className="space-y-4">
          {form.spotlights.map((sp, i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-bold text-slate-500">Spotlight {i + 1}</span>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() =>
                    setForm({
                      ...form,
                      spotlights: form.spotlights.filter((_, j) => j !== i),
                    })
                  }
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  placeholder="Name"
                  value={sp.name}
                  onChange={(e) => {
                    const spotlights = [...form.spotlights];
                    spotlights[i] = { ...spotlights[i], name: e.target.value };
                    setForm({ ...form, spotlights });
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Role"
                  value={sp.role}
                  onChange={(e) => {
                    const spotlights = [...form.spotlights];
                    spotlights[i] = { ...spotlights[i], role: e.target.value };
                    setForm({ ...form, spotlights });
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Company"
                  value={sp.company}
                  onChange={(e) => {
                    const spotlights = [...form.spotlights];
                    spotlights[i] = { ...spotlights[i], company: e.target.value };
                    setForm({ ...form, spotlights });
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm md:col-span-2"
                />
                <textarea
                  placeholder="Contribution / story"
                  value={sp.contribution}
                  onChange={(e) => {
                    const spotlights = [...form.spotlights];
                    spotlights[i] = { ...spotlights[i], contribution: e.target.value };
                    setForm({ ...form, spotlights });
                  }}
                  rows={3}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm md:col-span-2"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                spotlights: [...form.spotlights, emptySpotlight()],
              })
            }
            className="text-sm font-semibold text-violet-700"
          >
            + Add spotlight
          </button>
        </div>
      </section>

      <section className="space-y-3 border-b border-slate-100 pb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Timeline</h3>
        <input
          placeholder="Timeline section title"
          value={form.timelineTitle}
          onChange={(e) => setForm({ ...form, timelineTitle: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Timeline section subtitle"
          value={form.timelineSubtitle}
          onChange={(e) => setForm({ ...form, timelineSubtitle: e.target.value })}
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        {form.timeline.map((t, i) => (
          <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs font-bold text-slate-500">Entry {i + 1}</span>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() =>
                  setForm({
                    ...form,
                    timeline: form.timeline.filter((_, j) => j !== i),
                  })
                }
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
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="Title"
              value={t.title}
              onChange={(e) => {
                const timeline = [...form.timeline];
                timeline[i] = { ...timeline[i], title: e.target.value };
                setForm({ ...form, timeline });
              }}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
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
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setForm({
              ...form,
              timeline: [...form.timeline, emptyTimeline()],
            })
          }
          className="text-sm font-semibold text-violet-700"
        >
          + Add timeline entry
        </button>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Closing CTA</h3>
        <input
          placeholder="Title"
          value={form.closingTitle}
          onChange={(e) => setForm({ ...form, closingTitle: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Subtitle"
          value={form.closingSubtitle}
          onChange={(e) => setForm({ ...form, closingSubtitle: e.target.value })}
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </section>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-bold text-white shadow disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save landing page"}
      </button>
    </form>
  );
};

export default LandingPageEditor;
