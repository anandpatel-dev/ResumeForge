
import React, { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BellIcon,
  HomeIcon,
  InboxIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isDashboardHome = location.pathname === "/dashboard";

  const nav = [
    { name: "Home", to: "/dashboard", icon: <HomeIcon className="w-5 h-5" /> },
    { name: "About", to: "/dashboard/about", icon: <InboxIcon className="w-5 h-5" /> },
    { name: "Support", to: "/dashboard/support", icon: <QuestionMarkCircleIcon className="w-5 h-5" /> },
    { name: "Settings", to: "/dashboard/settings", icon: <Cog6ToothIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="flex min-h-screen bg-indigo-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm hidden md:block">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="logo" className="w-10 h-10 rounded-md object-cover" />
            <div>
              <div className="font-semibold text-indigo-700">ResumeForge</div>
              <div className="text-xs text-gray-400">Career Assistant</div>
            </div>
          </div>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.name}
              to={n.to}
              end={n.to === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg group transition ${
                  isActive ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-indigo-50"
                }`
              }
            >
              <span className="text-indigo-500 group-hover:text-indigo-700">{n.icon}</span>
              <span className="font-medium">{n.name}</span>
            </NavLink>
          ))}

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="mt-4 w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-3"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        </nav>

        <div className="px-4 mt-auto pb-6 text-xs text-gray-400">
          v1.0 • ResumeForge
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded-md">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <div className="text-lg font-semibold text-gray-800">Dashboard</div>
          </div>

          <div className="flex items-center gap-4">
            <BellIcon className="w-6 h-6 text-gray-600" />
            <div className="relative">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=6366F1&color=fff&rounded=true`}
                alt="avatar"
                className="w-9 h-9 rounded-full cursor-pointer ring-2 ring-white shadow"
                onClick={() => setDropdownOpen((s) => !s)}
              />

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg z-50">
                  <div className="px-4 py-3 border-b">
                    <div className="font-semibold text-gray-800">{user?.name || "User Name"}</div>
                    <div className="text-xs text-gray-500">{user?.email || "you@example.com"}</div>
                  </div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/dashboard/settings");
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/dashboard/settings");
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Settings
                  </button>

                  <div className="border-t mt-1" />

                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main area */}
        <main className="p-6">
          {!isDashboardHome && (
            <button
              onClick={() => navigate("/dashboard")}
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 hover:shadow"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Dashboard
            </button>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
}
