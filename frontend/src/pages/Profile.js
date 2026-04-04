import React from "react";
import Navbar from "../components/layout/Navbar";
import ProfileSection from "../components/common/ProfileSection";

const Profile = () => {
  return (
    <div className="dashboard-apple-bg font-apple min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-[28px] font-semibold tracking-tight text-[#1d1d1f] sm:text-[32px]">
          Profile
        </h1>
        <ProfileSection />
      </div>
    </div>
  );
};

export default Profile;
