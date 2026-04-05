// Search modal: students search alumni (Connect); alumni search students + alumni (View profile).

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { searchAlumni, searchNetwork, sendMentorshipRequest } from "../../utils/api";
import { toastApiError } from "../../utils/toast";

const SearchAlumni = ({ isOpen, onClose, variant = "student" }) => {
  const navigate = useNavigate();
  const isAlumniSearcher = variant === "alumni";

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** @type {Record<string, string>} alumniId -> pending | accepted | rejected | cancelled */
  const [requestByAlumniId, setRequestByAlumniId] = useState({});
  const [sendingId, setSendingId] = useState(null);

  const refreshMyRequests = useCallback(async () => {
    try {
      const res = await api.get("/users/my-requests");
      const list = res.data?.data || [];
      const map = {};
      for (const r of list) {
        const aid = r.alumniId?._id ?? r.alumniId;
        if (aid) map[String(aid)] = r.status;
      }
      setRequestByAlumniId(map);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (isOpen && !isAlumniSearcher) refreshMyRequests();
  }, [isOpen, isAlumniSearcher, refreshMyRequests]);

  useEffect(() => {
    if (!isOpen) return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    const timer = setTimeout(async () => {
      try {
        const response = isAlumniSearcher
          ? await searchNetwork(searchQuery)
          : await searchAlumni(searchQuery);
        const data = response.data || [];
        setSearchResults(data);
        if (data.length === 0) {
          setError(
            isAlumniSearcher
              ? "No students or alumni matched your search"
              : "No alumni found matching your search",
          );
        }
      } catch (err) {
        toastApiError(
          err,
          isAlumniSearcher ? "Could not search the network." : "Failed to search alumni. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, isAlumniSearcher]);

  const handleSendRequest = async (alumniId) => {
    const sid = String(alumniId);
    const st = requestByAlumniId[sid];
    if (st === "pending" || st === "accepted") return;

    setSendingId(alumniId);
    try {
      await sendMentorshipRequest(alumniId, "");
      setRequestByAlumniId((prev) => ({ ...prev, [sid]: "pending" }));
    } catch (err) {
      toastApiError(err, "Failed to send request. Please try again.");
    } finally {
      setSendingId(null);
    }
  };

  const requestButton = (alumniId) => {
    const sid = String(alumniId);
    const st = requestByAlumniId[sid];
    const busy = sendingId === alumniId;

    if (st === "accepted") {
      return {
        label: "Accepted",
        disabled: true,
        className: "cursor-not-allowed bg-[#34c759] text-white",
      };
    }
    if (st === "pending") {
      return {
        label: "Sent",
        disabled: true,
        className: "cursor-not-allowed bg-[#fff8e6] text-[13px] font-medium text-[#b45309] ring-1 ring-[#fcd34d]/80",
      };
    }
    if (st === "rejected" || st === "cancelled") {
      return {
        label: st === "rejected" ? "Declined" : "Cancelled",
        disabled: true,
        className: "cursor-not-allowed bg-[#f5f5f7] text-neutral-400",
      };
    }
    return {
      label: busy ? "Sending…" : "Connect",
      disabled: busy,
      className: busy
        ? "bg-[#0071e3]/80 text-white"
        : "bg-[#0071e3] text-white hover:bg-[#0077ed]",
    };
  };

  const openProfile = (userId) => {
    onClose();
    navigate(`/user/${userId}`);
  };

  const subtitleFor = (person) => {
    if (person.role === "alumni") {
      return (
        <>
          {person.jobTitle && (
            <p className="text-sm text-gray-600">
              {person.jobTitle}
              {person.company && ` at ${person.company}`}
            </p>
          )}
          {!person.jobTitle && person.company && (
            <p className="text-sm text-gray-600">{person.company}</p>
          )}
          {person.graduationYear ? (
            <p className="text-xs text-gray-500">Graduated: {person.graduationYear}</p>
          ) : null}
        </>
      );
    }
    return (
      <p className="text-sm text-gray-600">
        {[person.branch, person.year ? `Year ${person.year}` : ""].filter(Boolean).join(" · ") ||
          "Student"}
      </p>
    );
  };

  if (!isOpen) return null;

  const title = isAlumniSearcher ? "Search students & alumni" : "Search alumni";
  const placeholder = isAlumniSearcher
    ? "Name, branch, skills, company…"
    : "Name, skills, or company…";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed left-0 right-0 top-0 z-50 px-4 pt-16 font-apple sm:pt-20">
        <div
          className="mx-auto max-w-2xl overflow-hidden rounded-[24px] border border-black/[0.08] bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-black/[0.06] bg-[#1d1d1f] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-semibold tracking-tight text-white">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/45 focus:border-[#2997ff]/60 focus:ring-2 focus:ring-[#2997ff]/30"
              autoFocus
            />
          </div>

          <div className="max-h-[min(420px,70vh)] overflow-y-auto p-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent" />
              </div>
            )}

            {error && !loading && (
              <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-[14px] text-red-800">
                {error}
              </div>
            )}

            {!loading && searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((person) => {
                  if (isAlumniSearcher) {
                    const isPeerAlumni = person.role === "alumni";
                    return (
                      <div
                        key={person._id}
                        className="rounded-2xl border border-black/[0.08] bg-[#f5f5f7]/50 p-4 transition hover:bg-white hover:shadow-md"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-800">{person.name}</h3>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                  isPeerAlumni
                                    ? "bg-sky-100 text-sky-800"
                                    : "bg-violet-100 text-violet-800"
                                }`}
                              >
                                {isPeerAlumni ? "Alumni" : "Student"}
                              </span>
                            </div>
                            {subtitleFor(person)}
                          </div>
                          <button
                            type="button"
                            onClick={() => openProfile(person._id)}
                            className="shrink-0 rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-black"
                          >
                            View
                          </button>
                        </div>
                        {(person.bio || (person.skills && person.skills.length > 0)) && (
                          <div className="mt-3 space-y-2">
                            {person.bio && (
                              <p className="text-sm text-gray-700 line-clamp-2">{person.bio}</p>
                            )}
                            {person.skills && person.skills.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {person.skills.slice(0, 3).map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block rounded-full bg-[#1d1d1f] px-3 py-1 text-[11px] font-medium text-white"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {person.skills.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{person.skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const btn = requestButton(person._id);
                  return (
                    <div
                      key={person._id}
                      className="rounded-2xl border border-black/[0.08] bg-[#f5f5f7]/50 p-4 transition hover:bg-white hover:shadow-md"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{person.name}</h3>
                          {person.jobTitle && (
                            <p className="text-sm text-gray-600">
                              {person.jobTitle}
                              {person.company && ` at ${person.company}`}
                            </p>
                          )}
                          {person.graduationYear && (
                            <p className="text-xs text-gray-500">
                              Graduated: {person.graduationYear}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSendRequest(person._id)}
                          disabled={btn.disabled}
                          className={`ml-4 shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition ${btn.className}`}
                        >
                          {sendingId === person._id ? (
                            <span className="flex items-center gap-2">
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Sending…
                            </span>
                          ) : (
                            btn.label
                          )}
                        </button>
                      </div>
                      {(person.bio || (person.skills && person.skills.length > 0)) && (
                        <div className="mt-3 space-y-2">
                          {person.bio && <p className="text-sm text-gray-700">{person.bio}</p>}
                          {person.skills && person.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {person.skills.slice(0, 3).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block rounded-full bg-[#1d1d1f] px-3 py-1 text-[11px] font-medium text-white"
                                >
                                  {skill}
                                </span>
                              ))}
                              {person.skills.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{person.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <p className="mt-4 text-center text-xs text-gray-500">
                  Found {searchResults.length}{" "}
                  {isAlumniSearcher ? "people" : "alumni"} matching &quot;{searchQuery}&quot;
                </p>
              </div>
            )}

            {!loading && searchResults.length === 0 && !error && searchQuery && (
              <div className="py-8 text-center">
                <p className="text-gray-500">Keep typing to search…</p>
              </div>
            )}

            {!searchQuery && (
              <div className="py-8 text-center text-gray-500">
                <p>
                  {isAlumniSearcher
                    ? "Find students or fellow alumni by name, branch, skills, or company."
                    : "Type a name, skill, or company to search."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchAlumni;
