// src/components/common/ProtectedRoute.js
// This component wraps routes that require authentication.
// If the user is not logged in, they get redirected to /login.
// If they don't have the required role, they get redirected to their own dashboard.

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Show a loading spinner while we check auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, send to marketing landing (guests can open Log in / Sign up)
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If roles are specified, check if user has permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleRedirects = {
      student: "/feed",
      alumni: "/feed",
      admin: "/dashboard/admin",
    };
    return <Navigate to={roleRedirects[user.role]} replace />;
  }

  // All checks passed — render the protected component
  return children;
};

export default ProtectedRoute;
