"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useCapex } from "./context/CapexContext";

export default function PortalPage() {
  const { currentUser, login, logout, userPermissions } = useCapex();
  const router = useRouter();

  // Login form states (for unauthenticated users)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Master daftar portal
  const allPortals = [
    {
      id: "capex",
      title: "CAPEX",
      desc: "Budget & Asset Expenditure",
      href: "/dashboard",
      icon: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zm10-5a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8z" />
        </svg>
      ),
    },
    {
      id: "bodr",
      title: "BODR",
      desc: "Budget Over Design Review",
      href: "/bodr-dashboard",
      icon: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "price",
      title: "Price Authorization",
      desc: "Non-Product / Product Price Approval",
      href: "/otorisasi-harga",
      icon: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: "admin",
      title: "Portal Admin",
      desc: "Master Data & Pengaturan Sistem",
      href: "/admin?tab=masterdata",
      icon: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // Saring portal berdasarkan hak akses pengguna
  const allowedPortals = allPortals.filter((p) => {
    if (!currentUser) return false;
    const userRole = (currentUser?.role || "").toLowerCase();
    const userName = (currentUser?.username || "").toLowerCase();
    const isAdm = userRole === "admin" || userName === "admin";

    if (p.id === "admin") {
      return (
        isAdm ||
        currentUser.can_admin === true ||
        (currentUser.allowed_portals && currentUser.allowed_portals.includes("admin")) ||
        (userPermissions && (
          userPermissions.includes("perm_manage_config") ||
          userPermissions.includes("perm_manage_users") ||
          userPermissions.includes("ALL_ACCESS")
        ))
      );
    }
    if (currentUser.allowed_portals && Array.isArray(currentUser.allowed_portals)) {
      return currentUser.allowed_portals.includes(p.id);
    }
    if (p.id === "capex") return currentUser.can_capex !== false;
    if (p.id === "bodr") return currentUser.can_bodr !== false;
    if (p.id === "price") return currentUser.can_price !== false;
    return true;
  });

  const isAdmin =
    (currentUser?.role || "").toLowerCase() === "admin" ||
    (currentUser?.username || "").toLowerCase() === "admin";

  // Auto-redirect logic:
  // 1. Admin otomatis ke /admin
  // 2. Jika user hanya punya akses ke 1 portal dan memiliki permission, otomatis langsung masuk ke portal tersebut
  useEffect(() => {
    if (!currentUser) return;
    if (isAdmin) {
      router.replace("/admin");
      return;
    }
    if (allowedPortals.length === 1 && userPermissions && userPermissions.length > 0) {
      router.replace(allowedPortals[0].href);
    }
  }, [currentUser, isAdmin, allowedPortals, userPermissions, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter NPK and Password!");
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter NPK and Password!",
        confirmButtonColor: "#2563eb",
        timer: 5000,
        timerProgressBar: true,
      });
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const user = await login(username, password);
      setIsLoading(false);
      if (user) {
        setUsername("");
        setPassword("");
        const userIsAdmin =
          (user.role || "").toLowerCase() === "admin" ||
          (user.username || "").toLowerCase() === "admin";
        if (userIsAdmin) {
          router.push("/admin");
          return;
        }
        const userAllowed = allPortals.filter((p) => {
          if (user.allowed_portals && Array.isArray(user.allowed_portals)) {
            return user.allowed_portals.includes(p.id);
          }
          if (p.id === "capex") return user.can_capex !== false;
          if (p.id === "bodr") return user.can_bodr !== false;
          if (p.id === "price") return user.can_price !== false;
          return true;
        });
        if (userAllowed.length === 1) {
          router.push(userAllowed[0].href);
        }
      } else {
        setError("Invalid NPK or Password!");
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: "Invalid NPK or Password!",
          confirmButtonColor: "#2563eb",
          timer: 5000,
          timerProgressBar: true,
        });
      }
    } catch {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUsername("");
    setPassword("");
    setError("");
    setIsLoading(false);
    logout();
  };

  // Tampilan loading redirect admin atau single portal
  if (currentUser && (isAdmin || allowedPortals.length === 1)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 font-sans">
        <div className="text-slate-600 font-medium text-sm flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>
            {isAdmin
              ? "Redirecting to Admin Panel..."
              : `Redirecting to ${allowedPortals[0]?.title || "Portal"}...`}
          </span>
        </div>
      </div>
    );
  }

  // JIKA BELUM LOGIN: Langsung tampilkan form login
  if (!currentUser) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative p-4 font-sans"
        style={{ backgroundImage: "url('/assets/img/bgmtm.jpg')" }}
      >
        <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[3px] z-0" />

        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 relative z-10"
          style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
        >
          {/* Logo Container */}
          <div className="flex flex-col items-center mb-6">
            <img
              src="/assets/img/logowide.jpeg"
              alt="MTM Logo"
              className="h-14 w-auto object-contain select-none"
            />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Sign In to
            </h2>
            <p className="text-sm sm:text-base font-semibold text-blue-600 mt-1">
              Capital Hub Portal
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* NPK Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-700">
                NPK
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Enter NPK..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none bg-slate-50 border-slate-300 text-slate-900 transition-all focus:border-blue-600 focus:bg-white placeholder:text-slate-400 font-normal"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-700">
                Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border outline-none bg-slate-50 border-slate-300 text-slate-900 transition-all focus:border-blue-600 focus:bg-white placeholder:text-slate-400 font-normal"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.5 3.5m10.9 10.9L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 select-none font-normal">
            <span>© {new Date().getFullYear()} PT Menara Terus Makmur</span>
          </div>
        </div>
      </div>
    );
  }

  // JIKA SUDAH LOGIN: Tampilkan portal yang diizinkan untuk pengguna
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative p-4 font-sans text-slate-800"
      style={{ backgroundImage: "url('/assets/img/bgmtm.jpg')" }}
    >
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[4px] z-0" />

      <div
        className="w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/80 p-8 sm:p-10 relative z-10 animate-in fade-in zoom-in-95 duration-200"
        style={{ boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.25)" }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <img src="/assets/img/logowide.jpeg" alt="MTM Logo" className="h-14 w-auto object-contain mb-2 select-none" />
          <hr className="w-full border-t border-slate-200/80 my-4" />
          <h2 className="text-xl font-bold tracking-wider text-slate-900 uppercase">
            Capital Management Portal Hub
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Selamat datang, <span className="font-bold text-blue-600">{currentUser.name}</span> ({currentUser.role} &bull; {currentUser.department})
          </p>
        </div>

        {/* Portal Grid */}
        {allowedPortals.length > 0 ? (
          <div
            className={`grid gap-5 w-full mb-8 ${
              allowedPortals.length === 1
                ? "grid-cols-1 max-w-sm mx-auto"
                : allowedPortals.length === 2
                ? "grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {allowedPortals.map((portal) => (
              <Link
                key={portal.id}
                href={portal.href}
                className="group relative bg-gradient-to-b from-white to-slate-50 border border-slate-200 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 shadow-2xs hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] cursor-pointer overflow-hidden"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center mb-4 transition-all duration-300 shadow-xs group-hover:scale-110">
                  {portal.icon}
                </div>
                <span className="font-bold text-slate-900 group-hover:text-blue-600 text-base uppercase tracking-wider transition-colors">
                  {portal.title}
                </span>
                <span className="text-xs text-slate-500 mt-1.5 font-normal leading-relaxed">
                  {portal.desc}
                </span>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                  <span>Buka Portal</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 bg-slate-50 border border-slate-200 rounded-2xl mb-8 space-y-2">
            <p className="text-sm font-bold text-slate-700">Tidak Ada Akses Portal</p>
            <p className="text-xs text-slate-500 font-normal max-w-md mx-auto">
              Akun Anda belum memiliki izin akses ke modul portal manapun. Silakan hubungi Administrator untuk meminta akses.
            </p>
          </div>
        )}

        {/* Logout */}
        <div className="flex justify-center items-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-rose-600 hover:text-rose-700 font-semibold transition-all border border-rose-200 hover:border-rose-300 rounded-xl px-5 py-2.5 hover:bg-rose-50/50 cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar (Logout)
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 select-none font-normal">
          <span>© {new Date().getFullYear()} PT Menara Terus Makmur — All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
