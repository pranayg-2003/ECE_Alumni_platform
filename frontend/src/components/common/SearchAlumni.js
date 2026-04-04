// src/components/common/SearchAlumni.js
// Search bar and results dropdown for finding alumni

import React, { useState, useEffect } from "react";
import { searchAlumni, sendMentorshipRequest } from "../../utils/api";
import { toastApiError } from "../../utils/toast";

const SearchAlumni = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentRequests, setSentRequests] = useState(new Set()); // Track sent requests
  const [sendingId, setSendingId] = useState(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    // Wait 300ms before searching (debounce)
    const timer = setTimeout(async () => {
      try {
        const response = await searchAlumni(searchQuery);
        setSearchResults(response.data || []);

        if (response.data.length === 0) {
          setError("No alumni found matching your search");
        }
      } catch (err) {
        toastApiError(
          err,
          "Failed to search alumni. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle send request button
  const handleSendRequest = async (alumniId) => {
    if (sentRequests.has(alumniId)) {
      return; // Already sent
    }

    setSendingId(alumniId);
    try {
      await sendMentorshipRequest(alumniId, "");
      setSentRequests((prev) => new Set([...prev, alumniId]));
    } catch (err) {
      toastApiError(err, "Failed to send request. Please try again.");
    } finally {
      setSendingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
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
              <h2 className="text-[20px] font-semibold tracking-tight text-white">Search alumni</h2>
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
              placeholder="Name, skills, or company…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/45 focus:border-[#2997ff]/60 focus:ring-2 focus:ring-[#2997ff]/30"
              autoFocus
            />
          </div>

          <div className="max-h-[min(420px,70vh)] overflow-y-auto p-4">
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent" />
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-[14px] text-red-800">
                {error}
              </div>
            )}

            {/* Results List */}
            {!loading && searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((alumni) => (
                  <div
                    key={alumni._id}
                    className="rounded-2xl border border-black/[0.08] bg-[#f5f5f7]/50 p-4 transition hover:bg-white hover:shadow-md"
                  >
                    {/* Alumni Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {alumni.name}
                        </h3>
                        {alumni.jobTitle && (
                          <p className="text-sm text-gray-600">
                            {alumni.jobTitle}
                            {alumni.company && ` at ${alumni.company}`}
                          </p>
                        )}
                        {alumni.graduationYear && (
                          <p className="text-xs text-gray-500">
                            Graduated: {alumni.graduationYear}
                          </p>
                        )}
                      </div>

                      {/* Send Request Button */}
                      <button
                        onClick={() => handleSendRequest(alumni._id)}
                        disabled={
                          sentRequests.has(alumni._id) || sendingId === alumni._id
                        }
                        className={`ml-4 shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition ${
                          sentRequests.has(alumni._id)
                            ? "cursor-not-allowed bg-[#f5f5f7] text-neutral-400"
                            : "bg-[#0071e3] text-white hover:bg-[#0077ed]"
                        }`}
                      >
                        {sendingId === alumni._id ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Sending...
                          </span>
                        ) : sentRequests.has(alumni._id) ? (
                          "Request Sent ✓"
                        ) : (
                          "Send Request"
                        )}
                      </button>
                    </div>

                    {/* Alumni Bio & Skills */}
                    {(alumni.bio || (alumni.skills && alumni.skills.length > 0)) && (
                      <div className="mt-3 space-y-2">
                        {alumni.bio && (
                          <p className="text-sm text-gray-700">{alumni.bio}</p>
                        )}
                        {alumni.skills && alumni.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {alumni.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-block rounded-full bg-[#1d1d1f] px-3 py-1 text-[11px] font-medium text-white"
                              >
                                {skill}
                              </span>
                            ))}
                            {alumni.skills.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{alumni.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Show count */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  Found {searchResults.length} alumni matching "{searchQuery}"
                </p>
              </div>
            )}

            {/* Empty State */}
            {!loading && searchResults.length === 0 && !error && searchQuery && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Start typing to search for alumni...
                </p>
              </div>
            )}

            {/* Initial State */}
            {!searchQuery && (
              <div className="text-center py-8 text-gray-500">
                <p>Type a name, skill, or company to search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchAlumni;
