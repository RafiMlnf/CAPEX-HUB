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
import {
  mockStorage,
} from "./mockStorage";

// ── Generic Master Data Service Calls ────────────────────────────────────────

export async function getMasterEntities<T>(entity: string): Promise<T[]> {
  if (entity === "departemens") return (await masterApi.getDepartemens()) as any;
  if (entity === "roles") return (await masterApi.getRoles()) as any;
  if (entity === "permissions") return (await masterApi.getPermissions()) as any;
  return [] as any;
}

export async function createMasterEntity<T>(entity: string, data: any): Promise<T> {
  return data as T;
}

export async function updateMasterEntity<T>(entity: string, id: string, data: any): Promise<T> {
  return data as T;
}

export async function deleteMasterEntity(entity: string, id: string): Promise<{ success: boolean }> {
  return { success: true };
}

// ── Master Entities Specialized Services ─────────────────────────────────────

const getDepartemens = (): Promise<ApiDepartemen[]> => {
  const deps = mockStorage.getDepartments();
  return Promise.resolve(
    deps.map((d) => ({
      id: String(d.id),
      kode: d.kode_departemen,
      nama: d.nama_departemen,
      deskripsi: d.deskripsi || "",
      status: (d.status || "active") as any,
      created_at: new Date().toISOString(),
      kode_departemen: d.kode_departemen,
      nama_departemen: d.nama_departemen,
    } as any))
  );
};

const createDepartemen = (data: any): Promise<ApiDepartemen> => {
  const list = mockStorage.getDepartments();
  const newId = list.length + 1;
  const newItem = {
    id: newId,
    kode_departemen: data.kode_departemen || data.kode || `DEPT-${newId}`,
    nama_departemen: data.nama_departemen || data.nama || "Departemen Baru",
    deskripsi: data.deskripsi || "",
    status: data.status || "active",
  };
  mockStorage.saveDepartments([...list, newItem]);
  return Promise.resolve({
    id: String(newItem.id),
    kode: newItem.kode_departemen,
    nama: newItem.nama_departemen,
    deskripsi: newItem.deskripsi,
    status: newItem.status as any,
    created_at: new Date().toISOString(),
    kode_departemen: newItem.kode_departemen,
    nama_departemen: newItem.nama_departemen,
  } as any);
};

const updateDepartemen = (id: string, data: any): Promise<ApiDepartemen> => {
  const list = mockStorage.getDepartments();
  const idx = list.findIndex((d) => String(d.id) === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    mockStorage.saveDepartments(list);
  }
  return Promise.resolve(data as ApiDepartemen);
};

const deleteDepartemen = (id: string): Promise<{ success: boolean }> => {
  const list = mockStorage.getDepartments();
  mockStorage.saveDepartments(list.filter((d) => String(d.id) !== id));
  return Promise.resolve({ success: true });
};

const getRoles = (): Promise<ApiRole[]> => {
  const roles = mockStorage.getRoles();
  return Promise.resolve(
    roles.map((r) => ({
      id: String(r.id),
      kode: r.kode_role,
      nama: r.nama_role,
      deskripsi: r.deskripsi || "",
      status: (r.status || "active") as any,
      created_at: new Date().toISOString(),
      kode_role: r.kode_role,
      nama_role: r.nama_role,
    } as any))
  );
};

const createRole = (data: any): Promise<ApiRole> => {
  const list = mockStorage.getRoles();
  const newId = list.length + 1;
  const newItem = {
    id: newId,
    kode_role: data.kode_role || data.kode || `ROLE-${newId}`,
    nama_role: data.nama_role || data.nama || "Role Baru",
    deskripsi: data.deskripsi || "",
    status: data.status || "active",
  };
  mockStorage.saveRoles([...list, newItem]);
  return Promise.resolve({
    id: String(newItem.id),
    kode: newItem.kode_role,
    nama: newItem.nama_role,
    deskripsi: newItem.deskripsi,
    status: newItem.status as any,
    created_at: new Date().toISOString(),
  } as any);
};

const updateRole = (id: string, data: any): Promise<ApiRole> => {
  const list = mockStorage.getRoles();
  const idx = list.findIndex((r) => String(r.id) === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    mockStorage.saveRoles(list);
  }
  return Promise.resolve(data as ApiRole);
};

const deleteRole = (id: string): Promise<{ success: boolean }> => {
  const list = mockStorage.getRoles();
  mockStorage.saveRoles(list.filter((r) => String(r.id) !== id));
  return Promise.resolve({ success: true });
};

