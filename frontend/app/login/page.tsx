"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useCapex } from "../context/CapexContext";

export default function LoginPage() {
  const { login } = useCapex();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        // Admin only accesses Admin Panel
        const isAdmin = (user.role || "").toLowerCase() === "admin";
        router.push(isAdmin ? "/admin" : "/");
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

  return (
    <div
      className="min-h-[100vh] w-full flex items-center justify-center bg-cover bg-center relative p-4"
      style={{
        backgroundImage: "url('/assets/img/bgmtm.jpg')",
      }}
    >
      {/* Dark overlay with subtle backdrop blur */}
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[3px] z-0" />

      {/* Login Card */}
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-800 p-8 relative z-10 transition-all duration-300"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
        }}
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NPK Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
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
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border outline-none bg-slate-50 border-slate-300 text-slate-900 transition-all focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
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
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border outline-none bg-slate-50 border-slate-300 text-slate-900 transition-all focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-400"
                required
              />
              {/* Toggle Password visibility button */}
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
            className="w-full mt-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed shadow-md"
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

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-700/20 text-center text-xs text-slate-400 select-none">
          <span>© {new Date().getFullYear()} PT Menara Terus Makmur</span>
        </div>
      </div>
    </div>
  );
}
