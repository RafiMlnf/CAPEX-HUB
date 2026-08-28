import { request } from "./client";
import {
  ApiRolePermission,
  ApiApprovalWorkflow,
  ApiApprovalPriceWorkflow,
  ApiDeptSettings,
  ApiPortalAccess,
} from "./types";

export const settingsApi = {
  getRolePermissions: () => request<ApiRolePermission[]>("/settings/role-permissions"),
  updateRolePermission: (id: string, data: { permissions: string[] }) =>
    request<ApiRolePermission>(`/settings/role-permissions?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getApprovalWorkflows: () => request<ApiApprovalWorkflow[]>("/settings/approval-workflows"),
  createApprovalWorkflow: (data: any) =>
    request<ApiApprovalWorkflow>("/settings/approval-workflows", { method: "POST", body: JSON.stringify(data) }),
  updateApprovalWorkflow: (id: string, data: any) =>
    request<ApiApprovalWorkflow>(`/settings/approval-workflows?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteApprovalWorkflow: (id: string) =>
    request<{ success: boolean }>(`/settings/approval-workflows?id=${id}`, { method: "DELETE" }),

  getApprovalPriceWorkflows: () => request<ApiApprovalPriceWorkflow[]>("/settings/approval-price-workflows"),
  createApprovalPriceWorkflow: (data: any) =>
    request<ApiApprovalPriceWorkflow>("/settings/approval-price-workflows", { method: "POST", body: JSON.stringify(data) }),
  updateApprovalPriceWorkflow: (id: string, data: any) =>
    request<ApiApprovalPriceWorkflow>(`/settings/approval-price-workflows?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteApprovalPriceWorkflow: (id: string) =>
    request<{ success: boolean }>(`/settings/approval-price-workflows?id=${id}`, { method: "DELETE" }),

  getDeptSettings: () => request<ApiDeptSettings[]>("/settings/dept-settings"),
  upsertDeptSettings: (data: any) =>
    request<ApiDeptSettings>("/settings/dept-settings", { method: "POST", body: JSON.stringify(data) }),

  getPortalAccess: () => request<ApiPortalAccess[]>("/settings/portal-access"),
  upsertPortalAccess: (data: { user_id: number; can_capex: boolean; can_bodr: boolean; can_price: boolean; can_admin?: boolean }) =>
    request<{ success: boolean; message: string }>("/settings/portal-access", { method: "POST", body: JSON.stringify(data) }),
};
