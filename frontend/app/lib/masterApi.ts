import { request } from "./client";
import {
  ApiDepartemen,
  ApiRole,
  ApiPermission,
  ApiTypeApproval,
  ApiCostCenter,
  ApiCapexType,
  ApiCapexReference,
  ApiAssetType,
  ApiVendor,
  ApiPartNumber,
  ApiJenisOtorisasi,
  ApiJenisBarang,
} from "./types";

// ── Generic Master Data Service Calls ────────────────────────────────────────

export async function getMasterEntities<T>(entity: string): Promise<T[]> {
  return request<T[]>(`/master/${entity}`);
}

export async function createMasterEntity<T>(entity: string, data: any): Promise<T> {
  return request<T>(`/master/${entity}`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateMasterEntity<T>(entity: string, id: string, data: any): Promise<T> {
  return request<T>(`/master/${entity}?id=${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function deleteMasterEntity(entity: string, id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/master/${entity}?id=${id}`, {
    method: "DELETE"
  });
}

// ── Master Entities Specialized Services ─────────────────────────────────────

export const masterApi = {
  getDepartemens: () => request<ApiDepartemen[]>("/master/departemens"),
  createDepartemen: (data: Partial<ApiDepartemen>) =>
    request<ApiDepartemen>("/master/departemens", { method: "POST", body: JSON.stringify(data) }),
  updateDepartemen: (id: string, data: Partial<ApiDepartemen>) =>
    request<ApiDepartemen>(`/master/departemens?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDepartemen: (id: string) =>
    request<{ success: boolean }>(`/master/departemens?id=${id}`, { method: "DELETE" }),

  getRoles: () => request<ApiRole[]>("/master/roles"),
  createRole: (data: Partial<ApiRole>) =>
    request<ApiRole>("/master/roles", { method: "POST", body: JSON.stringify(data) }),
  updateRole: (id: string, data: Partial<ApiRole>) =>
    request<ApiRole>(`/master/roles?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRole: (id: string) =>
    request<{ success: boolean }>(`/master/roles?id=${id}`, { method: "DELETE" }),

  getPermissions: () => request<ApiPermission[]>("/master/permissions"),
  createPermission: (data: Partial<ApiPermission>) =>
    request<ApiPermission>("/master/permissions", { method: "POST", body: JSON.stringify(data) }),
  updatePermission: (id: string, data: Partial<ApiPermission>) =>
    request<ApiPermission>(`/master/permissions?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePermission: (id: string) =>
    request<{ success: boolean }>(`/master/permissions?id=${id}`, { method: "DELETE" }),

  getTypeApprovals: () => request<ApiTypeApproval[]>("/master/type-approvals"),
  createTypeApproval: (data: Partial<ApiTypeApproval>) =>
    request<ApiTypeApproval>("/master/type-approvals", { method: "POST", body: JSON.stringify(data) }),
  updateTypeApproval: (id: string, data: Partial<ApiTypeApproval>) =>
    request<ApiTypeApproval>(`/master/type-approvals?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTypeApproval: (id: string) =>
    request<{ success: boolean }>(`/master/type-approvals?id=${id}`, { method: "DELETE" }),

  getCostCenters: () => request<ApiCostCenter[]>("/master/cost-centers"),
  createCostCenter: (data: Partial<ApiCostCenter>) =>
    request<ApiCostCenter>("/master/cost-centers", { method: "POST", body: JSON.stringify(data) }),
  updateCostCenter: (id: string, data: Partial<ApiCostCenter>) =>
    request<ApiCostCenter>(`/master/cost-centers?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCostCenter: (id: string) =>
    request<{ success: boolean }>(`/master/cost-centers?id=${id}`, { method: "DELETE" }),

  getCapexTypes: () => request<ApiCapexType[]>("/master/capex-types"),
  createCapexType: (data: Partial<ApiCapexType>) =>
    request<ApiCapexType>("/master/capex-types", { method: "POST", body: JSON.stringify(data) }),
  updateCapexType: (id: string, data: Partial<ApiCapexType>) =>
    request<ApiCapexType>(`/master/capex-types?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCapexType: (id: string) =>
    request<{ success: boolean }>(`/master/capex-types?id=${id}`, { method: "DELETE" }),

  getCapexReferences: () => request<ApiCapexReference[]>("/master/capex-references"),
  createCapexReference: (data: Partial<ApiCapexReference>) =>
    request<ApiCapexReference>("/master/capex-references", { method: "POST", body: JSON.stringify(data) }),
  updateCapexReference: (id: string, data: Partial<ApiCapexReference>) =>
    request<ApiCapexReference>(`/master/capex-references?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCapexReference: (id: string) =>
    request<{ success: boolean }>(`/master/capex-references?id=${id}`, { method: "DELETE" }),

  getAssetTypes: () => request<ApiAssetType[]>("/master/asset-types"),
  createAssetType: (data: Partial<ApiAssetType>) =>
    request<ApiAssetType>("/master/asset-types", { method: "POST", body: JSON.stringify(data) }),
  updateAssetType: (id: string, data: Partial<ApiAssetType>) =>
    request<ApiAssetType>(`/master/asset-types?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAssetType: (id: string) =>
    request<{ success: boolean }>(`/master/asset-types?id=${id}`, { method: "DELETE" }),

  getVendors: () => request<ApiVendor[]>("/master/vendors"),
  createVendor: (data: Partial<ApiVendor>) =>
    request<ApiVendor>("/master/vendors", { method: "POST", body: JSON.stringify(data) }),
  updateVendor: (id: string, data: Partial<ApiVendor>) =>
    request<ApiVendor>(`/master/vendors?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteVendor: (id: string) =>
    request<{ success: boolean }>(`/master/vendors?id=${id}`, { method: "DELETE" }),

  getPartNumbers: () => request<ApiPartNumber[]>("/master/part-numbers"),
  createPartNumber: (data: Partial<ApiPartNumber>) =>
    request<ApiPartNumber>("/master/part-numbers", { method: "POST", body: JSON.stringify(data) }),
  updatePartNumber: (id: string, data: Partial<ApiPartNumber>) =>
    request<ApiPartNumber>(`/master/part-numbers?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePartNumber: (id: string) =>
    request<{ success: boolean }>(`/master/part-numbers?id=${id}`, { method: "DELETE" }),

  getJenisOtorisasi: () => request<ApiJenisOtorisasi[]>("/master/jenis-otorisasi"),
  createJenisOtorisasi: (data: Partial<ApiJenisOtorisasi>) =>
    request<ApiJenisOtorisasi>("/master/jenis-otorisasi", { method: "POST", body: JSON.stringify(data) }),
  updateJenisOtorisasi: (id: string, data: Partial<ApiJenisOtorisasi>) =>
    request<ApiJenisOtorisasi>(`/master/jenis-otorisasi?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteJenisOtorisasi: (id: string) =>
    request<{ success: boolean }>(`/master/jenis-otorisasi?id=${id}`, { method: "DELETE" }),

  getJenisBarang: () => request<ApiJenisBarang[]>("/master/jenis-barang"),
  createJenisBarang: (data: Partial<ApiJenisBarang>) =>
    request<ApiJenisBarang>("/master/jenis-barang", { method: "POST", body: JSON.stringify(data) }),
  updateJenisBarang: (id: string, data: Partial<ApiJenisBarang>) =>
    request<ApiJenisBarang>(`/master/jenis-barang?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteJenisBarang: (id: string) =>
    request<{ success: boolean }>(`/master/jenis-barang?id=${id}`, { method: "DELETE" }),
};
