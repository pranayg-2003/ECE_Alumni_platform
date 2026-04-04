import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { uploadPostMedia } from "../../utils/api";
import { toast, toastApiError } from "../../utils/toast";

const PencilIcon = ({ className }) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const ExternalIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M7.5 16.5L21 3M15 3h6v6" />
  </svg>
);

const Detail = ({ label, value }) => (
  <div className="text-[14px]">
    <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">{label}</p>
    <p className="mt-0.5 font-medium text-[#1d1d1f]">{value || "—"}</p>
  </div>
);

const derivedHeadline = (user) => {
  if (user?.headline?.trim()) return user.headline.trim();
  if (user?.role === "alumni") {
    const parts = [user.jobTitle, user.company].filter(Boolean);
    return parts.length ? parts.join(" · ") : "Alumni member";
  }
  if (user?.role === "student") {
    const parts = [];
    if (user.branch) parts.push(user.branch);
    if (user.year) parts.push(`Year ${user.year}`);
    return parts.length ? parts.join(" · ") : "Student";
  }
  return "Platform administrator";
};

const institutionLabel = (user) => {
  if (user?.role === "alumni") return user.company || "Organization";
  if (user?.role === "student") return user.branch || "Institution";
  return "Mentorship";
};

const institutionInitial = (user) => {
  const label = institutionLabel(user);
  return label.charAt(0).toUpperCase() || "M";
};

const emptyLink = () => ({ title: "", url: "" });
const emptyAchievement = () => ({
  title: "",
  description: "",
  issuer: "",
  year: "",
});

