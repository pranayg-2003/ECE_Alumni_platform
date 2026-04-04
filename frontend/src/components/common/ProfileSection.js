import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { uploadPostMedia } from "../../utils/api";

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

const Detail = ({ label, value }) => (
  <div className="text-sm">
    <p className="text-slate-500">{label}</p>
    <p className="font-medium text-slate-800">{value || "—"}</p>
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
  });

  useEffect(() => {
    if (!user || !showEdit) return;
    setForm({
      headline: user.headline || "",
      location: user.location || "",
      bio: user.bio || "",
      jobTitle: user.jobTitle || "",
      company: user.company || "",
      branch: user.branch || "",
      year: user.year != null ? String(user.year) : "",
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
        setUploadError(res.message || "Upload failed.");
        return;
      }
      const url = res.data[0].url;
      await updateProfile(
        field === "cover" ? { coverImage: url } : { profilePicture: url },
      );
    } catch (err) {
      setUploadError(
        err.response?.data?.message || err.message || "Upload failed.",
      );
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
      setUploadError(
        err.response?.data?.message || err.message || "Could not save profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const cover = user.coverImage?.trim();
  const avatar = user.profilePicture?.trim();

  return (
    <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/50">
      {/* Cover */}
      <div className="relative h-32 bg-slate-300 sm:h-36 md:h-40">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full bg-gradient-to-br from-slate-400 via-slate-500 to-slate-700"
            aria-hidden
          />
        )}
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={!!uploadKind}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/75 text-white shadow-md backdrop-blur-sm transition hover:bg-slate-900 disabled:opacity-50"
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

      <div className="relative px-4 pb-5 pt-0 sm:px-5">
        {/* Avatar overlap */}
        <div className="-mt-14 flex flex-col gap-3 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
          <div className="relative inline-block">
            <div className="h-28 w-28 overflow-hidden rounded-full border-[4px] border-white bg-white shadow-lg ring-1 ring-slate-200 sm:h-[7.25rem] sm:w-[7.25rem]">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={!!uploadKind}
              className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 disabled:opacity-50"
              title="Change profile photo"
              aria-label="Change profile photo"
            >
              {uploadKind === "avatar" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
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
            className="hidden self-end rounded-full border border-[#0a66c2] px-4 py-1.5 text-sm font-semibold text-[#0a66c2] transition hover:bg-blue-50 sm:inline-flex"
          >
            {showEdit ? "Close" : "Edit profile"}
          </button>
        </div>

        {/* Name & headline */}
        <div className="mt-3 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {user.name}
            </h3>
            <p className="mt-1 text-sm leading-snug text-slate-700 sm:text-[15px]">
              {derivedHeadline(user)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {user.location?.trim() ? (
                <span>{user.location.trim()}</span>
              ) : (
                <span className="text-slate-400">Add your location</span>
              )}
              <span className="mx-1.5 text-slate-300">·</span>
              <a
                href={`mailto:${user.email}`}
                className="font-semibold text-[#0a66c2] hover:underline"
              >
                Contact info
              </a>
            </p>
            <p className="mt-1 text-xs font-semibold text-[#0a66c2]">
              Mentorship network
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:max-w-[40%]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-slate-100 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
              {institutionInitial(user)}
            </div>
            <span className="line-clamp-2 text-xs font-semibold leading-tight text-slate-800">
              {institutionLabel(user)}
            </span>
          </div>
        </div>

        {/* Action row (LinkedIn-style) */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowEdit((v) => !v)}
            className="rounded-full bg-[#0a66c2] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004182] sm:hidden"
          >
            {showEdit ? "Close" : "Edit profile"}
          </button>
          {user.role === "student" && (
            <Link
              to="/dashboard/student"
              className="rounded-full border border-[#0a66c2] px-4 py-1.5 text-center text-sm font-semibold text-[#0a66c2] transition hover:bg-blue-50"
            >
              Find mentors
            </Link>
          )}
          {user.role === "alumni" && (
            <Link
              to="/menteeProgram"
              className="rounded-full border border-[#0a66c2] px-4 py-1.5 text-center text-sm font-semibold text-[#0a66c2] transition hover:bg-blue-50"
            >
              Dashboard
            </Link>
          )}
          {user.role === "admin" && (
            <Link
              to="/dashboard/admin"
              className="rounded-full border border-[#0a66c2] px-4 py-1.5 text-center text-sm font-semibold text-[#0a66c2] transition hover:bg-blue-50"
            >
              Admin
            </Link>
          )}
          <span className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {roleText}
          </span>
        </div>

        {uploadError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {uploadError}
          </p>
        )}

        {showEdit && (
          <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Profile details
            </p>
            <input
              type="text"
              placeholder="Headline (e.g. Full Stack Developer | React)"
              value={form.headline}
              onChange={(e) =>
                setForm((f) => ({ ...f, headline: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <input
              type="text"
              placeholder="Location (e.g. City, State, Country)"
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <textarea
              placeholder="About / bio"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            {user.role === "alumni" && (
              <>
                <input
                  type="text"
                  placeholder="Job title"
                  value={form.jobTitle}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, jobTitle: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={form.company}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, company: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </>
            )}
            {user.role === "student" && (
              <>
                <input
                  type="text"
                  placeholder="Branch"
                  value={form.branch}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, branch: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
                <select
                  value={form.year}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, year: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
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
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDetails}
                disabled={saving}
                className="rounded-full bg-[#0a66c2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-500">About</p>
          {user.role === "student" ? (
            <>
              <Detail label="Branch" value={user.branch} />
              <Detail
                label="Year"
                value={user.year ? `Year ${user.year}` : ""}
              />
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
            <div className="pt-2">
              <p className="mb-2 text-xs font-semibold text-slate-600">
                Interests
              </p>
              <div className="flex flex-wrap gap-2">
                {user.interests.slice(0, 8).map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!!user.skills?.length && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-semibold text-slate-600">
                Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {user.skills.slice(0, 8).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800"
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
