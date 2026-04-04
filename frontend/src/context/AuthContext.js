// src/context/AuthContext.js
// React Context for managing authentication state globally
// Any component can access user info and auth functions via this context

import React, { createContext, useContext, useState, useEffect } from "react";
import api, { updateMyProfile } from "../utils/api";

// Create the context
const AuthContext = createContext(null);

// ============================================
// AUTH PROVIDER COMPONENT
// ============================================
// Wraps the entire app to provide auth state to all components
export const AuthProvider = ({ children }) => {
  // Store the current user object
  const [user, setUser] = useState(null);

  // Track loading state (important for initial auth check)
  const [loading, setLoading] = useState(true);

  // ============================================
  // On app load: Check if user is already logged in
  // ============================================
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          // Verify token is still valid by calling /api/auth/me
          const response = await api.get("/auth/me");
          const u = response.data.user;
          setUser(u);
          localStorage.setItem("user", JSON.stringify(u));
        } catch (error) {
          // Token is invalid or expired — clear storage
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }

      setLoading(false); // Done checking
    };

    initAuth();
  }, []);

  // ============================================
  // LOGIN FUNCTION
  // ============================================
  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data;

    // Save to localStorage for persistence across page refreshes
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    return user; // Return user so the component can redirect based on role
  };

  // ============================================
  // REGISTER FUNCTION
  // ============================================
  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);
    const { token, user } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    return user;
  };

  // ============================================
  // LOGOUT FUNCTION
  // ============================================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const body = await updateMyProfile(payload);
    if (body.user) {
      setUser(body.user);
      localStorage.setItem("user", JSON.stringify(body.user));
    }
    return body;
  };

  // Values exposed to all child components
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user, // Boolean: true if user is logged in
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// CUSTOM HOOK: useAuth
// ============================================
// Makes it easy to use auth context in any component
// Usage: const { user, login, logout } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
};
