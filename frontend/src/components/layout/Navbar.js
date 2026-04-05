import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import SearchAlumni from "../common/SearchAlumni";

const IconHome = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const IconUser = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const IconSearch = () => (
  <svg className="h-5 w-5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const IconNetwork = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.09 9.09 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m0 0l.001-.193M6 18.72l.001-.193M18 18.72l-.001-.193" />
  </svg>
);

const IconGrad = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658.813A48.255 48.255 0 0 0 12 4.25c2.43 0 4.754.448 6.846 1.272a50.65 50.65 0 0 0 2.658-.813m0 0A48.254 48.254 0 0 1 12 2.25c-2.43 0-4.754.448-6.846 1.272" />
  </svg>
);

const IconReferrals = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
    />
  </svg>
);

const IconInitiatives = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
    />
  </svg>
);

const IconChat = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

const NavBtn = ({ children, label, onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title || label}
    className="flex flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[#1d1d1f] transition-colors hover:text-[#0071e3] bg-transparent border-0 cursor-pointer font-inherit"
  >
    {children}
    <span className="hidden text-[11px] font-medium sm:block">{label}</span>
  </button>
);

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

  const homeRoute = user?.role === "admin" ? "/dashboard/admin" : "/feed";

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-black/[0.08] bg-white/80 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 font-apple">
          <div
            className="flex cursor-pointer items-center gap-2.5"
            onClick={() => navigate(homeRoute)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(homeRoute)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#1d1d1f]">
              <span className="text-[13px] font-semibold text-white">M</span>
            </div>
            <span className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">MentorBridge</span>
          </div>

          {user && (user.role === "student" || user.role === "alumni") && (
            <div className="hidden w-1/3 max-w-md items-center gap-2 rounded-full border border-black/[0.08] bg-[#f5f5f7]/90 px-4 py-2 md:flex">
              <IconSearch />
              <input
                type="text"
                placeholder={
                  user.role === "alumni" ? "Search students & alumni…" : "Search alumni…"
                }
                onFocus={() => setIsSearchOpen(true)}
                readOnly
                className="w-full cursor-pointer bg-transparent text-[15px] text-[#1d1d1f] outline-none placeholder:text-neutral-400"
              />
            </div>
          )}

          {user && (
            <div className="flex items-center gap-1 text-[#1d1d1f] sm:gap-2">
              <NavBtn
                label="Home"
                onClick={() => navigate(user.role === "admin" ? "/dashboard/admin" : "/feed")}
              >
                <IconHome />
              </NavBtn>

              <NavBtn label="Initiatives" title="Funding & alumni events" onClick={() => navigate("/initiatives")}>
                <IconInitiatives />
              </NavBtn>

              {(user.role === "student" || user.role === "alumni" || user.role === "admin") && (
                <NavBtn
                  label="Referrals"
                  title={user.role === "student" ? "Seek referrals from alumni" : "Student referral requests"}
                  onClick={() => navigate("/referrals")}
                >
                  <IconReferrals />
                </NavBtn>
              )}

              <NavBtn label="Profile" onClick={() => navigate("/profile")}>
                <IconUser />
              </NavBtn>

              {user.role === "student" && (
                <NavBtn
                  label="Network"
                  title="Browse alumni & send requests"
                  onClick={() => navigate("/dashboard/student")}
                >
                  <IconNetwork />
                </NavBtn>
              )}

              {user.role === "alumni" && (
                <NavBtn label="Mentees" onClick={() => navigate("/menteeProgram")}>
                  <IconGrad />
                </NavBtn>
              )}

              {user.role !== "admin" && (
                <NavBtn label="Messages" onClick={() => toggleMessagesPanel()}>
                  <span className="relative inline-flex">
                    <IconChat />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0071e3] px-0.5 text-[10px] font-semibold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </span>
                </NavBtn>
              )}

              <div className="relative pl-1" ref={meMenuRef}>
                <button
                  type="button"
                  onClick={() => setMeMenuOpen((o) => !o)}
                  className="flex flex-col items-center gap-0.5 rounded-xl border-0 bg-transparent p-1 font-inherit cursor-pointer"
                  aria-expanded={meMenuOpen}
                  aria-haspopup="true"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f7] text-[12px] font-semibold text-[#1d1d1f] ring-1 ring-black/[0.08] ${meMenuOpen ? "ring-2 ring-[#0071e3]/40" : ""}`}
                  >
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden text-[11px] font-medium sm:block">Me</span>
                </button>

                {meMenuOpen && (
                  <div className="absolute right-0 top-full z-[100] mt-2 w-56 overflow-hidden rounded-2xl border border-black/[0.08] bg-white/95 py-1 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                    <p className="truncate border-b border-black/[0.06] px-4 py-2.5 text-[12px] font-medium text-neutral-500">
                      {user.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMeMenuOpen(false);
                        navigate("/profile");
                      }}
                      className="block w-full px-4 py-2.5 text-left text-[15px] text-[#1d1d1f] hover:bg-[#f5f5f7]"
                    >
                      View profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMeMenuOpen(false);
                        navigate("/initiatives");
                      }}
                      className="block w-full px-4 py-2.5 text-left text-[15px] text-[#1d1d1f] hover:bg-[#f5f5f7]"
                    >
                      Initiatives
                    </button>
                    {(user.role === "student" || user.role === "alumni" || user.role === "admin") && (
                      <button
                        type="button"
                        onClick={() => {
                          setMeMenuOpen(false);
                          navigate("/referrals");
                        }}
                        className="block w-full px-4 py-2.5 text-left text-[15px] text-[#1d1d1f] hover:bg-[#f5f5f7]"
                      >
                        Referral board
                      </button>
                    )}
                    {user.role === "student" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMeMenuOpen(false);
                          navigate("/dashboard/student");
                        }}
                        className="block w-full px-4 py-2.5 text-left text-[15px] text-[#1d1d1f] hover:bg-[#f5f5f7]"
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
                        className="block w-full px-4 py-2.5 text-left text-[15px] text-[#1d1d1f] hover:bg-[#f5f5f7]"
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
                        className="block w-full px-4 py-2.5 text-left text-[15px] text-[#1d1d1f] hover:bg-[#f5f5f7]"
                      >
                        Admin dashboard
                      </button>
                    )}
                    <div className="my-1 border-t border-black/[0.06]" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2.5 text-left text-[15px] font-medium text-red-600 hover:bg-red-50"
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
        variant={user?.role === "alumni" ? "alumni" : "student"}
      />
    </>
  );
};

export default Navbar;
