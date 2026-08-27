"use client";

import { useCapex } from "../context/CapexContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const SkeletonLoading = ({ text }: { text: string }) => {
  return (
    <div className="flex min-h-screen bg-slate-900 font-sans text-xs animate-pulse">
      {/* Skeleton Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-700/60 flex flex-col p-4 space-y-6">
        <div className="h-12 bg-slate-800 rounded-xl w-3/4 mx-auto mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-slate-800 rounded-xl" />
          <div className="h-10 bg-slate-800 rounded-xl" />
          <div className="h-10 bg-slate-800 rounded-xl" />
        </div>
        <div className="pt-4 border-t border-slate-800/80 mt-auto">
          <div className="h-10 bg-slate-800 rounded-xl w-5/6" />
        </div>
      </aside>

      {/* Skeleton Main Content */}
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        {/* Skeleton Header */}
        <header className="h-16 border-b border-slate-700/40 bg-slate-900/50 backdrop-blur-md px-8 flex items-center justify-between">
          <div className="h-5 bg-slate-800 rounded w-1/4" />
          <div className="flex items-center gap-4">
            <div className="h-8 bg-slate-800 rounded w-20" />
            <div className="h-8 w-8 rounded-full bg-slate-800" />
          </div>
        </header>

        <main className="flex-1 p-8 space-y-6">
          {/* Loading text badge */}
          <div className="flex items-center justify-between bg-slate-850 border border-slate-700/40 p-4 rounded-xl">
            <span className="text-slate-400 font-semibold tracking-wide uppercase">{text}</span>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>

          {/* Skeleton Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column: 2x2 Grid of small cards */}
            <div className="col-span-5 grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-20 bg-slate-850 border border-slate-700/30 rounded-xl p-4 space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-5 bg-slate-800 rounded w-1/3" />
                </div>
              ))}
            </div>

            {/* Right Column: Stepper Skeleton */}
            <div className="col-span-7 bg-slate-850 border border-slate-700/30 rounded-xl p-5 flex flex-col justify-between">
              <div className="h-3 bg-slate-800 rounded w-1/3 mb-4" />
              <div className="flex justify-between items-center w-full pt-4 pb-2">
                <div className="h-10 w-10 rounded-full bg-slate-800" />
                <div className="h-1 flex-1 bg-slate-800 mx-2" />
                <div className="h-10 w-10 rounded-full bg-slate-800" />
                <div className="h-1 flex-1 bg-slate-800 mx-2" />
                <div className="h-10 w-10 rounded-full bg-slate-800" />
                <div className="h-1 flex-1 bg-slate-800 mx-2" />
                <div className="h-10 w-10 rounded-full bg-slate-800" />
              </div>
            </div>
          </div>

          {/* Large Table Skeleton */}
          <div className="bg-slate-850 border border-slate-700/30 rounded-xl p-6 space-y-4">
            <div className="h-4 bg-slate-800 rounded w-1/5" />
            <div className="space-y-2 pt-2">
              <div className="h-10 bg-slate-800 rounded" />
              <div className="h-10 bg-slate-800 rounded" />
              <div className="h-10 bg-slate-800 rounded" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, mounted } = useCapex();
  const router = useRouter();
  const pathname = usePathname() || "";

  const publicPaths = ["/", "/login"];
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    if (mounted) {
      if (!currentUser && !isPublicPath) {
        router.push("/");
      } else if (currentUser) {
        const userRole = (currentUser.role || "").toLowerCase();
        const userName = (currentUser.username || "").toLowerCase();
        const isAdmin = userRole === "admin" || userName === "admin";

        if (pathname === "/login") {
          router.push(isAdmin ? "/admin" : "/");
        } else {
          // Route permissions based on user portal access settings
          const hasCapex = isAdmin || (currentUser.allowed_portals ? currentUser.allowed_portals.includes("capex") : currentUser.can_capex !== false);
          const hasBodr = isAdmin || (currentUser.allowed_portals ? currentUser.allowed_portals.includes("bodr") : currentUser.can_bodr !== false);
          const hasPrice = isAdmin || (currentUser.allowed_portals ? currentUser.allowed_portals.includes("price") : currentUser.can_price !== false);

          const isBodrRoute =
            pathname.startsWith("/bodr") ||
            pathname === "/capex" ||
            pathname.startsWith("/capex/");
          const isPriceRoute = pathname.startsWith("/otorisasi-harga");
          const isCapexRoute =
            pathname.startsWith("/dashboard") ||
            pathname.startsWith("/planning") ||
            pathname.startsWith("/finance-review") ||
            pathname.startsWith("/approvals") ||
            pathname.startsWith("/drafts") ||
            pathname.startsWith("/fs-capex") ||
            pathname.startsWith("/proposal") ||
            pathname.startsWith("/reports") ||
            pathname.startsWith("/budget") ||
            pathname.startsWith("/audit");
          const isAdminRoute = pathname.startsWith("/admin");

          if (isAdminRoute && !isAdmin) {
            router.push("/");
          } else if (isBodrRoute && !hasBodr) {
            router.push("/");
          } else if (isPriceRoute && !hasPrice) {
            router.push("/");
          } else if (isCapexRoute && !hasCapex) {
            router.push("/");
          }
        }
      }
    }
  }, [currentUser, mounted, pathname, router, isPublicPath]);

  if (!mounted) {
    return <SkeletonLoading text="Loading System..." />;
  }

  // If not logged in and trying to access an internal page, render loading screen while redirecting
  if (!currentUser && !isPublicPath) {
    return <SkeletonLoading text="Redirecting to Login..." />;
  }

  // If logged in and trying to access login page, render loading screen while redirecting to portal
  if (currentUser && pathname === "/login") {
    return <SkeletonLoading text="Redirecting to Portals..." />;
  }

  return <>{children}</>;
}
