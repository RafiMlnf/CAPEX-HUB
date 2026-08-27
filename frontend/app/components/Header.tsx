"use client";

import { useCapex } from "../context/CapexContext";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function Header({ title, subtitle, children }: HeaderProps) {
  const { proposals, activeRole, currentUser, logout } = useCapex();
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
      if (p.gateStatus === "Gate 0 - Idea" && (activeRole === "Finance" || activeRole === "Admin")) {
        list.push({
          id: `${p.id}-g0`,
          title: "New Investment Idea (Gate 0)",
          desc: `${p.id}: ${p.name} is awaiting Finance verification.`,
          type: "planning",
        });
      }
      if (p.gateStatus === "Gate 2 - Committee Review" && (activeRole === "Investment Committee" || activeRole === "Admin")) {
        list.push({
          id: `${p.id}-g2`,
          title: "Committee Approval (Gate 2)",
          desc: `${p.id}: ${p.name} is awaiting approval decision.`,
          type: "approval",
        });
      }
      if (p.gateStatus === "Gate 3 - Procurement" && (activeRole === "Procurement" || activeRole === "Admin")) {
        list.push({
          id: `${p.id}-g3`,
          title: "PO Issuance (Gate 3)",
          desc: `${p.id}: ${p.name} requires PO number entry.`,
          type: "realization",
        });
      }
      if (p.gateStatus === "Gate 4 - Commissioning" && (activeRole === "Proposer" || activeRole === "Admin")) {
        list.push({
          id: `${p.id}-g4`,
          title: "Upload Handover Report (Gate 4)",
          desc: `${p.id}: ${p.name} requires Handover Report (BAST) upload.`,
          type: "realization",
        });
      }
      if (p.gateStatus === "Gate 5 - Benefit Realization" && (activeRole === "Proposer" || activeRole === "Admin")) {
        list.push({
          id: `${p.id}-g5`,
          title: "Benefit Realization (Gate 5)",
          desc: `${p.id}: ${p.name} benefit realization needs to be reported.`,
          type: "realization",
        });
      }
      if (p.gateStatus === "Gate 6 - Project Closing" && (activeRole === "Finance" || activeRole === "Admin")) {
        list.push({
          id: `${p.id}-g6`,
          title: "PIR Evaluation (Gate 6)",
          desc: `${p.id}: ${p.name} is ready for closing and PIR evaluation.`,
          type: "realization",
        });
      }
    });

    return list;
  })();

  return (
    <header className="bg-white border-b border-slate-200 px-6 h-18 sticky top-0 z-20 shadow-2xs flex items-center">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            {title}
            <span className="text-slate-400 hover:text-slate-600 transition-colors cursor-help text-xs" title="Informasi Halaman">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {children}

          {/* Notification Bell Dropdown */}
          <div className="relative flex items-center" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative p-2 text-slate-600 hover:text-blue-600 bg-slate-50 border border-slate-200 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-1 inline-flex rounded-full h-3.5 w-3.5 bg-red-500 text-[8px] font-bold text-white items-center justify-center">
                {notifications.length > 0 ? notifications.length : 1}
              </span>
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
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 relative" ref={accountRef}>
              <div
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="flex items-center gap-2.5 cursor-pointer group select-none"
                title="Pengaturan Akun"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-bold text-slate-700 tracking-wider uppercase group-hover:text-blue-600 transition-colors">
                    {currentUser.name || "ADMINISTRATOR SYSTEM"}
                  </p>
                </div>

                {currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg border border-slate-300 object-cover group-hover:border-blue-600 transition-all"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-600 text-xs select-none group-hover:border-blue-600 transition-all">
                    {(currentUser.name || "AS")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase() || "AS"}
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

                  <div>
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
