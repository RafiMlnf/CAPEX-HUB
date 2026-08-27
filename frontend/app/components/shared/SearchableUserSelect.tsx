"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { User } from "../../lib/api";

interface SearchableUserSelectProps {
  users: User[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  valueKey?: "id" | "name";
  excludeRoles?: string[];
  disabled?: boolean;
}

export default function SearchableUserSelect({
  users,
  value,
  onChange,
  placeholder = "Pilih / Cari User...",
  valueKey = "id",
  excludeRoles = ["admin"],
  disabled = false,
}: SearchableUserSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  // Filter out excluded roles (strictly exclude all admin / administrator accounts)
  const filteredUsers = useMemo(() => {
    const s = search.toLowerCase().trim();
    return users
      .filter((u) => {
        const role = (u.role || "").toLowerCase();
        const username = (u.username || "").toLowerCase();
        const name = (u.name || "").toLowerCase();
        const dept = (u.department || "").toLowerCase();

        const isAdmin =
          role.includes("admin") ||
          username.includes("admin") ||
          name.includes("admin") ||
          name.includes("administrator") ||
          dept.includes("admin");

        return !isAdmin;
      })
      .filter((u) => {
        if (!s) return true;
        const nameMatch = (u.name || "").toLowerCase().includes(s);
        const npkMatch = (u.npk || "").toLowerCase().includes(s);
        const userMatch = (u.username || "").toLowerCase().includes(s);
        const deptMatch = (u.department || "").toLowerCase().includes(s);
        return nameMatch || npkMatch || userMatch || deptMatch;
      });
  }, [users, search]);

  // Selected User Object
  const selectedUser = useMemo(() => {
    if (!value) return null;
    return users.find((u) => (valueKey === "id" ? String(u.id) === String(value) : u.name === value)) || null;
  }, [users, value, valueKey]);

  const handleSelect = (u: User) => {
    const val = valueKey === "id" ? String(u.id) : u.name;
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-slate-50 border rounded-xl px-3 py-2 text-left text-xs transition-all cursor-pointer ${
          isOpen
            ? "border-blue-500 bg-white ring-2 ring-blue-100"
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0 flex-1">
          {selectedUser ? (
            <div className="flex items-center gap-1.5 truncate">
              {selectedUser.npk && (
                <span className="bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded text-[10px] border border-blue-150 shrink-0 font-mono">
                  {selectedUser.npk}
                </span>
              )}
              <span className="font-semibold text-slate-800 truncate text-xs">
                {selectedUser.name}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2 shrink-0">
          {selectedUser && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
              title="Hapus pilihan"
            >
              ✕
            </span>
          )}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "transform rotate-180 text-blue-600" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-blue-200 rounded-2xl shadow-2xl z-50 p-2 space-y-2 animate-scale-in">
          {/* Search Box Input */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari nama atau NPK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 font-normal"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* User Results List */}
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {filteredUsers.map((u) => {
              const isSelected =
                valueKey === "id" ? String(u.id) === String(value) : u.name === value;

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelect(u)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    {u.npk ? (
                      <span className="bg-blue-100/70 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 font-mono">
                        {u.npk}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">-</span>
                    )}
                    <span className="truncate font-medium text-xs">{u.name}</span>
                  </div>

                  {u.department && (
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2 truncate max-w-24">
                      {u.department}
                    </span>
                  )}
                </button>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="py-4 text-center text-slate-400 text-xs font-normal">
                Tidak ditemukan user dengan NPK / nama &quot;{search}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
