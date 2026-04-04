import React from "react";
import Navbar from "../components/layout/Navbar";
import ProfileSection from "../components/common/ProfileSection";

const Profile = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          My Profile
        </h1>
        <ProfileSection />
      </div>
    </div>
  );
};

export default Profile;
