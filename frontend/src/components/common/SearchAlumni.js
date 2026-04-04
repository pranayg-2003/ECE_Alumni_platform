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
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-20 px-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Search Alumni</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by name, skills, or company... (e.g., harshit, react)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
              autoFocus
            />
          </div>

          {/* Results Container */}
          <div className="max-h-96 overflow-y-auto p-4">
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Results List */}
            {!loading && searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((alumni) => (
                  <div
                    key={alumni._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                        className={`ml-4 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          sentRequests.has(alumni._id)
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
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
                    {(alumni.bio || alumni.skills.length > 0) && (
                      <div className="mt-3 space-y-2">
                        {alumni.bio && (
                          <p className="text-sm text-gray-700">{alumni.bio}</p>
                        )}
                        {alumni.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {alumni.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full"
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
                <p>💡 Type an alumni name, skill, or company to search</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchAlumni;
