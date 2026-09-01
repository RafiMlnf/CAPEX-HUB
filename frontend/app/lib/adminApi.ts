import { ApiLoginLog } from "./types";
import { mockStorage } from "./mockStorage";

export const adminApi = {
  getAdminDashboard: (): Promise<any> => {
    const users = mockStorage.getUsers();
    const proposals = mockStorage.getProposals();
    const bodr = mockStorage.getBodrItems();
    const price = mockStorage.getPriceItems();

    return Promise.resolve({
      totalUsers: users.length,
      totalProposals: proposals.length,
      totalBodr: bodr.length,
      totalPrice: price.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      userPerDept: [
        { dept: "Engineering", count: 2 },
        { dept: "Purchasing", count: 1 },
        { dept: "Finance & Accounting", count: 1 },
        { dept: "Manufacturing", count: 1 },
        { dept: "Management", count: 1 },
      ],
      recentActivities: [
        { id: 1, action: "Login", user: "Administrator System", time: new Date().toISOString() },
      ],
    });
  },

  getHistoryLogs: (params?: { search?: string; status?: string; archive?: string }) => {
    return Promise.resolve({
      logs: [
        {
          id: 1,
          user_id: 1,
          nama_user: "Administrator System",
          username: "admin",
          ip_address: "127.0.0.1",
          user_agent: "Mozilla/5.0 Chrome/120.0",
          login_time: new Date().toISOString(),
          status_login: "SUCCESS",
          status: "active",
          is_archived: false,
        },
      ],
      total: 1,
      total_active: 1,
      total_archived: 0,
      total_success: 1,
      total_failed: 0,
    });
  },
};
