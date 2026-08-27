"use client";

import { useState, useRef, useEffect, useMemo } from "react";

export interface SelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
  badge?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (val: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  searchPlaceholder = "Cari opsi...",
  disabled = false,
}: SearchableSelectProps) {
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

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return options;
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(s);
      const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(s) : false;
      const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(s) : false;
      return matchLabel || matchSub || matchBadge;
    });
  }, [options, search]);

  // Selected Option Object
  const selectedOption = useMemo(() => {
    if (value === "" || value === undefined || value === null) return null;
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [options, value]);

  const handleSelect = (opt: SelectOption) => {
    onChange(opt.value);
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
        } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-100" : ""}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0 flex-1">
          {selectedOption ? (
            <div className="flex items-center gap-1.5 truncate">
              {selectedOption.badge && (
                <span className="bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded text-[10px] border border-blue-100 shrink-0 font-mono">
                  {selectedOption.badge}
                </span>
              )}
              <span className="font-medium text-slate-800 truncate text-xs">
                {selectedOption.label}
              </span>
              {selectedOption.subLabel && (
                <span className="text-[10px] text-slate-400 truncate">
                  ({selectedOption.subLabel})
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2 shrink-0">
          {selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors cursor-pointer text-[11px]"
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
              placeholder={searchPlaceholder}
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

          {/* Results List with Smooth Slim Scroll */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                      : "hover:bg-slate-50 text-slate-700 font-normal"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    {opt.badge && (
                      <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0">
                        {opt.badge}
                      </span>
                    )}
                    <span className="truncate text-xs">{opt.label}</span>
                  </div>

                  {opt.subLabel && (
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2 truncate max-w-28">
                      {opt.subLabel}
                    </span>
                  )}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="py-4 text-center text-slate-400 text-xs font-normal">
                Tidak ada opsi &quot;{search}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
