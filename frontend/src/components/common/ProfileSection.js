import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const Detail = ({ label, value, large }) => (
  <div>
    <p
      className={
        large
          ? "text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500"
          : "text-[12px] font-medium uppercase tracking-wide text-neutral-500"
      }
    >
      {label}
    </p>
    <p
      className={
        large
          ? "mt-1.5 text-[18px] font-medium leading-snug text-nitj-navy"
          : "mt-0.5 text-[15px] font-medium text-nitj-navy"
      }
    >
      {value || "—"}
    </p>
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

/** Under name on feed: custom headline only; branch/year live in the program card (avoids duplicate + narrow-column wrap). */
const feedSubtitle = (user) => {
  if (!user) return null;
  if (user.role === "student") {
    return user.headline?.trim() || null;
  }
  return derivedHeadline(user);
};

/** Profile page: headline under name (students: custom headline only; program card holds branch/year). */
const pageSubtitle = (user) => {
  if (!user) return "";
  if (user.role === "student") {
    if (user.headline?.trim()) return user.headline.trim();
    return "";
  }
  return derivedHeadline(user);
};

const emptyLink = () => ({ title: "", url: "" });
const emptyAchievement = () => ({
  title: "",
  description: "",
  issuer: "",
  year: "",
});

const ProfileSection = ({ variant = "feed", children }) => {
  const isPage = variant === "page";
  const isFeed = variant === "feed";
  const navigate = useNavigate();
  const { user, updateProfile, deleteAccount } = useAuth();
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [uploadKind, setUploadKind] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acctDelOpen, setAcctDelOpen] = useState(false);
  const [acctDelReason, setAcctDelReason] = useState("");
  const [acctDelBusy, setAcctDelBusy] = useState(false);
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

  const runDeleteAccount = async () => {
    if (user.role === "alumni" && acctDelReason.trim().length < 10) {
      toast.error("Please share why you’re leaving (at least 10 characters).");
      return;
    }
    if (!window.confirm("This permanently deletes your account, posts, and messages. Continue?")) return;
    setAcctDelBusy(true);
    try {
      const payload =
        user.role === "alumni"
          ? { reason: acctDelReason.trim() }
          : acctDelReason.trim()
            ? { reason: acctDelReason.trim() }
            : {};
      await deleteAccount(payload);
      toast.success("Account removed.");
      navigate("/");
    } catch (err) {
      toastApiError(err, "Could not delete account.");
    } finally {
      setAcctDelBusy(false);
    }
  };

  const cover = user.coverImage?.trim();
  const avatar = user.profilePicture?.trim();
  const linksOut = user.socialLinks?.filter((l) => l.title && l.url) || [];
  const achOut = user.achievements?.filter((a) => a.title) || [];

  const inputClass =
    "w-full rounded-2xl border border-black/[0.06] bg-[#f5f5f7] px-3.5 py-2.5 text-[15px] text-nitj-navy outline-none transition focus:border-nitj-link/35 focus:bg-white focus:ring-2 focus:ring-nitj-link/15";

  const fieldClass = isPage
    ? "w-full rounded-2xl border border-black/[0.06] bg-[#f5f5f7] px-4 py-3 text-[17px] text-nitj-navy outline-none transition focus:border-nitj-link/35 focus:bg-white focus:ring-2 focus:ring-nitj-link/15"
    : inputClass;

  const studentBranchYear = [user.branch, user.year ? `Year ${user.year}` : null]
    .filter(Boolean)
    .join(" · ");

  const coverBlock = (fullBleed) => (
    <div
      className={
        fullBleed
          ? "relative aspect-[820/312] min-h-[200px] max-h-[360px] w-full bg-neutral-300 sm:min-h-[240px]"
          : `relative bg-neutral-300 ${isFeed ? "h-36 sm:h-40 md:h-44" : "h-36 sm:h-40 md:h-44"}`
      }
    >
        {cover ? (
          <img
            src={cover}
            alt=""
          className={
            fullBleed
              ? "absolute inset-0 h-full w-full object-cover object-center"
              : "h-full w-full object-cover object-center"
          }
          />
        ) : (
          <div
          className={
            fullBleed
              ? "absolute inset-0 h-full w-full bg-gradient-to-br from-nitj-navy via-nitj-navy-light to-nitj-navy-light"
              : "h-full w-full bg-gradient-to-br from-nitj-navy via-nitj-navy-light to-nitj-navy-light"
          }
            aria-hidden
          />
        )}
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={!!uploadKind}
        className="absolute right-3 top-3 z-[2] flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-md backdrop-blur-md transition hover:bg-black/55 disabled:opacity-50"
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
  );

  const avatarBlock = (pageFb) => (
    <div className={`relative shrink-0 ${isFeed ? "" : pageFb ? "" : "inline-block"}`}>
      <div
        className={`overflow-hidden rounded-full border-[4px] border-white bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] ${
          pageFb
            ? "h-[7.5rem] w-[7.5rem] sm:h-[10.5rem] sm:w-[10.5rem]"
            : isPage
              ? "h-[8.5rem] w-[8.5rem] sm:h-[9.25rem] sm:w-[9.25rem]"
              : isFeed
                ? "h-[5.5rem] w-[5.5rem] sm:h-[6rem] sm:w-[6rem]"
                : "h-[7.25rem] w-[7.25rem]"
        }`}
      >
              {avatar ? (
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-nitj-navy font-semibold text-white ${
              pageFb ? "text-3xl sm:text-5xl" : isPage ? "text-4xl sm:text-5xl" : isFeed ? "text-2xl sm:text-3xl" : "text-3xl"
            }`}
          >
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={!!uploadKind}
        className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] bg-white text-nitj-navy shadow-md transition hover:bg-[#f5f5f7] disabled:opacity-50"
              title="Change profile photo"
              aria-label="Change profile photo"
            >
              {uploadKind === "avatar" ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-nitj-link border-t-transparent" />
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
  );

  if (isPage) {
    return (
      <div className="min-w-0">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-hidden bg-[#cfd2d6]">
          {coverBlock(true)}
        </div>

        <div className="border-b border-nitj-border bg-nitj-panel shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 pb-5 pt-0 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
              <div className="flex w-full min-w-0 flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-5">
                <div className="relative z-[1] -mt-12 shrink-0 sm:-mt-[4.25rem]">{avatarBlock(true)}</div>
                <div className="min-w-0 flex-1 pb-0.5 text-center sm:pb-3 sm:text-left">
                  <h1 className="text-balance text-[26px] font-bold leading-tight tracking-tight text-nitj-navy sm:text-[32px]">
                    {user.name}
                  </h1>
                  {pageSubtitle(user) ? (
                    <p className="mt-1.5 text-[16px] leading-snug text-neutral-600 sm:text-[17px]">{pageSubtitle(user)}</p>
                  ) : user.role === "student" ? (
                    <p className="mt-1.5 text-[15px] text-neutral-500">
                      {studentBranchYear
                        ? "Program details are in the intro card."
                        : "Add branch, year, and an optional headline in edit profile."}
                    </p>
                  ) : null}
                  <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-[15px] text-neutral-500 sm:justify-start">
                    {user.location?.trim() ? (
                      <span className="min-w-0">{user.location.trim()}</span>
                    ) : (
                      <span className="text-neutral-400">Add your location</span>
                    )}
                    <span className="text-neutral-300" aria-hidden>
                      ·
                    </span>
                    <a
                      href={`mailto:${user.email}`}
                      className="font-medium text-nitj-link underline-offset-2 hover:underline"
                    >
                      Contact
                    </a>
                  </p>
                </div>
              </div>
          <button
            type="button"
            onClick={() => setShowEdit((v) => !v)}
                className="hidden shrink-0 rounded-lg bg-[#e4e6eb] px-5 py-2 text-[15px] font-semibold text-nitj-navy transition hover:bg-[#d8dadf] sm:inline-flex"
          >
            {showEdit ? "Close" : "Edit profile"}
          </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="space-y-4 lg:col-span-5">
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06] sm:p-5">
                {user.role === "student" && (
                  <div className="relative mb-4 w-full min-w-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#eef4ff] via-[#f5f5f7] to-[#e8f0fc] p-4 ring-1 ring-nitj-link/15">
                    <div
                      className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-nitj-link/15 blur-2xl"
                      aria-hidden
                    />
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-nitj-navy text-[16px] font-bold text-white shadow-md">
                        {institutionInitial(user)}
                      </div>
          <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-nitj-link">Program</p>
                        <p className="mt-1 text-[15px] font-semibold leading-snug text-nitj-navy">
                          {studentBranchYear || "Add branch & year"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {user.role === "alumni" && (
                  <div className="relative mb-4 w-full min-w-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#f5f5f7] to-[#e8eef5] p-4 ring-1 ring-black/[0.08]">
                    <div
                      className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-nitj-link/10 blur-2xl"
                      aria-hidden
                    />
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-nitj-navy text-[16px] font-bold text-white shadow-md">
                        {institutionInitial(user)}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-nitj-link">Organization</p>
                        <p className="mt-1 text-[15px] font-semibold leading-snug text-nitj-navy">
                          {user.company || "Add your company on profile"}
                        </p>
                        {user.jobTitle ? (
                          <p className="mt-1 text-[13px] font-medium text-neutral-600">{user.jobTitle}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEdit((v) => !v)}
                    className="rounded-lg bg-nitj-navy px-4 py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-nitj-navy-light sm:hidden"
                  >
                    {showEdit ? "Close" : "Edit profile"}
                  </button>
                  {user.role === "student" && (
                    <Link
                      to="/dashboard/student"
                      className="rounded-lg bg-[#e4e6eb] px-4 py-2.5 text-center text-[15px] font-semibold text-nitj-navy transition hover:bg-[#d8dadf]"
                    >
                      Find mentors
                    </Link>
                  )}
                  {user.role === "alumni" && (
                    <Link
                      to="/menteeProgram"
                      className="rounded-lg bg-[#e4e6eb] px-4 py-2.5 text-center text-[15px] font-semibold text-nitj-navy transition hover:bg-[#d8dadf]"
                    >
                      Mentee program
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="rounded-lg bg-[#e4e6eb] px-4 py-2.5 text-center text-[15px] font-semibold text-nitj-navy transition hover:bg-[#d8dadf]"
                    >
                      Admin
                    </Link>
                  )}
                  <span className="inline-flex items-center rounded-lg bg-[#f0f2f5] px-3 py-2 text-[14px] font-semibold text-neutral-700 ring-1 ring-black/[0.06]">
                    {roleText}
                  </span>
                </div>

                {uploadError && (
                  <p className="mt-3 text-[14px] text-red-600" role="alert">
                    {uploadError}
                  </p>
                )}

                {showEdit && (
                  <div className="mt-5 space-y-5 rounded-xl border border-black/[0.06] bg-[#f0f2f5]/80 p-4 sm:p-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Profile details</p>
                    <input
                      type="text"
                      placeholder="Headline"
                      value={form.headline}
                      onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                      className={fieldClass}
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      className={fieldClass}
                    />
                    <textarea
                      placeholder="About"
                      rows={4}
                      value={form.bio}
                      onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                      className={`${fieldClass} resize-none`}
                    />
                    {user.role === "alumni" && (
                      <>
                        <input
                          type="text"
                          placeholder="Job title"
                          value={form.jobTitle}
                          onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                          className={fieldClass}
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          value={form.company}
                          onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                          className={fieldClass}
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
                          className={fieldClass}
                        />
                        <select
                          value={form.year}
                          onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                          className={fieldClass}
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
                              className={`${fieldClass} sm:max-w-[140px]`}
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
                              className={`${fieldClass} flex-1`}
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
                          className="text-[14px] font-medium text-nitj-link hover:underline"
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
                          <div key={i} className="space-y-2 rounded-2xl border border-black/[0.06] bg-white p-3">
                            <input
                              type="text"
                              placeholder="Title"
                              value={row.title}
                              onChange={(e) => {
                                const next = [...form.achievements];
                                next[i] = { ...next[i], title: e.target.value };
                                setForm((f) => ({ ...f, achievements: next }));
                              }}
                              className={fieldClass}
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
                              className={fieldClass}
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
                                className={`${fieldClass} sm:max-w-[120px]`}
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
                              className={`${fieldClass} resize-none`}
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
                          className="text-[14px] font-medium text-nitj-link hover:underline"
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
                        className="rounded-lg px-5 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-black/[0.04]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveDetails}
                        disabled={saving}
                        className="rounded-lg bg-nitj-navy px-6 py-2.5 text-[14px] font-medium text-white hover:bg-nitj-navy-light disabled:opacity-50"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                )}

                {linksOut.length > 0 && (
                  <div className="mt-6 border-t border-black/[0.06] pt-6">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Links</p>
                    <ul className="mt-3 space-y-2">
                      {linksOut.map((l, idx) => (
                        <li key={`${l.url}-${idx}`}>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2 text-[16px] font-medium text-nitj-link hover:underline"
                          >
                            <span>{l.title}</span>
                            <ExternalIcon className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-nitj-link" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {achOut.length > 0 && (
                  <div className="mt-6 border-t border-black/[0.06] pt-6">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Achievements</p>
                    <ul className="mt-3 space-y-3">
                      {achOut.map((a, idx) => (
                        <li
                          key={`${a.title}-${idx}`}
                          className="rounded-xl border border-black/[0.06] bg-[#f0f2f5]/60 px-4 py-3"
                        >
                          <p className="text-[17px] font-semibold text-nitj-navy">{a.title}</p>
                          {(a.issuer || a.year) && (
                            <p className="mt-1 text-[14px] text-neutral-500">
                              {[a.issuer, a.year].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          {a.description ? (
                            <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{a.description}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 border-t border-black/[0.06] pt-6">
                  <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500 sm:col-span-2">
                    About
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {user.role === "student" ? (
                      <>
                        <Detail label="Branch" value={user.branch} large={isPage} />
                        <Detail label="Year" value={user.year ? `Year ${user.year}` : ""} large={isPage} />
                      </>
                    ) : user.role === "alumni" ? (
                      <>
                        <Detail label="Company" value={user.company} large={isPage} />
                        <Detail label="Job title" value={user.jobTitle} large={isPage} />
                      </>
                    ) : (
                      <Detail label="Access" value="Platform Administrator" large={isPage} />
                    )}
                    <div className="sm:col-span-2">
                      <Detail label="Bio" value={user.bio} large={isPage} />
                    </div>
                    {!!user.interests?.length && (
                      <div className="sm:col-span-2">
                        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-500">Interests</p>
                        <div className="flex flex-wrap gap-2">
                          {user.interests.slice(0, 12).map((i) => (
                            <span
                              key={i}
                              className="rounded-full bg-[#f0f2f5] px-3 py-1.5 text-[14px] font-medium text-nitj-navy ring-1 ring-black/[0.06]"
                            >
                              {i}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!!user.skills?.length && (
                      <div className="sm:col-span-2">
                        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-500">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {user.skills.slice(0, 14).map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-nitj-navy px-3 py-1.5 text-[14px] font-medium text-white"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-red-200/80 bg-red-50/50 p-5 shadow-sm sm:p-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-red-800/90">Danger zone</p>
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
                  Delete your MentorBridge account. This cannot be undone.
                  {user.role === "alumni"
                    ? " Alumni accounts require a short reason (logged for moderation)."
                    : null}
                </p>
                {!acctDelOpen ? (
                  <button
                    type="button"
                    onClick={() => setAcctDelOpen(true)}
                    className="mt-4 rounded-lg border border-red-300 bg-white px-5 py-2.5 text-[14px] font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Delete my account…
                  </button>
                ) : (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={acctDelReason}
                      onChange={(e) => setAcctDelReason(e.target.value)}
                      rows={3}
                      placeholder={
                        user.role === "alumni"
                          ? "Why are you leaving? (required, min. 10 characters)"
                          : "Optional feedback…"
                      }
                      className="w-full resize-y rounded-xl border border-red-200/80 bg-white px-4 py-3 text-[15px] text-nitj-navy outline-none focus:ring-2 focus:ring-red-200"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAcctDelOpen(false);
                          setAcctDelReason("");
                        }}
                        className="rounded-lg px-5 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-black/[0.04]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={runDeleteAccount}
                        disabled={acctDelBusy}
                        className="rounded-lg bg-red-600 px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                      >
                        {acctDelBusy ? "Deleting…" : "Delete account permanently"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 lg:col-span-7">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="apple-glass-card min-w-0 overflow-hidden transition-shadow duration-500">
      {coverBlock(false)}

      <div className="relative px-4 pb-6 pt-0 sm:px-5">
        <div
          className={
            isFeed
              ? "-mt-11 flex w-full min-w-0 flex-col items-center gap-3 sm:-mt-12"
              : "-mt-16 flex w-full flex-col gap-3 sm:-mt-[4.25rem] sm:flex-row sm:items-start sm:justify-between"
          }
        >
          {avatarBlock(false)}

          <button
            type="button"
            onClick={() => (isFeed ? navigate("/profile") : setShowEdit((v) => !v))}
            className={`hidden shrink-0 rounded-full border border-nitj-link font-medium text-nitj-link transition hover:bg-nitj-link/8 sm:inline-flex ${
              isPage
                ? "px-6 py-2.5 text-[16px] sm:mt-3"
                : "self-center px-5 py-2 text-[14px] sm:self-center"
            }`}
          >
            {isPage && showEdit ? "Close" : "Edit profile"}
          </button>
        </div>

        {isFeed ? (
          <div className="mt-4 flex w-full min-w-0 flex-col gap-4 border-b border-black/[0.06] pb-5">
            <div className="w-full min-w-0 text-center sm:text-left">
              <h3 className="text-balance text-[19px] font-semibold leading-tight tracking-tight text-nitj-navy sm:text-[21px]">
              {user.name}
            </h3>
              {feedSubtitle(user) ? (
                <p className="mt-2 text-[14px] leading-snug text-neutral-600 sm:text-[15px]">{feedSubtitle(user)}</p>
              ) : null}
              {user.role === "student" && !studentBranchYear && (
                <p className="mt-2 text-[13px] text-neutral-500">
                  Add branch & year on your{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="font-medium text-nitj-link underline-offset-4 hover:underline"
                  >
                    profile page
                  </button>
                  .
                </p>
              )}
              <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 text-[13px] text-neutral-500 sm:justify-start sm:text-[14px]">
              {user.location?.trim() ? (
                  <span className="min-w-0">{user.location.trim()}</span>
              ) : (
                  <span className="text-neutral-400">Add your location</span>
              )}
                <span className="text-neutral-300" aria-hidden>
                  ·
                </span>
              <a
                href={`mailto:${user.email}`}
                  className="font-medium text-nitj-link underline-offset-4 hover:underline"
              >
                  Contact
              </a>
            </p>
            </div>
            {user.role === "student" && (
              <div className="relative w-full min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#eef4ff] via-[#f5f5f7] to-[#e8f0fc] p-4 ring-1 ring-nitj-link/15">
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-nitj-link/15 blur-2xl"
                  aria-hidden
                />
                <div className="relative flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-nitj-navy text-[16px] font-bold text-white shadow-md">
                    {institutionInitial(user)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-nitj-link">Program</p>
                    <p className="mt-1 text-[15px] font-semibold leading-snug text-nitj-navy">
                      {studentBranchYear || "Add branch & year"}
            </p>
          </div>
                </div>
              </div>
            )}
            {user.role === "alumni" && (
              <div className="relative w-full min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#f5f5f7] to-[#e8eef5] p-4 ring-1 ring-black/[0.08]">
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-nitj-link/10 blur-2xl"
                  aria-hidden
                />
                <div className="relative flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-nitj-navy text-[16px] font-bold text-white shadow-md">
              {institutionInitial(user)}
            </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-nitj-link">Organization</p>
                    <p className="mt-1 text-[15px] font-semibold leading-snug text-nitj-navy">
                      {user.company || "Add your company on profile"}
                    </p>
                    {user.jobTitle ? (
                      <p className="mt-1 text-[13px] font-medium text-neutral-600">{user.jobTitle}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 flex w-full min-w-0 flex-col gap-5 border-b border-black/[0.06] pb-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 w-full flex-1 lg:min-w-0">
              <h3 className="text-balance text-[28px] font-semibold tracking-tight text-nitj-navy sm:text-[32px]">
                {user.name}
              </h3>
              {pageSubtitle(user) ? (
                <p className="mt-2 text-[18px] leading-relaxed text-neutral-600 sm:text-[19px]">{pageSubtitle(user)}</p>
              ) : user.role === "student" ? (
                <p className="mt-2 text-[16px] text-neutral-500">
                  {studentBranchYear
                    ? "Your branch and year are shown in the program card."
                    : "Add branch, year, and an optional headline in edit profile."}
                </p>
              ) : null}
              <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[16px] text-neutral-500">
                {user.location?.trim() ? (
                  <span className="min-w-0">{user.location.trim()}</span>
                ) : (
                  <span className="text-neutral-400">Add your location</span>
                )}
                <span className="text-neutral-300" aria-hidden>
                  ·
            </span>
                <a
                  href={`mailto:${user.email}`}
                  className="font-medium text-nitj-link underline-offset-4 hover:underline"
                >
                  Contact
                </a>
              </p>
          </div>
            <div className="flex w-full min-w-0 shrink-0 items-center gap-4 rounded-2xl border border-black/[0.06] bg-gradient-to-br from-white to-[#f5f5f7] p-4 shadow-sm ring-1 ring-black/[0.04] lg:max-w-[min(100%,280px)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-nitj-navy text-[18px] font-bold text-white shadow-md">
                {institutionInitial(user)}
        </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  {user.role === "student" ? "Program" : user.role === "alumni" ? "Organization" : "Access"}
                </p>
                <p className="mt-1 text-[16px] font-semibold leading-snug text-nitj-navy">
                  {user.role === "student"
                    ? studentBranchYear || institutionLabel(user)
                    : institutionLabel(user)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className={`flex flex-wrap gap-2 ${isFeed ? "mt-4" : "mt-6"}`}>
          <button
            type="button"
            onClick={() => (isFeed ? navigate("/profile") : setShowEdit((v) => !v))}
            className={`rounded-full bg-nitj-navy font-medium text-white shadow-sm transition hover:bg-nitj-navy-light sm:hidden ${
              isPage ? "px-6 py-3 text-[16px]" : "px-5 py-2.5 text-[14px]"
            }`}
          >
            {isPage && showEdit ? "Close" : "Edit profile"}
          </button>
          {user.role === "student" && (
            <Link
              to="/dashboard/student"
              className={`rounded-full border border-black/[0.12] bg-white text-center font-medium text-nitj-navy transition hover:bg-[#f5f5f7] ${
                isPage ? "px-6 py-3 text-[16px]" : "px-5 py-2 text-[14px]"
              }`}
            >
              Find mentors
            </Link>
          )}
          {user.role === "alumni" && (
            <Link
              to="/menteeProgram"
              className={`rounded-full border border-black/[0.12] bg-white text-center font-medium text-nitj-navy transition hover:bg-[#f5f5f7] ${
                isPage ? "px-6 py-3 text-[16px]" : "px-5 py-2 text-[14px]"
              }`}
            >
              Mentee program
            </Link>
          )}
          {user.role === "admin" && (
            <Link
              to="/admin"
              className={`rounded-full border border-black/[0.12] bg-white text-center font-medium text-nitj-navy transition hover:bg-[#f5f5f7] ${
                isPage ? "px-6 py-3 text-[16px]" : "px-5 py-2 text-[14px]"
              }`}
            >
              Admin
            </Link>
          )}
          <span
            className={`inline-flex items-center rounded-full bg-[#f5f5f7] font-medium text-neutral-600 ring-1 ring-black/[0.06] ${
              isPage ? "px-4 py-2.5 text-[14px]" : "px-3.5 py-2 text-[12px]"
            }`}
          >
            {roleText}
          </span>
        </div>

        {uploadError && (
          <p className="mt-3 text-[14px] text-red-600" role="alert">
            {uploadError}
          </p>
        )}

        {showEdit && isPage && (
          <div
            className={`mt-5 space-y-5 rounded-[20px] border border-black/[0.06] bg-[#f5f5f7]/80 sm:p-5 ${
              isPage ? "p-5 sm:p-6" : "p-4 sm:p-5"
            }`}
          >
            <p
              className={`font-semibold uppercase tracking-[0.12em] text-neutral-500 ${
                isPage ? "text-[12px]" : "text-[11px]"
              }`}
            >
              Profile details
            </p>
            <input
              type="text"
              placeholder="Headline"
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              className={fieldClass}
            />
            <input
              type="text"
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className={fieldClass}
            />
            <textarea
              placeholder="About"
              rows={isPage ? 4 : 3}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className={`${fieldClass} resize-none`}
            />
            {user.role === "alumni" && (
              <>
                <input
                  type="text"
                  placeholder="Job title"
                  value={form.jobTitle}
                  onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                  className={fieldClass}
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className={fieldClass}
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
                  className={fieldClass}
                />
                <select
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                  className={fieldClass}
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
                      className={`${fieldClass} sm:max-w-[140px]`}
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
                      className={`${fieldClass} flex-1`}
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
                  className="text-[14px] font-medium text-nitj-link hover:underline"
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
                      className={fieldClass}
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
                      className={fieldClass}
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
                        className={`${fieldClass} sm:max-w-[120px]`}
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
                      className={`${fieldClass} resize-none`}
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
                  className="text-[14px] font-medium text-nitj-link hover:underline"
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
                className="rounded-full bg-nitj-navy px-6 py-2.5 text-[14px] font-medium text-white hover:bg-nitj-navy-light disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        {linksOut.length > 0 && (
          <div className={`border-t border-black/[0.06] ${isPage ? "mt-8 pt-7" : "mt-6 pt-5"}`}>
            <p
              className={`font-semibold uppercase tracking-[0.12em] text-neutral-500 ${
                isPage ? "text-[12px]" : "text-[11px]"
              }`}
            >
              Links
            </p>
            <ul className={`space-y-2 ${isPage ? "mt-4" : "mt-3"}`}>
              {linksOut.map((l, idx) => (
                <li key={`${l.url}-${idx}`}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center gap-2 font-medium text-nitj-link hover:underline ${
                      isPage ? "text-[17px]" : "text-[15px]"
                    }`}
                  >
                    <span>{l.title}</span>
                    <ExternalIcon className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-nitj-link" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {achOut.length > 0 && (
          <div className={`border-t border-black/[0.06] ${isPage ? "mt-8 pt-7" : "mt-6 pt-5"}`}>
            <p
              className={`font-semibold uppercase tracking-[0.12em] text-neutral-500 ${
                isPage ? "text-[12px]" : "text-[11px]"
              }`}
            >
              Achievements
            </p>
            <ul className={`space-y-3 ${isPage ? "mt-4" : "mt-3"}`}>
              {achOut.map((a, idx) => (
                <li
                  key={`${a.title}-${idx}`}
                  className={`rounded-2xl border border-black/[0.06] bg-[#f5f5f7]/60 ${
                    isPage ? "px-5 py-4" : "px-4 py-3"
                  }`}
                >
                  <p className={`font-semibold text-nitj-navy ${isPage ? "text-[18px]" : ""}`}>{a.title}</p>
                  {(a.issuer || a.year) && (
                    <p className={`mt-1 text-neutral-500 ${isPage ? "text-[15px]" : "text-[13px]"}`}>
                      {[a.issuer, a.year].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {a.description ? (
                    <p
                      className={`mt-2 leading-relaxed text-neutral-600 ${
                        isPage ? "text-[16px]" : "text-[14px]"
                      }`}
                    >
                      {a.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          className={`border-t border-black/[0.06] ${
            isPage
              ? "mt-8 grid grid-cols-1 gap-x-8 gap-y-5 pt-7 sm:grid-cols-2"
              : "mt-6 space-y-4 pt-5"
          }`}
        >
          <p
            className={`font-semibold uppercase tracking-[0.12em] text-neutral-500 ${
              isPage ? "text-[12px] sm:col-span-2" : "text-[11px]"
            }`}
          >
            About
          </p>
          {user.role === "student" ? (
            <>
              <Detail label="Branch" value={user.branch} large={isPage} />
              <Detail label="Year" value={user.year ? `Year ${user.year}` : ""} large={isPage} />
            </>
          ) : user.role === "alumni" ? (
            <>
              <Detail label="Company" value={user.company} large={isPage} />
              <Detail label="Job title" value={user.jobTitle} large={isPage} />
            </>
          ) : (
            <Detail label="Access" value="Platform Administrator" large={isPage} />
          )}
          <div className={isPage ? "sm:col-span-2" : ""}>
            <Detail label="Bio" value={user.bio} large={isPage} />
          </div>
          {!!user.interests?.length && (
            <div className={`pt-1 ${isPage ? "sm:col-span-2" : ""}`}>
              <p
                className={`mb-2 font-semibold uppercase tracking-wide text-neutral-500 ${
                  isPage ? "text-[12px]" : "text-[11px]"
                }`}
              >
                Interests
              </p>
              <div className="flex flex-wrap gap-2">
                {user.interests.slice(0, 12).map((i) => (
                  <span
                    key={i}
                    className={`rounded-full bg-[#f5f5f7] font-medium text-nitj-navy ring-1 ring-black/[0.06] ${
                      isPage ? "px-4 py-2 text-[14px]" : "px-3 py-1.5 text-[12px]"
                    }`}
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!!user.skills?.length && (
            <div className={`pt-1 ${isPage ? "sm:col-span-2" : ""}`}>
              <p
                className={`mb-2 font-semibold uppercase tracking-wide text-neutral-500 ${
                  isPage ? "text-[12px]" : "text-[11px]"
                }`}
              >
                Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {user.skills.slice(0, 14).map((s) => (
                  <span
                    key={s}
                    className={`rounded-full bg-nitj-navy font-medium text-white ${
                      isPage ? "px-4 py-2 text-[14px]" : "px-3 py-1.5 text-[12px]"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {isPage && (
          <div className="mt-10 rounded-[20px] border border-red-200/80 bg-red-50/40 p-5 sm:p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-red-800/90">Danger zone</p>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
              Delete your MentorBridge account. This cannot be undone.
              {user.role === "alumni"
                ? " Alumni accounts require a short reason (logged for moderation)."
                : null}
            </p>
            {!acctDelOpen ? (
              <button
                type="button"
                onClick={() => setAcctDelOpen(true)}
                className="mt-4 rounded-full border border-red-300 bg-white px-5 py-2.5 text-[14px] font-semibold text-red-700 transition hover:bg-red-50"
              >
                Delete my account…
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <textarea
                  value={acctDelReason}
                  onChange={(e) => setAcctDelReason(e.target.value)}
                  rows={3}
                  placeholder={
                    user.role === "alumni"
                      ? "Why are you leaving? (required, min. 10 characters)"
                      : "Optional feedback…"
                  }
                  className="w-full resize-y rounded-2xl border border-red-200/80 bg-white px-4 py-3 text-[15px] text-nitj-navy outline-none focus:ring-2 focus:ring-red-200"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAcctDelOpen(false);
                      setAcctDelReason("");
                    }}
                    className="rounded-full px-5 py-2.5 text-[14px] font-medium text-neutral-600 hover:bg-black/[0.04]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={runDeleteAccount}
                    disabled={acctDelBusy}
                    className="rounded-full bg-red-600 px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {acctDelBusy ? "Deleting…" : "Delete account permanently"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default ProfileSection;
