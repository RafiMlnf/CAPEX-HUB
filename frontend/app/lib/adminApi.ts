import { request } from "./client";
import { ApiLoginLog } from "./types";

export const adminApi = {
  getAdminDashboard: () => request<any>("/admin/dashboard"),
  getHistoryLogs: (params?: { search?: string; status?: string; archive?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);
    if (params?.archive) searchParams.set("archive", params.archive);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return request<{
      logs: ApiLoginLog[];
      total: number;
      total_active?: number;
      total_archived?: number;
      total_success: number;
      total_failed: number;
    }>(`/admin/history-logs${qs}`);
  },
};