const ProfileSection = () => {
  const { user, updateProfile } = useAuth();
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [uploadKind, setUploadKind] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    headline: "",
    location: "",
    bio: "",
    jobTitle: "",
    company: "",
    branch: "",
    year: "",
    socialLinks: [emptyLink()],
    achievements: [emptyAchievement()],
  });

  useEffect(() => {
    if (!user || !showEdit) return;
    const links =
      user.socialLinks?.length > 0
        ? user.socialLinks.map((l) => ({ title: l.title || "", url: l.url || "" }))
        : [emptyLink()];
    const ach =
      user.achievements?.length > 0
        ? user.achievements.map((a) => ({
            title: a.title || "",
            description: a.description || "",
            issuer: a.issuer || "",
            year: a.year != null ? String(a.year) : "",
          }))
        : [emptyAchievement()];
    setForm({
      headline: user.headline || "",
      location: user.location || "",
      bio: user.bio || "",
      jobTitle: user.jobTitle || "",
      company: user.company || "",
      branch: user.branch || "",
      year: user.year != null ? String(user.year) : "",
      socialLinks: links,
      achievements: ach,
    });
  }, [user, showEdit]);

  if (!user) return null;

  const roleText = user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1);

  const uploadImageAndPatch = async (file, field) => {
    if (!file || !/^image\//i.test(file.type)) {
      setUploadError("Please choose an image file.");
      return;
    }
    setUploadKind(field);
    setUploadError("");
    try {
      const res = await uploadPostMedia([file]);
      if (!res.success || !res.data?.[0]?.url) {
        toast.error(res.message || "Upload failed.");
        return;
      }
      const url = res.data[0].url;
      await updateProfile(field === "cover" ? { coverImage: url } : { profilePicture: url });
    } catch (err) {
      toastApiError(err, "Upload failed.");
    } finally {
      setUploadKind(null);
    }
  };

  const saveDetails = async () => {
    setSaving(true);
    setUploadError("");
    try {
      const payload = {
        headline: form.headline,
        location: form.location,
        bio: form.bio,
        socialLinks: form.socialLinks
          .filter((l) => l.title?.trim() && l.url?.trim())
          .map((l) => ({ title: l.title.trim(), url: l.url.trim() })),
        achievements: form.achievements
          .filter((a) => a.title?.trim())
          .map((a) => {
            const row = {
              title: a.title.trim(),
              description: (a.description || "").trim(),
              issuer: (a.issuer || "").trim(),
            };
            const y = parseInt(a.year, 10);
            if (!Number.isNaN(y) && y >= 1950 && y <= 2100) row.year = y;
            return row;
          }),
      };
      if (user.role === "alumni") {
        payload.jobTitle = form.jobTitle;
        payload.company = form.company;
      }
      if (user.role === "student") {
        payload.branch = form.branch;
        const y = parseInt(form.year, 10);
        if (y >= 1 && y <= 4) payload.year = y;
      }
      await updateProfile(payload);
      setShowEdit(false);
    } catch (err) {
      toastApiError(err, "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const cover = user.coverImage?.trim();
  const avatar = user.profilePicture?.trim();
  const linksOut = user.socialLinks?.filter((l) => l.title && l.url) || [];
  const achOut = user.achievements?.filter((a) => a.title) || [];

  const inputClass =
    "w-full rounded-2xl border border-black/[0.06] bg-[#f5f5f7] px-3.5 py-2.5 text-[15px] text-[#1d1d1f] outline-none transition focus:border-[#0071e3]/35 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15";

  return (
    <aside className="apple-glass-card overflow-hidden">
      <div className="relative h-36 bg-neutral-300 sm:h-40 md:h-44">
        {cover ? (
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full bg-gradient-to-br from-[#1d1d1f] via-[#2d2d2f] to-[#424245]"
            aria-hidden
          />
        )}
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={!!uploadKind}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-md backdrop-blur-md transition hover:bg-black/55 disabled:opacity-50"
          title="Change cover photo"
          aria-label="Change cover photo"
        >
          {uploadKind === "cover" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <PencilIcon className="h-4 w-4" />
          )}
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) uploadImageAndPatch(f, "cover");
          }}
        />
      </div>

      <div className="relative px-4 pb-6 pt-0 sm:px-6">
        <div className="-mt-16 flex flex-col gap-4 sm:-mt-[4.25rem] sm:flex-row sm:items-end sm:justify-between">
          <div className="relative inline-block">
            <div className="h-[7.25rem] w-[7.25rem] overflow-hidden rounded-full border-[4px] border-white bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06]">
              {avatar ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#1d1d1f] text-3xl font-semibold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={!!uploadKind}
              className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#1d1d1f] shadow-md transition hover:bg-[#f5f5f7] disabled:opacity-50"
              title="Change profile photo"
              aria-label="Change profile photo"
            >
              {uploadKind === "avatar" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent" />
              ) : (
                <PencilIcon className="h-4 w-4" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) uploadImageAndPatch(f, "avatar");
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowEdit((v) => !v)}
            className="hidden self-end rounded-full border border-[#0071e3] px-5 py-2 text-[14px] font-medium text-[#0071e3] transition hover:bg-[#0071e3]/8 sm:inline-flex"
          >
            {showEdit ? "Close" : "Edit profile"}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-b border-black/[0.06] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-[22px] font-semibold tracking-tight text-[#1d1d1f] sm:text-[24px]">
              {user.name}
            </h3>
            <p className="mt-1 text-[15px] leading-snug text-neutral-600">{derivedHeadline(user)}</p>
            <p className="mt-2 text-[13px] text-neutral-500">
              {user.location?.trim() ? (
                <span>{user.location.trim()}</span>
              ) : (
                <span className="text-neutral-400">Add your location</span>
              )}
              <span className="mx-1.5 text-neutral-300">·</span>
              <a href={`mailto:${user.email}`} className="font-medium text-[#0071e3] underline-offset-4 hover:underline">
                Contact
              </a>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:max-w-[42%]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f5f5f7] text-[13px] font-semibold text-[#1d1d1f] ring-1 ring-black/[0.06]">
              {institutionInitial(user)}
            </div>
            <span className="line-clamp-2 text-[12px] font-semibold leading-tight text-[#1d1d1f]">
              {institutionLabel(user)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowEdit((v) => !v)}
            className="rounded-full bg-[#0071e3] px-5 py-2 text-[14px] font-medium text-white shadow-sm transition hover:bg-[#0077ed] sm:hidden"
          >
            {showEdit ? "Close" : "Edit profile"}
          </button>
          {user.role === "student" && (
            <Link
              to="/dashboard/student"
              className="rounded-full border border-black/[0.12] bg-white px-5 py-2 text-center text-[14px] font-medium text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
            >
              Find mentors
            </Link>
          )}
          {user.role === "alumni" && (
            <Link
              to="/menteeProgram"
              className="rounded-full border border-black/[0.12] bg-white px-5 py-2 text-center text-[14px] font-medium text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
            >
              Mentee program
            </Link>
          )}
          {user.role === "admin" && (
            <Link
              to="/dashboard/admin"
              className="rounded-full border border-black/[0.12] bg-white px-5 py-2 text-center text-[14px] font-medium text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
            >
              Admin
            </Link>
          )}
          <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-3.5 py-2 text-[12px] font-medium text-neutral-600 ring-1 ring-black/[0.06]">
            {roleText}
          </span>
        </div>

        {uploadError && (
          <p className="mt-3 text-[14px] text-red-600" role="alert">
            {uploadError}
          </p>
        )}

        {showEdit && (
          <div className="mt-5 space-y-5 rounded-[20px] border border-black/[0.06] bg-[#f5f5f7]/80 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Profile details</p>
            <input
              type="text"
              placeholder="Headline"
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className={inputClass}
            />
            <textarea
              placeholder="About"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className={`${inputClass} resize-none`}
            />
            {user.role === "alumni" && (
              <>
                <input
                  type="text"
                  placeholder="Job title"
                  value={form.jobTitle}
                  onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className={inputClass}
                />
              </>
            )}
            {user.role === "student" && (
              <>
                <input
                  type="text"
                  placeholder="Branch"
                  value={form.branch}
                  onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                  className={inputClass}
                />
                <select
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Year</option>
                  {[1, 2, 3, 4].map((y) => (
                    <option key={y} value={String(y)}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </>
            )}

            <div className="border-t border-black/[0.06] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Links</p>
              <p className="mt-1 text-[12px] text-neutral-500">Website, LinkedIn, GitHub, portfolio…</p>
              <div className="mt-3 space-y-3">
                {form.socialLinks.map((row, i) => (
                  <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      placeholder="Label"
                      value={row.title}
                      onChange={(e) => {
                        const next = [...form.socialLinks];
                        next[i] = { ...next[i], title: e.target.value };
                        setForm((f) => ({ ...f, socialLinks: next }));
                      }}
                      className={`${inputClass} sm:max-w-[140px]`}
                    />
                    <input
                      type="url"
                      placeholder="https://…"
                      value={row.url}
                      onChange={(e) => {
                        const next = [...form.socialLinks];
                        next[i] = { ...next[i], url: e.target.value };
                        setForm((f) => ({ ...f, socialLinks: next }));
                      }}
                      className={`${inputClass} flex-1`}
                    />
                    {form.socialLinks.length > 1 && (
                      <button
                        type="button"
                        className="text-[13px] font-medium text-red-600 hover:underline sm:shrink-0"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            socialLinks: f.socialLinks.filter((_, j) => j !== i),
                          }))
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-[14px] font-medium text-[#0071e3] hover:underline"
                  onClick={() =>
                    setForm((f) => ({ ...f, socialLinks: [...f.socialLinks, emptyLink()] }))
                  }
                >
                  + Add link
                </button>
              </div>
            </div>

            <div className="border-t border-black/[0.06] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Achievements</p>
              <p className="mt-1 text-[12px] text-neutral-500">Awards, certifications, publications…</p>
              <div className="mt-3 space-y-4">
                {form.achievements.map((row, i) => (
                  <div key={i} className="rounded-2xl border border-black/[0.06] bg-white p-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Title"
                      value={row.title}
                      onChange={(e) => {
                        const next = [...form.achievements];
                        next[i] = { ...next[i], title: e.target.value };
                        setForm((f) => ({ ...f, achievements: next }));
                      }}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Issuer / organization (optional)"
                      value={row.issuer}
                      onChange={(e) => {
                        const next = [...form.achievements];
                        next[i] = { ...next[i], issuer: e.target.value };
                        setForm((f) => ({ ...f, achievements: next }));
                      }}
                      className={inputClass}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="number"
                        placeholder="Year"
                        min="1950"
                        max="2100"
                        value={row.year}
                        onChange={(e) => {
                          const next = [...form.achievements];
                          next[i] = { ...next[i], year: e.target.value };
                          setForm((f) => ({ ...f, achievements: next }));
                        }}
                        className={`${inputClass} sm:max-w-[120px]`}
                      />
                    </div>
                    <textarea
                      placeholder="Description (optional)"
                      rows={2}
                      value={row.description}
                      onChange={(e) => {
                        const next = [...form.achievements];
                        next[i] = { ...next[i], description: e.target.value };
                        setForm((f) => ({ ...f, achievements: next }));
                      }}
                      className={`${inputClass} resize-none`}
                    />
                    {form.achievements.length > 1 && (
                      <button
                        type="button"
                        className="text-[13px] font-medium text-red-600 hover:underline"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            achievements: f.achievements.filter((_, j) => j !== i),
                          }))
                        }
                      >
                        Remove achievement
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-[14px] font-medium text-[#0071e3] hover:underline"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      achievements: [...f.achievements, emptyAchievement()],
                    }))
                  }
                >
                  + Add achievement
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="rounded-full px-5 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-black/[0.04]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDetails}
                disabled={saving}
                className="rounded-full bg-[#0071e3] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#0077ed] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        {linksOut.length > 0 && (
          <div className="mt-6 border-t border-black/[0.06] pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Links</p>
            <ul className="mt-3 space-y-2">
              {linksOut.map((l, idx) => (
                <li key={`${l.url}-${idx}`}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 text-[15px] font-medium text-[#0071e3] hover:underline"
                  >
                    <span>{l.title}</span>
                    <ExternalIcon className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-[#0071e3]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {achOut.length > 0 && (
          <div className="mt-6 border-t border-black/[0.06] pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Achievements</p>
            <ul className="mt-3 space-y-3">
              {achOut.map((a, idx) => (
                <li
                  key={`${a.title}-${idx}`}
                  className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7]/60 px-4 py-3"
                >
                  <p className="font-semibold text-[#1d1d1f]">{a.title}</p>
                  {(a.issuer || a.year) && (
                    <p className="mt-1 text-[13px] text-neutral-500">
                      {[a.issuer, a.year].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {a.description ? (
                    <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">{a.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 space-y-4 border-t border-black/[0.06] pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">About</p>
          {user.role === "student" ? (
            <>
              <Detail label="Branch" value={user.branch} />
              <Detail label="Year" value={user.year ? `Year ${user.year}` : ""} />
            </>
          ) : user.role === "alumni" ? (
            <>
              <Detail label="Company" value={user.company} />
              <Detail label="Job title" value={user.jobTitle} />
            </>
          ) : (
            <Detail label="Access" value="Platform Administrator" />
          )}
          <Detail label="Bio" value={user.bio} />
          {!!user.interests?.length && (
            <div className="pt-1">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Interests</p>
              <div className="flex flex-wrap gap-2">
                {user.interests.slice(0, 12).map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] ring-1 ring-black/[0.06]"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!!user.skills?.length && (
            <div className="pt-1">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Skills</p>
              <div className="flex flex-wrap gap-2">
                {user.skills.slice(0, 14).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-[#1d1d1f] px-3 py-1.5 text-[12px] font-medium text-white"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ProfileSection;
