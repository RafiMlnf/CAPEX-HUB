export interface ApiTypeApproval {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiDepartemen {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiCostCenter {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiCapexType {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiCapexReference {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiAssetType {
  id: string;
  class: string;
  nama_type: string;
  deskripsi: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiVendor {
  id: string;
  kode_vendor?: string;
  kode: string;
  email_vendor?: string;
  email: string;
  vendor_name?: string;
  nama: string;
  street: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiPartNumber {
  id: string;
  nama_material: string;
  deskripsi_material: string;
  satuan: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiJenisOtorisasi {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiJenisBarang {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  status: "active" | "inactive";
  created_at: string;
}
