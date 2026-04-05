import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  fetchPosts,
  createPost as createPostApi,
  toggleLikePost as toggleLikePostApi,
  addPostComment as addPostCommentApi,
  updatePost as updatePostApi,
  deletePost as deletePostApi,
} from "../utils/api";
import { toastApiError } from "../utils/toast";
import { useAuth } from "./AuthContext";

const PostContext = createContext();

export const usePost = () => useContext(PostContext);

export const PostProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const body = await fetchPosts();
      setPosts(body.data || []);
    } catch (err) {
      toastApiError(err, "Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    loadPosts();
  }, [authLoading, user, loadPosts]);

  const addPost = async (payload) => {
    try {
      setSubmitting(true);
      const body = await createPostApi(payload);
      if (body.data) {
        setPosts((prev) => [body.data, ...prev]);
      }
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to create post.";
      toastApiError(err, message);
      return { success: false, message };
    } finally {
      setSubmitting(false);
    }
  };

  const likePost = async (id) => {
    try {
      const body = await toggleLikePostApi(id);
      setPosts((prev) => {
        const idx = prev.findIndex((p) => p._id === id);
        if (idx === -1 && body.data) return [body.data, ...prev];
        return prev.map((post) => (post._id === id ? body.data : post));
      });
    } catch (err) {
      toastApiError(err, "Failed to update like.");
    }
  };

  const addComment = async (id, text) => {
    try {
      const body = await addPostCommentApi(id, text);
      setPosts((prev) => {
        const idx = prev.findIndex((p) => p._id === id);
        if (idx === -1 && body.data) return [body.data, ...prev];
        return prev.map((post) => (post._id === id ? body.data : post));
      });
    } catch (err) {
      toastApiError(err, "Failed to add comment.");
    }
  };

  const updatePost = async (id, payload) => {
    try {
      const body = await updatePostApi(id, payload);
      setPosts((prev) => {
        const idx = prev.findIndex((p) => p._id === id);
        if (idx === -1 && body.data) return [body.data, ...prev];
        return prev.map((p) => (p._id === id ? body.data : p));
      });
      return { success: body.success !== false };
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to update post.";
      toastApiError(err, message);
      return { success: false, message };
    }
  };

  const deletePost = async (id) => {
    try {
      await deletePostApi(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete post.";
      toastApiError(err, message);
      return { success: false, message };
    }
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
        submitting,
        addPost,
        likePost,
        addComment,
        updatePost,
        deletePost,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
