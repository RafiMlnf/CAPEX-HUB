"use client";

import { useCapex } from "../context/CapexContext";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function Header({ title, subtitle, children }: HeaderProps) {
  const { proposals, activeRole, currentUser, logout, hasPermission } = useCapex();
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute pending actions based on active role
  const notifications = (() => {
    const list: { id: string; title: string; desc: string; type: string }[] = [];

    proposals.forEach((p) => {
      const status = (p.gateStatus || "").toLowerCase();

      if (status.includes("idea") && hasPermission("perm_review_capex")) {
        list.push({
          id: `${p.id}-idea`,
          title: "New Investment Idea",
          desc: `${p.id}: ${p.name} is awaiting Finance verification.`,
          type: "planning",
        });
      }
      if (status.includes("committee") && hasPermission("perm_committee_review")) {
        list.push({
          id: `${p.id}-committee`,
          title: "Committee Approval",
          desc: `${p.id}: ${p.name} is awaiting approval decision.`,
          type: "approval",
        });
      }
      if (status.includes("procurement") && (hasPermission("perm_create_price") || hasPermission("perm_manage_master_price"))) {
        list.push({
          id: `${p.id}-procurement`,
          title: "PO Issuance",
          desc: `${p.id}: ${p.name} requires PO number entry.`,
          type: "realization",
        });
      }
      if (status.includes("commissioning") && hasPermission("perm_create_capex")) {
        list.push({
          id: `${p.id}-commissioning`,
          title: "Upload Handover Report",
          desc: `${p.id}: ${p.name} requires Handover Report (BAST) upload.`,
          type: "realization",
        });
      }
      if (status.includes("benefit") && hasPermission("perm_create_capex")) {
        list.push({
          id: `${p.id}-benefit`,
          title: "Benefit Realization",
          desc: `${p.id}: ${p.name} benefit realization needs to be reported.`,
          type: "realization",
        });
      }
      if (status.includes("closing") && hasPermission("perm_closing_capex")) {
        list.push({
          id: `${p.id}-closing`,
          title: "PIR Evaluation",
          desc: `${p.id}: ${p.name} is ready for closing and PIR evaluation.`,
          type: "realization",
        });
      }
    });

    return list;
  })();

  return (
    <header className="bg-white border-b border-slate-200 px-6 h-18 sticky top-0 z-20 shadow-xs flex items-center">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {children}

          {/* Notification Bell Dropdown */}
          <div className="relative flex items-center" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative p-2.5 text-slate-600 hover:text-blue-600 bg-slate-100 border border-slate-200 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-medium text-white items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Pending Tasks</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                    {notifications.length} Pending
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 italic text-xs space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="font-medium text-slate-600">All tasks completed!</p>
                      <p className="text-[10px] text-slate-400">No CAPEX proposals require your review at this time.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-3.5 hover:bg-slate-50 transition-colors flex gap-3">
                        <span className="w-1 h-auto rounded bg-blue-600 self-stretch shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-slate-800">{notif.title}</p>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{notif.desc}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {currentUser && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 relative" ref={accountRef}>
              <div
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="flex items-center gap-3 cursor-pointer group select-none"
                title="Account Settings"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{currentUser.name}</p>
                </div>

                {currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.name}
                    className="w-8.5 h-8.5 rounded-xl border border-slate-300 object-cover group-hover:border-blue-600 transition-all"
                  />
                ) : (
                  <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-semibold text-blue-600 text-xs select-none group-hover:border-blue-600 transition-all">
                    {currentUser.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {isAccountOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-5 z-50 space-y-4">
                  <div className="flex flex-col items-center text-center space-y-2.5 pb-2.5 border-b border-slate-200">
                    <div className="relative">
                      {currentUser.photoUrl ? (
                        <img
                          src={currentUser.photoUrl}
                          alt="Avatar"
                          className="w-16 h-16 rounded-2xl border-2 border-blue-500 object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center font-semibold text-blue-600 text-lg select-none">
                          {currentUser.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{currentUser.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{currentUser.role} &bull; {currentUser.department}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(currentUser?.can_admin === true ||
                      (currentUser?.allowed_portals && currentUser.allowed_portals.includes("admin")) ||
                      (currentUser?.role || "").toLowerCase() === "admin" ||
                      hasPermission("perm_manage_config") ||
                      hasPermission("ALL_ACCESS")) && (
                      <a
                        href="/admin"
                        className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center justify-center text-[10px] uppercase tracking-wider gap-1.5 border border-blue-200"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Portal Admin & Settings
                      </a>
                    )}
                    <button
                      onClick={logout}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center justify-center text-[10px] uppercase tracking-wider gap-1.5 shadow-2xs"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
