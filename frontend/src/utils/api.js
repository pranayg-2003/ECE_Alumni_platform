// src/utils/api.js
// Centralized Axios instance for all API calls
// This ensures we don't repeat the base URL in every component

import axios from "axios";
import toast from "react-hot-toast";

// Create Axios instance with default config
const api = axios.create({
  baseURL: "http://localhost:5000/api", // Backend server URL
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================
// Automatically attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const url = `${config.baseURL || ""}${config.url || ""}`.toLowerCase();
    const isPublicAuth =
      url.includes("auth/login") ||
      url.includes("auth/register") ||
      url.includes("auth/forgot-password") ||
      url.includes("auth/reset-password");

    // Do not send JWT on login/register — avoids mixing sessions and odd server edge cases
    if (isPublicAuth) {
      delete config.headers.Authorization;
    } else {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
// Handle 401 errors globally (token expired / invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadSession = !!localStorage.getItem("token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const path = window.location.pathname;
      const stayOnPage =
        path === "/login" ||
        path === "/register" ||
        path === "/forgot-password";
      if (!stayOnPage) {
        if (hadSession) {
          toast.error("Session expired. Please sign in again.");
        }
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

// ============================================
// ALUMNI SEARCH & MENTORSHIP REQUEST FUNCTIONS
// ============================================

/**
 * Search for alumni by name, skills, company
 * @param {string} searchQuery - Search term (e.g., "harshit", "react")
 * @returns {Promise} - Array of matching alumni
 */
export const searchAlumni = async (searchQuery) => {
  const response = await api.get("/users/search-alumni", {
    params: { q: searchQuery },
  });
  return response.data;
};

/** Alumni: search students and other alumni */
export const searchNetwork = async (searchQuery) => {
  const response = await api.get("/users/search-network", {
    params: { q: searchQuery },
  });
  return response.data;
};

/**
 * Get public profile for a student or alumni user
 * @param {string} userId - User ID
 */
export const getAlumniProfile = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

/**
 * Send mentorship request to alumni
 * @param {string} alumniId - Alumni user ID
 * @param {string} message - Optional message from student
 * @returns {Promise} - Request confirmation
 */
export const sendMentorshipRequest = async (alumniId, message = "") => {
  const response = await api.post("/users/send-request", {
    alumniId,
    message,
  });
  return response.data;
};

export const fetchPosts = async () => {
  const response = await api.get("/posts");
  return response.data;
};

export const createPost = async (payload) => {
  const response = await api.post("/posts", payload);
  return response.data;
};

export const toggleLikePost = async (postId) => {
  const response = await api.put(`/posts/${postId}/like`);
  return response.data;
};

export const addPostComment = async (postId, text) => {
  const response = await api.post(`/posts/${postId}/comments`, { text });
  return response.data;
};

export const updatePost = async (postId, payload) => {
  const response = await api.put(`/posts/${postId}`, payload);
  return response.data;
};

/**
 * Upload images (JPEG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX, TXT) to Cloudinary via the API.
 * @param {File[]} files
 * @returns {Promise<{ success: boolean, data?: Array<{ url, resourceType, originalName, mimeType, publicId }>, message?: string }>}
 */
export const uploadPostMedia = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const response = await api.post("/upload", formData);
  return response.data;
};

export const updateMyProfile = async (payload) => {
  const response = await api.put("/auth/profile", payload);
  return response.data;
};

export const fetchLandingContent = async () => {
  const response = await api.get("/site/landing");
  return response.data;
};

export const updateLandingContent = async (landing) => {
  const response = await api.put("/site/landing", { landing });
  return response.data;
};

/** College funding campaigns & alumni events (Google Meet) */
export const fetchFundingCampaigns = async () => {
  const response = await api.get("/community/funding");
  return response.data;
};

export const createFundingCampaign = async (payload) => {
  const response = await api.post("/community/funding", payload);
  return response.data;
};

export const updateFundingCampaign = async (id, payload) => {
  const response = await api.put(`/community/funding/${id}`, payload);
  return response.data;
};

export const deleteFundingCampaign = async (id) => {
  const response = await api.delete(`/community/funding/${id}`);
  return response.data;
};

export const fetchRazorpayMeta = async () => {
  const response = await api.get("/community/payments/razorpay-meta");
  return response.data;
};

export const createFundingPayOrder = async (campaignId, amountRupees) => {
  const response = await api.post(`/community/funding/${campaignId}/order`, { amountRupees });
  return response.data;
};

export const verifyFundingPay = async (campaignId, body) => {
  const response = await api.post(`/community/funding/${campaignId}/verify-payment`, body);
  return response.data;
};

export const fetchAlumniEvents = async () => {
  const response = await api.get("/community/events");
  return response.data;
};

export const createAlumniEvent = async (payload) => {
  const response = await api.post("/community/events", payload);
  return response.data;
};

export const updateAlumniEvent = async (id, payload) => {
  const response = await api.put(`/community/events/${id}`, payload);
  return response.data;
};

export const deleteAlumniEvent = async (id) => {
  const response = await api.delete(`/community/events/${id}`);
  return response.data;
};

/** Student referral requests visible to alumni */
export const fetchReferralBoard = async (params) => {
  const response = await api.get("/referrals/board", { params });
  return response.data;
};

export const fetchMyReferralSeeks = async () => {
  const response = await api.get("/referrals/mine");
  return response.data;
};

export const createReferralSeek = async (payload) => {
  const response = await api.post("/referrals", payload);
  return response.data;
};

export const updateReferralSeek = async (id, payload) => {
  const response = await api.put(`/referrals/${id}`, payload);
  return response.data;
};

export const deleteReferralSeekApi = async (id) => {
  const response = await api.delete(`/referrals/${id}`);
  return response.data;
};

export default api;
