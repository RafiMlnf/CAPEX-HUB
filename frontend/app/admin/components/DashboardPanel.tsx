import { useState, useEffect } from "react";
import { api } from "@/app/lib/api";

interface DashboardSummary {
  totalUser: number;
  userActive: number;
  totalDept: number;
  totalRole: number;
  userPerDept: { dept: string; count: number; bodrCount?: number }[];
  recentLogs: any[];
  recentUsers: any[];
}

interface DashboardPanelProps {
  initialSummary?: DashboardSummary;
}

export default function DashboardPanel({
  initialSummary,
}: DashboardPanelProps) {
  const [summary, setSummary] = useState<DashboardSummary>(
    initialSummary || {
      totalUser: 0,
      userActive: 0,
      totalDept: 0,
      totalRole: 0,
      userPerDept: [],
      recentLogs: [],
      recentUsers: [],
    }
  );
  const [loading, setLoading] = useState(!initialSummary);

  useEffect(() => {
    if (!initialSummary) {
      setLoading(true);
      api
        .getAdminDashboard()
        .then((data) => {
          if (data) {
            const rawDepts = data.userPerDept || data.department_stats || data.departments || [];
            const userPerDept = Array.isArray(rawDepts)
              ? rawDepts.map((d: any) => ({
                  dept: d.dept || d.department || d.nama_departemen || "Umum",
                  count: d.count ?? d.user_count ?? 0,
                  bodrCount: d.bodrCount ?? d.bodr_count ?? 0,
                }))
              : [];

            setSummary({
              totalUser: data.totalUser ?? data.total_user ?? 0,
              userActive: data.userActive ?? data.user_active ?? 0,
              totalDept: data.totalDept ?? data.total_departemen ?? 0,
              totalRole: data.totalRole ?? data.total_role ?? 0,
              userPerDept,
              recentLogs: data.recentLogs || data.recent_logs || [],
              recentUsers: data.recentUsers || data.recent_users || [],
            });
          }
        })
        .catch((err) => {
          console.error("Failed to load dashboard data:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [initialSummary]);

  const userPerDeptList = summary?.userPerDept || [];

  const activePercent =
    summary.totalUser > 0
      ? Math.round((summary.userActive / summary.totalUser) * 100)
      : 0;

  const maxCount =
    userPerDeptList.length > 0
      ? Math.max(...userPerDeptList.map((d) => d.count), 1)
      : 1;

  const [hoveredDept, setHoveredDept] = useState<{ dept: string; count: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleDeptMouseEnter = (e: React.MouseEvent, d: { dept: string; count: number }) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    setHoveredDept(d);
  };

  const handleDeptMouseMove = (e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const kpis = [
    {
      label: "Total User",
      value: summary.totalUser,
      subLabel: "Pengguna Terdaftar",
      badge: "Sistem",
      icon: (
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      bgIcon: "bg-blue-50 border-blue-100",
    },
    {
      label: "Total Departemen",
      value: summary.totalDept,
      subLabel: "Unit Departemen",
      badge: "Aktif",
      icon: (
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      bgIcon: "bg-blue-50 border-blue-100",
    },
    {
      label: "User Active",
      value: summary.userActive,
      subLabel: `${activePercent}% dari Total User`,
      badge: "Active",
      icon: (
        <svg
          className="w-5 h-5 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgIcon: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Total Role",
      value: summary.totalRole,
      subLabel: "Role Hak Akses",
      badge: "RBAC",
      icon: (
        <svg
          className="w-5 h-5 text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      bgIcon: "bg-indigo-50 border-indigo-100",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-2xs transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] font-semibold text-blue-600 tracking-wider block mb-0.5 uppercase">
                  {k.label}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {k.subLabel}
                </span>
              </div>
              <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${k.bgIcon}`}>
                {k.icon}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
              <span className="text-3xl font-semibold text-slate-800 tracking-tight">
                {loading ? (
                  <span className="inline-block w-8 h-8 bg-slate-100 animate-pulse rounded"></span>
                ) : (
                  k.value
                )}
              </span>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                {k.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Grafik per Departemen
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Distribusi jumlah user yang terdaftar di setiap unit departemen
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
            <span>Jumlah User</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 py-12">
            <div className="h-48 bg-slate-50 animate-pulse rounded-2xl flex items-end justify-center gap-6 p-6">
              {[40, 70, 25, 90, 50, 60, 30].map((h, i) => (
                <div key={i} className="w-12 bg-slate-200 rounded-t-xl" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        ) : userPerDeptList.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-xs font-normal text-slate-400">Belum ada data departemen terdaftar.</p>
          </div>
        ) : (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4 min-w-0">
            <div className="h-64 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-200 relative w-full min-w-0">
              {/* Subtle Grid Lines */}
              <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-200/60 pointer-events-none" />
              <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-200/60 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-2 border-b border-slate-200 pointer-events-none" />

              {userPerDeptList.map((d) => {
                const barHeightPct = Math.max((d.count / maxCount) * 100, d.count > 0 ? 14 : 4);
                const isHovered = hoveredDept?.dept === d.dept;

                return (
                  <div
                    key={d.dept}
                    className={`flex-1 min-w-0 flex flex-col items-center h-full justify-end relative transition-all ${
                      isHovered ? "z-30" : "z-10"
                    }`}
                    onMouseEnter={(e) => handleDeptMouseEnter(e, d)}
                    onMouseMove={handleDeptMouseMove}
                    onMouseLeave={() => setHoveredDept(null)}
                  >
                    <span
                      className={`text-[10px] font-bold mb-1 transition-all ${
                        isHovered ? "text-blue-700 scale-125" : "text-blue-600 opacity-90"
                      }`}
                    >
                      {d.count > 0 ? d.count : ""}
                    </span>

                    <div
                      className={`w-full max-w-12 rounded-t-lg transition-all duration-200 ${
                        d.count > 0
                          ? isHovered
                            ? "bg-linear-to-t from-blue-700 to-indigo-600 shadow-md scale-y-105 origin-bottom"
                            : "bg-linear-to-t from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600"
                          : isHovered
                          ? "bg-slate-300"
                          : "bg-slate-200 hover:bg-slate-300"
                      }`}
                      style={{ height: `${barHeightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 px-2 w-full min-w-0">
              {userPerDeptList.map((d) => {
                const isHovered = hoveredDept?.dept === d.dept;
                return (
                  <div
                    key={d.dept}
                    onMouseEnter={(e) => handleDeptMouseEnter(e, d)}
                    onMouseMove={handleDeptMouseMove}
                    onMouseLeave={() => setHoveredDept(null)}
                    className={`flex-1 min-w-0 text-center transition-colors ${
                      isHovered ? "text-blue-700 font-bold" : "text-slate-500"
                    }`}
                    title={d.dept}
                  >
                    <span className="text-[9px] font-medium truncate block w-full text-center">
                      {d.dept}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {hoveredDept && (
        <div
          className="fixed z-50 pointer-events-none transition-transform duration-75 ease-out"
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y - 14}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-white/95 text-slate-800 rounded-xl p-3 shadow-xl border border-slate-200 min-w-36 text-left space-y-1 backdrop-blur-md">
            <span className="text-[11px] font-bold text-blue-700 block truncate max-w-40">
              {hoveredDept.dept}
            </span>
            <div className="flex justify-between items-center text-[10px] gap-2 pt-0.5">
              <span className="text-slate-500 font-medium">Jumlah User:</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                {hoveredDept.count} User
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
