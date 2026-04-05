import React from "react";
import Navbar from "../components/layout/Navbar";
import CreatePost from "../components/post/CreatePost";
import PostCard from "../components/post/PostCard";
import { usePost } from "../context/PostContext";
import ProfileSection from "../components/common/ProfileSection";

const Feed = () => {
  const { posts, loading } = usePost();

  return (
    <div className="dashboard-apple-bg font-apple min-h-screen">
      <Navbar />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 lg:grid-cols-12 lg:gap-8 lg:p-6">
        <div className="min-w-0 lg:col-span-3">
          <ProfileSection variant="feed" />
        </div>

        <div className="space-y-4 lg:col-span-6">
          <CreatePost />
          {loading ? (
            <p className="text-[15px] text-neutral-500">Loading posts…</p>
          ) : (
            posts.map((post) => <PostCard key={post._id} post={post} />)
          )}
        </div>

        <div className="space-y-4 lg:col-span-3">
          <div className="apple-glass-card overflow-hidden p-5">
            <div className="h-0.5 w-full rounded-full bg-[#0071e3]/80" />
            <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-[#1d1d1f]">Post tips</h3>
            <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-neutral-600">
              <li>Add a clear photo or PDF to support your update.</li>
              <li>Short, readable paragraphs work best.</li>
              <li>Mix images with documents in one post when it helps.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
