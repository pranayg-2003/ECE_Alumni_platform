import React, { useEffect, useMemo, useState } from "react";

const MEET_REGEX = /https?:\/\/meet\.google\.com\/[a-z0-9-]+/i;

export const extractMeetLink = (text) => {
  const m = String(text || "").match(MEET_REGEX);
  return m ? m[0] : "";
};

const TEMPLATES = [
  {
    id: "ama",
    label: "Career AMA",
    hint: "Open Q&A",
    title: "Alumni career AMA",
    description:
      "Bring your questions on roles, interviews, and growth. We’ll cover as many topics as time allows.",
  },
  {
    id: "workshop",
    label: "Workshop",
    hint: "Skills session",
    title: "Alumni-led workshop",
    description:
      "Hands-on session with examples and resources shared after the call. Have a notebook ready.",
  },
  {
    id: "resume",
    label: "Resume / portfolio",
    hint: "Review clinic",
    title: "Resume & portfolio review",
    description:
      "Short 1:1 style tips in a group setting — we’ll walk through structure, projects, and LinkedIn.",
  },
  {
    id: "network",
    label: "Networking",
    hint: "Casual meet",
    title: "Alumni networking hour",
    description:
      "Informal introductions and breakout themes. Great for meeting peers and mentors.",
  },
];

const pad = (n) => String(n).padStart(2, "0");

