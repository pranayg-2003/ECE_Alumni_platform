import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import SearchAlumni from "../common/SearchAlumni";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount, toggleMessagesPanel } = useChat();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [meMenuOpen, setMeMenuOpen] = useState(false);
  const meMenuRef = useRef(null);

  const handleLogout = () => {
    setMeMenuOpen(false);
    logout();
    navigate("/");
  };

  useEffect(() => {
    if (!meMenuOpen) return;
    const close = (e) => {
      if (meMenuRef.current && !meMenuRef.current.contains(e.target)) {
        setMeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [meMenuOpen]);

  const homeRoute =
    user?.role === "admin" ? "/dashboard/admin" : "/feed";

  return (
    <>
      <nav className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate(homeRoute)}
          >
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-gray-800 text-lg">
              MentorBridge
            </span>
          </div>

          {user && (
            <div className="hidden md:flex items-center bg-gray-100 px-3 py-2 rounded-full w-1/3">
              <span className="text-gray-500 mr-2">🔍</span>
              <input
                type="text"
                placeholder="Search alumni..."
                onFocus={() => user.role === "student" && setIsSearchOpen(true)}
                className="bg-transparent outline-none w-full text-sm text-gray-700"
              />
            </div>
          )}

          {user && (
            <div className="flex items-center gap-4 sm:gap-5 text-gray-600">
              <button
                type="button"
                onClick={() =>
                  navigate(user.role === "admin" ? "/dashboard/admin" : "/feed")
                }
                className="flex flex-col items-center cursor-pointer hover:text-black text-xs bg-transparent border-0 p-0 font-inherit"
              >
                <span className="text-lg">🏠</span>
                <span className="hidden sm:block">Home</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="flex flex-col items-center cursor-pointer hover:text-black text-xs bg-transparent border-0 p-0 font-inherit"
              >
                <span className="text-lg">👤</span>
                <span className="hidden sm:block">Profile</span>
              </button>

              {user.role === "student" && (
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/student")}
                  className="flex flex-col items-center cursor-pointer hover:text-black text-xs bg-transparent border-0 p-0 font-inherit"
                  title="Browse alumni & send requests"
                >
                  <span className="text-lg">🔎</span>
                  <span className="hidden sm:block">Network</span>
                </button>
              )}

              {user.role === "alumni" && (
                <button
                  type="button"
                  onClick={() => navigate("/menteeProgram")}
                  className="flex flex-col items-center cursor-pointer hover:text-black text-xs bg-transparent border-0 p-0 font-inherit"
                >
                  <span className="text-lg">🎓</span>
                  <span className="hidden sm:block">Mentees</span>
                </button>
              )}

              {user.role !== "admin" && (
                <button
                  type="button"
                  onClick={() => toggleMessagesPanel()}
                  className="relative flex flex-col items-center cursor-pointer hover:text-black text-xs bg-transparent border-0 p-0 font-inherit"
                >
                  <span className="text-lg">💬</span>
                  <span className="hidden sm:block">Messages</span>

                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] px-1 rounded-full min-w-[1.25rem]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              )}

              <div className="relative" ref={meMenuRef}>
                <button
                  type="button"
                  onClick={() => setMeMenuOpen((o) => !o)}
                  className="flex flex-col items-center cursor-pointer hover:text-black text-xs bg-transparent border-0 p-0 font-inherit"
                  aria-expanded={meMenuOpen}
                  aria-haspopup="true"
                >
                  <div
                    className={`w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold flex items-center justify-center ${meMenuOpen ? "ring-2 ring-indigo-400" : ""}`}
                  >
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:block mt-0.5">Me</span>
                </button>

                {meMenuOpen && (
                  <div className="absolute right-0 top-full z-[100] mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-200/80">
                    <p className="truncate px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">
                      {user.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMeMenuOpen(false);
                        navigate("/profile");
                      }}
                      className="block w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      View profile
                    </button>
                    {user.role === "student" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMeMenuOpen(false);
                          navigate("/dashboard/student");
                        }}
                        className="block w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Student dashboard
                      </button>
                    )}
                    {user.role === "alumni" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMeMenuOpen(false);
                          navigate("/menteeProgram");
                        }}
                        className="block w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Mentee program
                      </button>
                    )}
                    {user.role === "admin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMeMenuOpen(false);
                          navigate("/dashboard/admin");
                        }}
                        className="block w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Admin dashboard
                      </button>
                    )}
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <SearchAlumni
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default Navbar;