const getPermissions = (): Promise<ApiPermission[]> => {
  const perms = mockStorage.getPermissions();
  return Promise.resolve(
    perms.map((p) => ({
      id: String(p.id),
      kode: p.kode_permission,
      nama: p.nama_permission,
      deskripsi: p.deskripsi || "",
      status: (p.status || "active") as any,
      created_at: new Date().toISOString(),
      kode_permission: p.kode_permission,
      nama_permission: p.nama_permission,
    } as any))
  );
};

const createPermission = (data: any): Promise<ApiPermission> => Promise.resolve(data as ApiPermission);
const updatePermission = (id: string, data: any): Promise<ApiPermission> => Promise.resolve(data as ApiPermission);
const deletePermission = (id: string): Promise<{ success: boolean }> => Promise.resolve({ success: true });

const getTypeApprovals = (): Promise<ApiTypeApproval[]> => Promise.resolve([
  { id: "1", kode: "APP_BODR", nama: "BODR Standard Approval", deskripsi: "Approval BODR", status: "active", created_at: new Date().toISOString(), kode_approval: "APP_BODR", nama_approval: "BODR Standard Approval" } as any,
  { id: "2", kode: "APP_PRICE", nama: "Price Authorization Approval", deskripsi: "Approval Price", status: "active", created_at: new Date().toISOString(), kode_approval: "APP_PRICE", nama_approval: "Price Authorization Approval" } as any,
]);
const createTypeApproval = (data: any): Promise<ApiTypeApproval> => Promise.resolve(data as ApiTypeApproval);
const updateTypeApproval = (id: string, data: any): Promise<ApiTypeApproval> => Promise.resolve(data as ApiTypeApproval);
const deleteTypeApproval = (id: string): Promise<{ success: boolean }> => Promise.resolve({ success: true });

const getCostCenters = (): Promise<ApiCostCenter[]> => Promise.resolve([
  { id: "1", kode: "CC-ENG-01", nama: "Cost Center Engineering", deskripsi: "Engineering", status: "active", created_at: new Date().toISOString(), kode_cost_center: "CC-ENG-01", nama_cost_center: "Cost Center Engineering", departemen: "Engineering" } as any,
  { id: "2", kode: "CC-PUR-01", nama: "Cost Center Purchasing", deskripsi: "Purchasing", status: "active", created_at: new Date().toISOString(), kode_cost_center: "CC-PUR-01", nama_cost_center: "Cost Center Purchasing", departemen: "Purchasing" } as any,
  { id: "3", kode: "CC-FIN-01", nama: "Cost Center Finance", deskripsi: "Finance", status: "active", created_at: new Date().toISOString(), kode_cost_center: "CC-FIN-01", nama_cost_center: "Cost Center Finance", departemen: "Finance & Accounting" } as any,
  { id: "4", kode: "CC-MFG-01", nama: "Cost Center Manufacturing", deskripsi: "Manufacturing", status: "active", created_at: new Date().toISOString(), kode_cost_center: "CC-MFG-01", nama_cost_center: "Cost Center Manufacturing", departemen: "Manufacturing" } as any,
]);
const createCostCenter = (data: any): Promise<ApiCostCenter> => Promise.resolve(data as ApiCostCenter);
const updateCostCenter = (id: string, data: any): Promise<ApiCostCenter> => Promise.resolve(data as ApiCostCenter);
const deleteCostCenter = (id: string): Promise<{ success: boolean }> => Promise.resolve({ success: true });

const getCapexTypes = (): Promise<ApiCapexType[]> => Promise.resolve([
  { id: "1", kode: "MACH", nama: "Machine & Equipment", deskripsi: "Mesin", status: "active", created_at: new Date().toISOString(), kode_capex_type: "MACH", nama_capex_type: "Machine & Equipment" } as any,
  { id: "2", kode: "BLDG", nama: "Building & Infrastructure", deskripsi: "Bangunan", status: "active", created_at: new Date().toISOString(), kode_capex_type: "BLDG", nama_capex_type: "Building & Infrastructure" } as any,
  { id: "3", kode: "IT", nama: "IT Hardware & Software", deskripsi: "IT", status: "active", created_at: new Date().toISOString(), kode_capex_type: "IT", nama_capex_type: "IT Hardware & Software" } as any,
  { id: "4", kode: "TOOL", nama: "Tooling & Mold", deskripsi: "Tooling", status: "active", created_at: new Date().toISOString(), kode_capex_type: "TOOL", nama_capex_type: "Tooling & Mold" } as any,
]);
const createCapexType = (data: any): Promise<ApiCapexType> => Promise.resolve(data as ApiCapexType);
const updateCapexType = (id: string, data: any): Promise<ApiCapexType> => Promise.resolve(data as ApiCapexType);
const deleteCapexType = (id: string): Promise<{ success: boolean }> => Promise.resolve({ success: true });