const toLocalValue = (d) => {
  if (!d || Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalValue = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const setTimeOnDate = (base, hours, minutes) => {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const tonightAt = (h, m) => {
  const d = setTimeOnDate(new Date(), h, m);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
};

const tomorrowAt = (h, m) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return setTimeOnDate(d, h, m);
};

const nextSaturdayAt = (h, m) => {
  const d = new Date();
  const day = d.getDay();
  let add = (6 - day + 7) % 7;
  if (add === 0) add = 7;
  d.setDate(d.getDate() + add);
  return setTimeOnDate(d, h, m);
};

const DURATION_MIN = [
  { label: "30 min", m: 30 },
  { label: "60 min", m: 60 },
  { label: "90 min", m: 90 },
];

/**
 * Multi-step flow to publish or edit a Google Meet event (alumni / admin).
 */
const EventPublishWizard = ({ open, editingId, initial, onClose, onPublish, submitting }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [googleMeetLink, setGoogleMeetLink] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [durationMin, setDurationMin] = useState(60);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    if (initial) {
      setTitle(initial.title || "");
      setDescription(initial.description || "");
      setGoogleMeetLink(initial.googleMeetLink || "");
      setStartsAt(
        initial.startsAt
          ? toLocalValue(new Date(initial.startsAt))
          : toLocalValue(tomorrowAt(18, 0)),
      );
      setEndsAt(initial.endsAt ? toLocalValue(new Date(initial.endsAt)) : "");
      setStatus(initial.status || "scheduled");
    } else {
      setTitle("");
      setDescription("");
      setGoogleMeetLink("");
      const s0 = toLocalValue(tomorrowAt(18, 0));
      setStartsAt(s0);
      setEndsAt(toLocalValue(new Date(fromLocalValue(s0).getTime() + 60 * 60 * 1000)));
      setDurationMin(60);
      setStatus("scheduled");
    }
  }, [open, initial, editingId]);

  const syncEndToDuration = (startStr, mins) => {
    const s = fromLocalValue(startStr);
    if (!s) return;
    setEndsAt(toLocalValue(new Date(s.getTime() + mins * 60 * 1000)));
  };

  const meetOk = useMemo(() => !!extractMeetLink(googleMeetLink), [googleMeetLink]);

  const applyTemplate = (t) => {
    setTitle(t.title);
    setDescription(t.description);
    setStep(2);
  };

  const handlePasteMeet = (e) => {
    const text = e.clipboardData?.getData("text") || "";
    const link = extractMeetLink(text);
    if (link) {
      e.preventDefault();
      setGoogleMeetLink(link);
    }
  };

  const payload = () => {
    const start = fromLocalValue(startsAt);
    const endRaw = endsAt ? fromLocalValue(endsAt) : null;
    return {
      title: title.trim(),
      description: description.trim(),
      googleMeetLink: extractMeetLink(googleMeetLink) || googleMeetLink.trim(),
      startsAt: start ? start.toISOString() : null,
      endsAt: endRaw ? endRaw.toISOString() : null,
      status,
    };
  };

  const canStep1 = title.trim().length > 0;
  const canStep2 = meetOk;
  const canStep3 = !!fromLocalValue(startsAt);

  const inputClass =
    "w-full rounded-2xl border border-black/[0.08] bg-[#f5f5f7] px-3.5 py-2.5 text-[15px] text-[#1d1d1f] outline-none focus:border-[#0071e3]/35 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-black/[0.08] bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="evt-wizard-title"
      >
        <div className="border-b border-black/[0.06] bg-[#f5f5f7]/80 px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id="evt-wizard-title" className="text-[18px] font-semibold text-[#1d1d1f]">
              {editingId ? "Edit event" : "Publish a Meet event"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-neutral-500 hover:bg-black/[0.05]"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="mt-3 flex gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-1 flex-1 rounded-full transition ${step >= n ? "bg-[#0071e3]" : "bg-neutral-300"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-[12px] text-neutral-500">
            Step {step} of 4 — {["Pick a format", "Google Meet link", "Schedule", "Preview"][step - 1]}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-[14px] text-neutral-600">
                Start from a template (optional), then refine your title.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="rounded-2xl border border-black/[0.08] bg-white p-3 text-left transition hover:border-[#0071e3]/40 hover:shadow-md"
                  >
                    <p className="text-[14px] font-semibold text-[#1d1d1f]">{t.label}</p>
                    <p className="text-[11px] text-neutral-500">{t.hint}</p>
                  </button>
                ))}
              </div>
              <label className="block text-[12px] font-medium text-neutral-500">Event title</label>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ECE alumni mentorship kickoff"
              />
              <label className="block text-[12px] font-medium text-neutral-500">Description</label>
              <textarea
                className={`${inputClass} min-h-[100px] resize-none`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will attendees get out of this session?"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <a
                href="https://meet.google.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0071e3]/30 bg-[#0071e3]/5 py-3 text-[15px] font-medium text-[#0071e3] transition hover:bg-[#0071e3]/10"
              >
                Open Google Meet & create link
                <span aria-hidden>↗</span>
              </a>
              <p className="text-center text-[12px] text-neutral-500">
                Create a meeting, then paste the link below (we detect it automatically).
              </p>
              <div
                className={`rounded-2xl border-2 border-dashed px-4 py-6 transition ${
                  meetOk ? "border-[#34c759]/60 bg-[#34c759]/5" : "border-black/[0.12] bg-[#fafafa]"
                }`}
                onPaste={handlePasteMeet}
              >
                <label className="block text-[12px] font-medium text-neutral-500">Meeting link</label>
                <input
                  className={`mt-2 w-full border-0 bg-transparent text-[15px] outline-none placeholder:text-neutral-400`}
                  value={googleMeetLink}
                  onChange={(e) => setGoogleMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                />
                {meetOk ? (
                  <p className="mt-3 text-[13px] font-medium text-[#248a3d]">Looks like a valid Meet link.</p>
                ) : (
                  <p className="mt-3 text-[13px] text-neutral-500">Paste your full meet.google.com URL.</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-[13px] text-neutral-600">Quick picks (local time)</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] hover:border-[#0071e3]/40"
                  onClick={() => {
                    const s = toLocalValue(tonightAt(19, 0));
                    setStartsAt(s);
                    syncEndToDuration(s, durationMin);
                  }}
                >
                  Tonight 7:00 PM
                </button>
                <button
                  type="button"
                  className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] hover:border-[#0071e3]/40"
                  onClick={() => {
                    const s = toLocalValue(tomorrowAt(18, 0));
                    setStartsAt(s);
                    syncEndToDuration(s, durationMin);
                  }}
                >
                  Tomorrow 6:00 PM
                </button>
                <button
                  type="button"
                  className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] hover:border-[#0071e3]/40"
                  onClick={() => {
                    const s = toLocalValue(nextSaturdayAt(11, 0));
                    setStartsAt(s);
                    syncEndToDuration(s, durationMin);
                  }}
                >
                  Next Saturday 11:00 AM
                </button>
              </div>
              <label className="block text-[12px] font-medium text-neutral-500">Starts</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={startsAt}
                onChange={(e) => {
                  const v = e.target.value;
                  setStartsAt(v);
                  syncEndToDuration(v, durationMin);
                }}
              />
              <p className="text-[12px] text-neutral-500">Duration</p>
              <div className="flex flex-wrap gap-2">
                {DURATION_MIN.map((d) => (
                  <button
                    key={d.m}
                    type="button"
                    onClick={() => {
                      setDurationMin(d.m);
                      syncEndToDuration(startsAt, d.m);
                    }}
                    className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${
                      durationMin === d.m
                        ? "bg-[#1d1d1f] text-white"
                        : "border border-black/[0.1] bg-white text-[#1d1d1f] hover:border-[#0071e3]/40"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <label className="block text-[12px] font-medium text-neutral-500">Ends (auto from duration, editable)</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
              {editingId && (
                <>
                  <label className="block text-[12px] font-medium text-neutral-500">Status</label>
                  <select
                    className={inputClass}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 rounded-2xl border border-black/[0.08] bg-[#f5f5f7]/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Preview</p>
              <h3 className="text-[17px] font-semibold text-[#1d1d1f]">{title.trim() || "Untitled"}</h3>
              <p className="text-[14px] text-neutral-600">
                {fromLocalValue(startsAt)?.toLocaleString() || "—"}
                {endsAt && fromLocalValue(endsAt)
                  ? ` → ${fromLocalValue(endsAt).toLocaleTimeString()}`
                  : ""}
              </p>
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-neutral-700">
                {description || "No description."}
              </p>
              <p className="truncate text-[13px] text-[#0071e3]">{extractMeetLink(googleMeetLink) || "—"}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] bg-white px-5 py-4">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep((s) => s - 1) : onClose())}
            className="rounded-full px-5 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-black/[0.04]"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <div className="flex gap-2">
            {step < 4 ? (
              <button
                type="button"
                disabled={
                  (step === 1 && !canStep1) || (step === 2 && !canStep2) || (step === 3 && !canStep3)
                }
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                className="rounded-full bg-[#0071e3] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#0077ed] disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || !canStep1 || !canStep2 || !canStep3 || !meetOk}
                onClick={() => onPublish(payload())}
                className="rounded-full bg-[#0071e3] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#0077ed] disabled:opacity-40"
              >
                {submitting ? "Saving…" : editingId ? "Save changes" : "Publish event"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPublishWizard;
