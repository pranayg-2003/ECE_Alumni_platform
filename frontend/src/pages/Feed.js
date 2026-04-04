import React from "react";
import Navbar from "../components/layout/Navbar";
import CreatePost from "../components/post/CreatePost";
import PostCard from "../components/post/PostCard";
import { usePost } from "../context/PostContext";
import ProfileSection from "../components/common/ProfileSection";

const Feed = () => {
  const { posts, loading, error } = usePost();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <ProfileSection />
        </div>

        <div className="lg:col-span-6 space-y-4">
          <CreatePost />
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          {loading ? (
            <p className="text-sm text-gray-500">Loading posts...</p>
          ) : (
            posts.map((post) => <PostCard key={post._id} post={post} />)
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-purple-600" />
            <h3 className="font-semibold text-gray-800 mt-3">Post tips</h3>
            <ul className="mt-3 text-sm text-gray-600 space-y-2">
              <li>Add a clear photo or a PDF to support your update.</li>
              <li>Keep captions readable — short paragraphs work well.</li>
              <li>You can mix images with documents in one post.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