const getCapexReferences = (): Promise<ApiCapexReference[]> => Promise.resolve([
  { id: "1", kode: "REF-2026-001", nama: "Strategic Plan FY2026", deskripsi: "Strategic", status: "active", created_at: new Date().toISOString(), kode_reference: "REF-2026-001", judul: "Strategic Plan FY2026" } as any,
  { id: "2", kode: "REF-2026-002", nama: "Automation & Digitalization 4.0", deskripsi: "Automation", status: "active", created_at: new Date().toISOString(), kode_reference: "REF-2026-002", judul: "Automation & Digitalization 4.0" } as any,
]);
const createCapexReference = (data: any): Promise<ApiCapexReference> => Promise.resolve(data as ApiCapexReference);
const updateCapexReference = (id: string, data: any): Promise<ApiCapexReference> => Promise.resolve(data as ApiCapexReference);
const deleteCapexReference = (id: string): Promise<{ success: boolean }> => Promise.resolve({ success: true });

const getAssetTypes = (): Promise<ApiAssetType[]> => Promise.resolve([
  { id: "1", class: "AST-MACH", nama_type: "Production Machinery", deskripsi: "Mesin", status: "active", created_at: new Date().toISOString(), kode_asset_type: "AST-MACH", nama_asset_type: "Production Machinery" } as any,
  { id: "2", class: "AST-IT", nama_type: "IT Infrastructure", deskripsi: "IT", status: "active", created_at: new Date().toISOString(), kode_asset_type: "AST-IT", nama_asset_type: "IT Infrastructure" } as any,
  { id: "3", class: "AST-VEH", nama_type: "Operational Vehicle", deskripsi: "Kendaraan", status: "active", created_at: new Date().toISOString(), kode_asset_type: "AST-VEH", nama_asset_type: "Operational Vehicle" } as any,
]);
const createAssetType = (data: any): Promise<ApiAssetType> => Promise.resolve(data as ApiAssetType);
const updateAssetType = (id: string, data: any): Promise<ApiAssetType> => Promise.resolve(data as ApiAssetType);
const deleteAssetType = (id: string): Promise<{ success: boolean }> => Promise.resolve({ success: true });

const getVendors = (): Promise<ApiVendor[]> => Promise.resolve([
  { id: "1", kode: "VND-001", nama: "PT Astra Otoparts Tbk", alamat: "Jakarta", telepon: "021-460001", email: "sales@aop.co.id", status: "active", created_at: new Date().toISOString(), kode_vendor: "VND-001", nama_vendor: "PT Astra Otoparts Tbk" } as any,
  { id: "2", kode: "VND-002", nama: "PT Denso Indonesia", alamat: "Bekasi", telepon: "021-898001", email: "sales@denso.co.id", status: "active", created_at: new Date().toISOString(), kode_vendor: "VND-002", nama_vendor: "PT Denso Indonesia" } as any,
  { id: "3", kode: "VND-003", nama: "PT Toyota Tsusho Indonesia", alamat: "Jakarta", telepon: "021-572001", email: "sales@tt.co.id", status: "active", created_at: new Date().toISOString(), kode_vendor: "VND-003", nama_vendor: "PT Toyota Tsusho Indonesia" } as any,
]);
const createVendor = (data: any): Promise<ApiVendor> => Promise.resolve(data as ApiVendor);
const updateVendor = (id: string, data: any): Promise<ApiVendor> => Promise.resolve(data as ApiVendor);
const deleteVendor = (id: string): Promise<{ success: boolean }> => Promise.resolve({ success: true });

const getPartNumbers = (): Promise<ApiPartNumber[]> => Promise.resolve([
  { id: "1", part_no: "PN-ENG-001", description: "Bearing High Precision 6204", vendor: "PT Astra Otoparts Tbk", price: 125000, status: "active", created_at: new Date().toISOString(), nomor_part: "PN-ENG-001", nama_part: "Bearing High Precision 6204", harga_satuan: 125000 } as any,
  { id: "2", part_no: "PN-MFG-001", description: "Hydraulic Seal Kit 50mm", vendor: "PT Denso Indonesia", price: 340000, status: "active", created_at: new Date().toISOString(), nomor_part: "PN-MFG-001", nama_part: "Hydraulic Seal Kit 50mm", harga_satuan: 340000 } as any,
]);
const createPartNumber = (data: any): Promise<ApiPartNumber> => Promise.resolve(data as ApiPartNumber);
const updatePartNumber = (id: string, data: any): Promise<ApiPartNumber> => Promise.resolve(data as ApiPartNumber);
const deletePartNumber = (id: string): Promise<{ success: boolean }> => Promise.resolve({ success: true });

