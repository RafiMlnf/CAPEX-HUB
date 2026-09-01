import {
  ApiRolePermission,
  ApiApprovalWorkflow,
  ApiApprovalPriceWorkflow,
  ApiDeptSettings,
  ApiPortalAccess,
} from "./types";
import { mockStorage } from "./mockStorage";

export const settingsApi = {
  getRolePermissions: (): Promise<ApiRolePermission[]> => {
    return Promise.resolve([
      {
        id: "1",
        role_id: "1",
        kode_role: "ADMIN",
        nama_role: "Admin",
        status: "active",
        created_at: new Date().toISOString(),
        permissions: [
          "perm_view_dashboard",
          "perm_create_capex",
          "perm_review_capex",
          "perm_committee_review",
          "perm_manage_users",
          "perm_manage_config",
          "perm_view_reports",
          "perm_create_bodr",
          "perm_approve_bodr",
          "perm_create_price",
          "perm_approve_price",
          "perm_manage_master_price",
          "perm_view_bodr_dashboard",
        ],
      },
      {
        id: "2",
        role_id: "7",
        kode_role: "DEPT_HEAD",
        nama_role: "Department Head",
        status: "active",
        created_at: new Date().toISOString(),
        permissions: [
          "perm_view_dashboard",
          "perm_create_capex",
          "perm_create_bodr",
          "perm_approve_bodr",
          "perm_create_price",
        ],
      },
      {
        id: "3",
        role_id: "3",
        kode_role: "STAFF",
        nama_role: "Staff",
        status: "active",
        created_at: new Date().toISOString(),
        permissions: ["perm_view_dashboard", "perm_create_capex", "perm_review_capex"],
      },
    ] as any);
  },
  updateRolePermission: (id: string, data: { permissions: string[] }) =>
    Promise.resolve({
      id,
      role_id: id,
      kode_role: "ROLE",
      nama_role: "Role",
      status: "active",
      created_at: new Date().toISOString(),
      permissions: data.permissions,
    } as any),

  getApprovalWorkflows: (): Promise<ApiApprovalWorkflow[]> => Promise.resolve([]),
  createApprovalWorkflow: (data: any): Promise<ApiApprovalWorkflow> => Promise.resolve(data),
  updateApprovalWorkflow: (id: string, data: any): Promise<ApiApprovalWorkflow> => Promise.resolve(data),
  deleteApprovalWorkflow: (id?: string) => Promise.resolve({ success: true }),

  getApprovalPriceWorkflows: (): Promise<ApiApprovalPriceWorkflow[]> => Promise.resolve([]),
  createApprovalPriceWorkflow: (data: any): Promise<ApiApprovalPriceWorkflow> => Promise.resolve(data),
  updateApprovalPriceWorkflow: (id: string, data: any): Promise<ApiApprovalPriceWorkflow> => Promise.resolve(data),
  deleteApprovalPriceWorkflow: (id?: string) => Promise.resolve({ success: true }),

  getDeptSettings: (): Promise<ApiDeptSettings[]> => Promise.resolve([]),
  upsertDeptSettings: (data: any): Promise<ApiDeptSettings> => Promise.resolve(data),

  getPortalAccess: (): Promise<ApiPortalAccess[]> => {
    const users = mockStorage.getUsers();
    return Promise.resolve(
      users.map((u) => ({
        id: u.id,
        user_id: Number(u.id),
        npk: u.npk || `NPK-${u.id}`,
        name: u.name,
        username: u.username,
        email: u.email,
        department: u.department,
        departemen: u.department,
        role: String(u.role),
        can_capex: u.can_capex !== false,
        can_bodr: u.can_bodr !== false,
        can_price: u.can_price !== false,
        can_admin: u.can_admin === true,
        allowed_portals: u.allowed_portals || ["CAPEX", "BODR", "PRICE"],
      }))
    );
  },
  upsertPortalAccess: (data: { user_id: number; can_capex: boolean; can_bodr: boolean; can_price: boolean; can_admin?: boolean }) => {
    const users = mockStorage.getUsers();
    const idx = users.findIndex((u) => Number(u.id) === Number(data.user_id));
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        can_capex: data.can_capex,
        can_bodr: data.can_bodr,
        can_price: data.can_price,
        can_admin: data.can_admin === true,
      };
      mockStorage.saveUsers(users);
    }
    return Promise.resolve({ success: true, message: "Portal access updated successfully" });
  },
};
