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

  // Master daftar portal operasional utama (ukuran card kotak ringkas & teks tegas)
  const mainPortals = [
    {
      id: "capex",
      title: "CAPEX",
      desc: "Budget & Asset Expenditure",
      href: "/dashboard",
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "price",
      title: "PRICE AUTHORIZATION",
      desc: "Non-Product / Product Price Approval",
      href: "/otorisasi-harga",
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  const userRole = (currentUser?.role || "").toLowerCase();
  const userName = (currentUser?.username || "").toLowerCase();
  const isAdmin = userRole === "admin" || userName === "admin";

  const canAccessAdmin =
    Boolean(currentUser) &&
    (isAdmin ||
      currentUser?.can_admin === true ||
      (currentUser?.allowed_portals && currentUser?.allowed_portals.includes("admin")) ||
      (userPermissions &&
        (userPermissions.includes("perm_manage_config") ||
          userPermissions.includes("perm_manage_users") ||
          userPermissions.includes("ALL_ACCESS"))));

  // Saring portal operasional berdasarkan hak akses pengguna
  const allowedMainPortals = mainPortals.filter((p) => {
    if (!currentUser) return false;
    if (currentUser.allowed_portals && Array.isArray(currentUser.allowed_portals)) {
      return currentUser.allowed_portals.includes(p.id);
    }
    if (p.id === "capex") return currentUser.can_capex !== false;
    if (p.id === "bodr") return currentUser.can_bodr !== false;
    if (p.id === "price") return currentUser.can_price !== false;
    return true;
  });

  // Auto-redirect only if single portal user with permissions (and not admin)
  useEffect(() => {
    if (!currentUser) return;
    if (!isAdmin && allowedMainPortals.length === 1 && userPermissions && userPermissions.length > 0) {
      router.replace(allowedMainPortals[0].href);
    }
  }, [currentUser, isAdmin, allowedMainPortals, userPermissions, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter NPK and Password!");
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter NPK and Password!",
        confirmButtonColor: "#2563eb",
        timer: 3000,
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
        const userAllowed = mainPortals.filter((p) => {
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
          timer: 3000,
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

  // Tampilan loading redirect untuk single portal non-admin
  if (currentUser && !isAdmin && allowedMainPortals.length === 1) {
    return (
      <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-slate-100 font-sans">
        <div className="text-slate-600 font-medium text-xs flex items-center gap-2">
          <svg className="animate-spin h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Redirecting to {allowedMainPortals[0]?.title || "Portal"}...</span>
        </div>
      </div>
    );
  }

  // JIKA BELUM LOGIN: Tampilkan form login compact non-scrollable
  if (!currentUser) {
    return (
      <div
        className="h-screen w-screen overflow-hidden flex items-center justify-center bg-cover bg-center relative p-3 font-sans select-none"
        style={{ backgroundImage: "url('/assets/img/bgmtm.jpg')" }}
      >
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px] z-0 pointer-events-none" />

        <div
          className="w-full max-w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-5 relative z-10 animate-in fade-in zoom-in-95 duration-200"
          style={{ boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.25)" }}
        >
          {/* Logo Container */}
          <div className="flex flex-col items-center mb-3">
            <img
              src="/assets/img/logowide.jpeg"
              alt="MTM Logo"
              className="h-8 w-auto object-contain select-none"
            />
          </div>

          <div className="text-center mb-4">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Sign In to
            </h2>
            <p className="text-xs font-black text-blue-600 uppercase tracking-wider">
              CAPEX HUB PORTAL
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            {/* NPK Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
                NPK
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Enter NPK..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none bg-slate-50 border-slate-200 text-slate-900 transition-all focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20 placeholder:text-slate-400 font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-8 pr-9 py-1.5 text-xs rounded-lg border outline-none bg-slate-50 border-slate-200 text-slate-900 transition-all focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20 placeholder:text-slate-400 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  {showPassword ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.5 3.5m10.9 10.9L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              className="w-full mt-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed shadow-xs uppercase tracking-wider"
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

          <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-center text-[10px] text-slate-400 select-none">
            <span>© {new Date().getFullYear()} PT Menara Terus Makmur</span>
          </div>
        </div>
      </div>
    );
  }

  // JIKA SUDAH LOGIN: Tampilkan portal hub card kotak proporsional & compact
  return (
    <div
      className="h-screen w-screen overflow-hidden flex items-center justify-center bg-cover bg-center relative p-3 font-sans text-slate-800 select-none"
      style={{ backgroundImage: "url('/assets/img/bgmtm.jpg')" }}
    >
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[4px] z-0 pointer-events-none" />

      <div
        className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 p-5 sm:p-7 relative z-10 animate-in fade-in zoom-in-95 duration-200"
        style={{ boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3)" }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-4 sm:mb-5">
          <img
            src="/assets/img/logowide.jpeg"
            alt="MTM Logo"
            className="h-10 sm:h-11 w-auto object-contain mb-1.5 select-none"
          />
          <hr className="w-full border-t border-slate-200/80 my-2" />
          <h2 className="text-lg sm:text-xl font-black tracking-wider text-slate-900 uppercase text-center">
            CAPEX HUB PORTAL
          </h2>
        </div>

        {/* Card Kotak Grid Portal (Ukuran Kotak Ringkas & Teks Jelas) */}
        {allowedMainPortals.length > 0 ? (
          <div
            className={`grid gap-3.5 w-full mb-5 ${
              allowedMainPortals.length === 1
                ? "grid-cols-1 max-w-xs mx-auto"
                : allowedMainPortals.length === 2
                ? "grid-cols-1 sm:grid-cols-2 max-w-md mx-auto"
                : "grid-cols-1 sm:grid-cols-3"
            }`}
          >
            {allowedMainPortals.map((portal) => (
              <Link
                key={portal.id}
                href={portal.href}
                className="group flex flex-col items-center justify-center text-center p-4 sm:p-5 min-h-[145px] sm:min-h-[155px] bg-linear-to-b from-white to-slate-50/90 hover:to-blue-50/60 border-2 border-slate-200/90 hover:border-blue-600 rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center mb-3 transition-all duration-200 shadow-2xs group-hover:scale-105">
                  {portal.icon}
                </div>
                <span className="font-black text-slate-800 group-hover:text-blue-600 text-xs sm:text-sm uppercase tracking-wider block transition-colors px-1 leading-tight">
                  {portal.title}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 px-3 bg-slate-50 border border-slate-200 rounded-xl mb-5 space-y-1">
            <p className="text-sm font-bold text-slate-700">Tidak Ada Akses Portal</p>
            <p className="text-xs text-slate-500 font-normal max-w-md mx-auto">
              Akun Anda belum memiliki izin akses ke modul portal operasional manapun. Silakan hubungi Administrator.
            </p>
          </div>
        )}

        {/* Footer Actions: Portal Admin (Text Link) & Logout */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          {canAccessAdmin ? (
            <Link
              href="/admin?tab=masterdata"
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 hover:text-blue-600 font-bold transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-500 hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Portal Admin</span>
            </Link>
          ) : (
            <div />
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-rose-600 hover:text-rose-700 font-bold transition-all border border-rose-200 hover:border-rose-300 rounded-lg px-3.5 py-1.5 hover:bg-rose-50/60 cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        <div className="mt-3.5 pt-2 text-center text-[11px] text-slate-400 select-none font-medium">
          <span>© {new Date().getFullYear()} PT Menara Terus Makmur</span>
        </div>
      </div>
    </div>
  );
}