const getJenisOtorisasis = (): Promise<ApiJenisOtorisasi[]> => Promise.resolve([
  { id: "1", kode: "JO-PROD", name: "Product Related", description: "Pengadaan komponen part produksi", status: "active", created_at: new Date().toISOString(), kode_jenis: "JO-PROD", nama_jenis: "Product Related" } as any,
  { id: "2", kode: "JO-NONPROD", name: "Non-Product Related", description: "Pengadaan jasa dan barang umum", status: "active", created_at: new Date().toISOString(), kode_jenis: "JO-NONPROD", nama_jenis: "Non-Product Related" } as any,
]);
const createJenisOtorisasi = (data: any): Promise<ApiJenisOtorisasi> => Promise.resolve(data as ApiJenisOtorisasi);
const updateJenisOtorisasi = (id: string, data: any): Promise<ApiJenisOtorisasi> => Promise.resolve(data as ApiJenisOtorisasi);
const deleteJenisOtorisasi = (id: string): Promise<{ success: boolean }> => Promise.resolve({ success: true });

const getJenisBarangs = (): Promise<ApiJenisBarang[]> => Promise.resolve([
  { id: "1", kode: "JB-RAW", name: "Bahan Baku (Raw Material)", description: "Raw Material", status: "active", created_at: new Date().toISOString(), kode_jenis_barang: "JB-RAW", nama_jenis_barang: "Bahan Baku (Raw Material)" } as any,
  { id: "2", kode: "JB-SUB", name: "Sub-Assembly Part", description: "Sub-Assembly", status: "active", created_at: new Date().toISOString(), kode_jenis_barang: "JB-SUB", nama_jenis_barang: "Sub-Assembly Part" } as any,
  { id: "3", kode: "JB-CONS", name: "Consumables & Spareparts", description: "Consumables", status: "active", created_at: new Date().toISOString(), kode_jenis_barang: "JB-CONS", nama_jenis_barang: "Consumables & Spareparts" } as any,
]);
const createJenisBarang = (data: any): Promise<ApiJenisBarang> => Promise.resolve(data as ApiJenisBarang);
const updateJenisBarang = (id: string, data: any): Promise<ApiJenisBarang> => Promise.resolve(data as ApiJenisBarang);
const deleteJenisBarang = (id: string): Promise<{ success: boolean }> => Promise.resolve({ success: true });

export const masterApi = {
  getDepartemens,
  getDepartemen: getDepartemens,
  createDepartemen,
  updateDepartemen,
  deleteDepartemen,

  getRoles,
  getRole: getRoles,
  createRole,
  updateRole,
  deleteRole,

  getPermissions,
  getPermission: getPermissions,
  createPermission,
  updatePermission,
  deletePermission,

  getTypeApprovals,
  getTypeApproval: getTypeApprovals,
  createTypeApproval,
  updateTypeApproval,
  deleteTypeApproval,

  getCostCenters,
  getCostCenter: getCostCenters,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,

  getCapexTypes,
  getCapexType: getCapexTypes,
  createCapexType,
  updateCapexType,
  deleteCapexType,

  getCapexReferences,
  getCapexReference: getCapexReferences,
  createCapexReference,
  updateCapexReference,
  deleteCapexReference,

  getAssetTypes,
  getAssetType: getAssetTypes,
  createAssetType,
  updateAssetType,
  deleteAssetType,

  getVendors,
  getVendor: getVendors,
  createVendor,
  updateVendor,
  deleteVendor,

  getPartNumbers,
  getPartNumber: getPartNumbers,
  createPartNumber,
  updatePartNumber,
  deletePartNumber,

  getJenisOtorisasis,
  getJenisOtorisasi: getJenisOtorisasis,
  createJenisOtorisasi,
  updateJenisOtorisasi,
  deleteJenisOtorisasi,

  getJenisBarangs,
  getJenisBarang: getJenisBarangs,
  createJenisBarang,
  updateJenisBarang,
  deleteJenisBarang,
};
