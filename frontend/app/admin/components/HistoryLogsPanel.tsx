"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { api, ApiLoginLog } from "../../lib/api";

export default function HistoryLogsPanel() {
  const [logs, setLogs] = useState<ApiLoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived" | "ALL">("active");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [stats, setStats] = useState({
    total: 0,
    totalActive: 0,
    totalArchived: 0,
    totalSuccess: 0,
    totalFailed: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchLogs = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const res = await api.getHistoryLogs({
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        archive: archiveFilter,
      });

      if (res && Array.isArray(res.logs)) {
        setLogs(res.logs);
        setStats({
          total: res.total ?? res.logs.length,
          totalActive: res.total_active ?? res.logs.filter((l) => !l.is_archived).length,
          totalArchived: res.total_archived ?? res.logs.filter((l) => l.is_archived).length,
          totalSuccess: res.total_success ?? res.logs.filter((l) => (l.status || "").toUpperCase() === "SUCCESS").length,
          totalFailed: res.total_failed ?? res.logs.filter((l) => (l.status || "").toUpperCase() === "FAILED").length,
        });
      } else {
        setLogs([]);
      }
      setCurrentTime(Date.now());
    } catch (err) {
      console.error("Gagal memuat history logs:", err);
      if (!isSilent) {
        setLogs([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [search, statusFilter, archiveFilter]);

  // Initial and trigger on filter change
  useEffect(() => {
    fetchLogs(false);
    setCurrentPage(1);
  }, [statusFilter, archiveFilter]);

  // Realtime Polling Interval: fetch latest logs automatically every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Filter & Pagination calculation
  const filteredLogs = useMemo(() => {
    const now = currentTime || 0;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    return logs.filter((log) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (log.nama_user || "").toLowerCase().includes(q) ||
        (log.username || "").toLowerCase().includes(q) ||
        (log.npk || "").toLowerCase().includes(q) ||
        (log.departemen || "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" ||
        (log.status || "").toUpperCase() === statusFilter.toUpperCase();

      // Hitung selisih waktu 24 jam secara realtime
      const logTimestamp = new Date(log.login_time).getTime();
      const isPast24h = log.is_archived || (now > 0 && now - logTimestamp > TWENTY_FOUR_HOURS);

      let matchArchive = true;
      if (archiveFilter === "active") {
        matchArchive = !isPast24h;
      } else if (archiveFilter === "archived") {
        matchArchive = isPast24h;
      }

      return matchSearch && matchStatus && matchArchive;
    });
  }, [logs, search, statusFilter, archiveFilter, currentTime]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs w-full space-y-4">
        {/* Header & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              History Login
            </h3>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Cari user / NPK / dept..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-60 h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter Arsip Otomatis (24 Jam) */}
            <select
              value={archiveFilter}
              onChange={(e) => {
                setArchiveFilter(e.target.value as "active" | "archived" | "ALL");
                setCurrentPage(1);
              }}
              aria-label="Filter arsip login"
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs shrink-0"
            >
              <option value="active">Log Aktif (&lt; 24 Jam)</option>
              <option value="archived">Log Terarsip (&ge; 24 Jam)</option>
              <option value="ALL">Semua Log</option>
            </select>

            {/* Filter Status (SUCCESS / FAILED) */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter status autentikasi"
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs shrink-0"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUCCESS">SUCCESS (Berhasil)</option>
              <option value="FAILED">FAILED (Gagal)</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-12 text-center">
                  No
                </th>
                <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Waktu Login
                </th>
                <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  NPK
                </th>
                <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Departemen
                </th>
                <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="py-3 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-normal italic">
                    Memuat riwayat login langsung dari server...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-normal">
                    Tidak ada catatan riwayat login yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => {
                  const isSuccess = (log.status || "").toUpperCase() === "SUCCESS";
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr
                      key={log.id || index}
                      className="hover:bg-blue-50/20 transition-colors duration-150"
                    >
                      {/* No */}
                      <td className="py-3.5 px-3 font-normal text-slate-400 text-center">
                        {rowNumber}
                      </td>

                      {/* Waktu Login */}
                      <td className="py-3.5 px-3 font-normal text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(log.login_time)}</span>
                        </div>
                      </td>

                      {/* NPK */}
                      <td className="py-3.5 px-3 font-mono text-slate-700 font-medium whitespace-nowrap">
                        {log.npk && log.npk !== "-" ? log.npk : "-"}
                      </td>

                      {/* Pengguna */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-slate-800">
                          {log.nama_user && log.nama_user !== "-" ? log.nama_user : log.username}
                        </span>
                      </td>

                      {/* Departemen */}
                      <td className="py-3.5 px-3">
                        <span className="font-normal text-slate-700">
                          {log.departemen && log.departemen !== "-" ? log.departemen : "General"}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-3">
                        <span className="text-blue-600 font-medium">
                          {log.role && log.role !== "-" ? log.role : "User"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`text-xs font-medium uppercase tracking-wide ${
                              isSuccess ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {log.status || "SUCCESS"}
                          </span>
                          {(log.is_archived || (currentTime > 0 && currentTime - new Date(log.login_time).getTime() > 24 * 60 * 60 * 1000)) && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                              title="Otomatis terarsip (> 24 jam)"
                            >
                              Arsip
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Keterangan */}
                      <td className="py-3.5 px-3 text-slate-600 font-normal text-[11px]">
                        {log.keterangan || (isSuccess ? "Login berhasil" : "Kredensial salah")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && filteredLogs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-normal">
              Menampilkan <span className="font-medium text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredLogs.length)}</span> - <span className="font-medium text-slate-700">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> dari <span className="font-medium text-slate-700">{filteredLogs.length}</span> total entri {archiveFilter === "active" ? "(Log Aktif < 24 Jam)" : archiveFilter === "archived" ? "(Log Terarsip ≥ 24 Jam)" : ""}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>

              <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-medium border border-blue-200">
                Hal {currentPage} dari {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
