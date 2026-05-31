import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import ProfileSection from "../components/common/ProfileSection";
import PostCard from "../components/post/PostCard";
import { useAuth } from "../context/AuthContext";
import { usePost } from "../context/PostContext";

const Profile = () => {
  const { user } = useAuth();
  const { posts, loading } = usePost();

  const myPosts = useMemo(() => {
    if (!user?.id || !posts?.length) return [];
    const uid = String(user.id);
    return posts
      .filter((p) => {
        const aid = p.author?._id ?? p.author;
        return aid != null && String(aid) === uid;
      })
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [posts, user?.id]);

  return (
    <div className="dashboard-apple-bg min-h-screen overflow-x-hidden font-sans">
      <Navbar />
      <ProfileSection variant="page">
        <section className="min-w-0" aria-labelledby="profile-posts-heading">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="profile-posts-heading"
                className="app-nitj-section-title text-[22px] sm:text-[24px]"
              >
                Posts
              </h2>
              <p className="mt-1 text-[15px] text-neutral-600">
                {loading
                  ? "Loading your activity…"
                  : myPosts.length === 0
                    ? "Nothing published yet—share an update on the feed."
                    : `${myPosts.length} on the feed`}
              </p>
            </div>
            <Link
              to="/feed"
              className="app-nitj-btn-primary w-fit px-5 py-2.5 text-[15px]"
            >
              Go to feed
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]"
                />
              ))}
            </div>
          ) : myPosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/[0.12] bg-white px-6 py-14 text-center shadow-sm ring-1 ring-black/[0.06]">
              <p className="font-nitj text-[17px] font-bold text-nitj-navy">No posts yet</p>
              <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-neutral-600">
                When you publish on the community feed, your stories show up here automatically.
              </p>
              <Link
                to="/feed"
                className="app-nitj-btn-secondary mt-5 px-6 py-3 text-[15px]"
              >
                Open feed
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {myPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </section>
      </ProfileSection>
    </div>
  );
};

export default Profile;
