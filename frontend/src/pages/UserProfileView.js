import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { getAlumniProfile } from "../utils/api";
import { toastApiError } from "../utils/toast";

const UserProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getAlumniProfile(id);
        if (!cancelled) setUser(res.data);
      } catch (err) {
        toastApiError(err, "Could not load profile.");
        if (!cancelled) navigate("/feed", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="dashboard-apple-bg font-apple min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-neutral-500">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  const isAlumni = user.role === "alumni";

  return (
    <div className="dashboard-apple-bg font-apple min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 text-[15px] font-medium text-[#0071e3] hover:underline"
        >
          ← Back
        </button>
        <div className="apple-glass-card overflow-hidden p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-xl font-semibold text-white">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-semibold text-[#1d1d1f]">{user.name}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    isAlumni
                      ? "bg-[#e0f2fe] text-[#0369a1]"
                      : "bg-[#f3e8ff] text-[#7c3aed]"
                  }`}
                >
                  {isAlumni ? "Alumni" : "Student"}
                </span>
              </div>
              {isAlumni ? (
                <p className="mt-1 text-[15px] text-neutral-600">
                  {[user.jobTitle, user.company].filter(Boolean).join(" · ") || "Alumni"}
                  {user.graduationYear ? ` · Class of ${user.graduationYear}` : ""}
                </p>
              ) : (
                <p className="mt-1 text-[15px] text-neutral-600">
                  {[user.branch, user.year ? `Year ${user.year}` : ""].filter(Boolean).join(" · ") ||
                    "Student"}
                </p>
              )}
              {user.headline ? (
                <p className="mt-3 text-[15px] text-neutral-700">{user.headline}</p>
              ) : null}
              {user.location ? (
                <p className="mt-2 text-[14px] text-neutral-500">{user.location}</p>
              ) : null}
            </div>
          </div>
          {user.bio ? (
            <p className="mt-6 text-[15px] leading-relaxed text-neutral-700">{user.bio}</p>
          ) : null}
          {user.skills?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-500">
                Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-medium text-[#1d1d1f] ring-1 ring-black/[0.06]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!isAlumni && user.interests?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-500">
                Interests
              </p>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-medium text-[#1d1d1f] ring-1 ring-black/[0.06]"
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
  );
};

export default UserProfileView;
