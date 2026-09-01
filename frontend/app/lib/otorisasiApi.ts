import { ApiOtorisasiHarga, ApiOtorisasiHargaNonProduct } from "./types";
import { mockStorage } from "./mockStorage";

export const otorisasiApi = {
  // Product Otorisasi Harga
  getOtorisasiHargaList: (): Promise<ApiOtorisasiHarga[]> => {
    const list = mockStorage.getPriceItems();
    return Promise.resolve(
      list.map((p) => ({
        id: String(p.id),
        no_doc: p.nomor_dokumen || `PO-PRC-2026-${String(p.id).padStart(3, "0")}`,
        product: p.judul || "Product Part",
        customer: "PT Astra Daihatsu Motor",
        vendor: p.vendor || "PT Astra Otoparts Tbk",
        normal_price: p.total_nilai || 10000000,
        discount_pct: 5,
        step: p.stage || "Draft",
        status: p.status || "Waiting Approval",
        created_at: p.created_at || new Date().toISOString(),
        nomor_dokumen: p.nomor_dokumen,
        judul: p.judul,
        tipe: p.tipe,
        departemen: p.departemen,
        total_nilai: p.total_nilai,
      } as any))
    );
  },

  createOtorisasiHarga: (data: any): Promise<ApiOtorisasiHarga> => {
    const list = mockStorage.getPriceItems();
    const newId = list.length + 1;
    const newItem = {
      id: newId,
      nomor_dokumen: data.nomor_dokumen || data.no_doc || `PO-PRC-2026-${String(newId).padStart(3, "0")}`,
      judul: data.judul || data.product || "Pengadaan Sparepart / Barang Baru",
      tipe: "Product",
      departemen: data.departemen || "Purchasing",
      vendor: data.vendor || "PT Astra Otoparts Tbk",
      total_nilai: Number(data.total_nilai || data.normal_price) || 10000000,
      status: "Waiting Approval",
      created_at: new Date().toISOString(),
    };
    mockStorage.savePriceItems([newItem, ...list]);
    return Promise.resolve({
      id: String(newItem.id),
      no_doc: newItem.nomor_dokumen,
      product: newItem.judul,
      customer: "PT Astra Daihatsu Motor",
      vendor: newItem.vendor,
      normal_price: newItem.total_nilai,
      discount_pct: 5,
      step: "Draft",
      status: newItem.status,
      created_at: newItem.created_at,
      nomor_dokumen: newItem.nomor_dokumen,
      judul: newItem.judul,
      tipe: newItem.tipe,
      departemen: newItem.departemen,
      total_nilai: newItem.total_nilai,
    } as any);
  },

  updateOtorisasiHarga: (id: string, data: any): Promise<ApiOtorisasiHarga> => {
    const list = mockStorage.getPriceItems();
    const idx = list.findIndex((p) => String(p.id) === id || p.nomor_dokumen === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      mockStorage.savePriceItems(list);
    }
    const target = idx !== -1 ? list[idx] : list[0];
    return Promise.resolve({
      id: String(target?.id || id),
      no_doc: target?.nomor_dokumen || "PO-PRC-2026-001",
      product: target?.judul || "Product Part",
      customer: "PT Astra Daihatsu Motor",
      vendor: target?.vendor || "PT Astra Otoparts Tbk",
      normal_price: target?.total_nilai || 10000000,
      discount_pct: 5,
      step: target?.stage || "Draft",
      status: target?.status || "Waiting Approval",
      created_at: target?.created_at || new Date().toISOString(),
      nomor_dokumen: target?.nomor_dokumen,
      judul: target?.judul,
      tipe: target?.tipe,
      departemen: target?.departemen,
      total_nilai: target?.total_nilai,
    } as any);
  },

  deleteOtorisasiHarga: (id: string): Promise<{ success: boolean }> => {
    const list = mockStorage.getPriceItems();
    const filtered = list.filter((p) => String(p.id) !== id && p.nomor_dokumen !== id);
    mockStorage.savePriceItems(filtered);
    return Promise.resolve({ success: true });
  },

  // Non-Product Otorisasi Harga
  getOtorisasiHargaNPList: (): Promise<ApiOtorisasiHargaNonProduct[]> => {
    const list = mockStorage.getPriceItems().filter((p) => p.tipe === "Non-Product");
    return Promise.resolve(
      list.map((p) => ({
        id: String(p.id),
        no_doc: p.nomor_dokumen || `NP-PRC-2026-${String(p.id).padStart(3, "0")}`,
        no_pr: "PR-2026-001",
        no_bodr: "BODR-2026-001",
        dana_bodr: 50000000,
        tanggal: p.created_at || new Date().toISOString(),
        buyer_id: "1",
        buyer_nama: "Rina Wijaya",
        suppliers: [],
        step: "Draft",
        status: "Draft",
        approval_history: [],
        created_at: p.created_at || new Date().toISOString(),
        nomor_dokumen: p.nomor_dokumen,
        judul: p.judul,
        tipe: "Non-Product",
        departemen: p.departemen,
        vendor: p.vendor,
        total_nilai: p.total_nilai,
      } as any))
    );
  },

  getOtorisasiHargaNP: (id: string): Promise<ApiOtorisasiHargaNonProduct> => {
    const list = mockStorage.getPriceItems();
    const found = list.find((p) => String(p.id) === id || p.nomor_dokumen === id) || list[0];
    return Promise.resolve({
      id: String(found?.id || 1),
      no_doc: found?.nomor_dokumen || "NP-PRC-2026-001",
      no_pr: "PR-2026-001",
      no_bodr: "BODR-2026-001",
      dana_bodr: 50000000,
      tanggal: found?.created_at || new Date().toISOString(),
      buyer_id: "1",
      buyer_nama: "Rina Wijaya",
      suppliers: [],
      step: "Draft",
      status: "Draft",
      approval_history: [],
      created_at: found?.created_at || new Date().toISOString(),
      nomor_dokumen: found?.nomor_dokumen,
      judul: found?.judul,
      tipe: "Non-Product",
      departemen: found?.departemen,
      vendor: found?.vendor,
      total_nilai: found?.total_nilai,
    } as any);
  },

  createOtorisasiHargaNP: (data: any): Promise<ApiOtorisasiHargaNonProduct> => {
    const list = mockStorage.getPriceItems();
    const newId = list.length + 1;
    const newItem = {
      id: newId,
      nomor_dokumen: data.nomor_dokumen || data.no_doc || `NP-PRC-2026-${String(newId).padStart(3, "0")}`,
      judul: data.judul || "Pengadaan Jasa / Non-Product",
      tipe: "Non-Product",
      departemen: data.departemen || "QA & QC",
      vendor: data.vendor || "PT Denso Indonesia",
      total_nilai: Number(data.total_nilai || data.dana_bodr) || 15000000,
      status: "Waiting Approval",
      created_at: new Date().toISOString(),
    };
    mockStorage.savePriceItems([newItem, ...list]);
    return Promise.resolve({
      id: String(newItem.id),
      no_doc: newItem.nomor_dokumen,
      no_pr: "PR-2026-001",
      no_bodr: "BODR-2026-001",
      dana_bodr: newItem.total_nilai,
      tanggal: newItem.created_at,
      buyer_id: "1",
      buyer_nama: "Rina Wijaya",
      suppliers: [],
      step: "Draft",
      status: "Draft",
      approval_history: [],
      created_at: newItem.created_at,
      nomor_dokumen: newItem.nomor_dokumen,
      judul: newItem.judul,
      tipe: newItem.tipe,
      departemen: newItem.departemen,
      vendor: newItem.vendor,
      total_nilai: newItem.total_nilai,
    } as any);
  },

  updateOtorisasiHargaNP: (id: string, data: any): Promise<ApiOtorisasiHargaNonProduct> => {
    const list = mockStorage.getPriceItems();
    const idx = list.findIndex((p) => String(p.id) === id || p.nomor_dokumen === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      mockStorage.savePriceItems(list);
    }
    const target = idx !== -1 ? list[idx] : list[0];
    return Promise.resolve({
      id: String(target?.id || id),
      no_doc: target?.nomor_dokumen || "NP-PRC-2026-001",
      no_pr: "PR-2026-001",
      no_bodr: "BODR-2026-001",
      dana_bodr: target?.total_nilai || 15000000,
      tanggal: target?.created_at || new Date().toISOString(),
      buyer_id: "1",
      buyer_nama: "Rina Wijaya",
      suppliers: [],
      step: "Draft",
      status: "Draft",
      approval_history: [],
      created_at: target?.created_at || new Date().toISOString(),
      nomor_dokumen: target?.nomor_dokumen,
      judul: target?.judul,
      tipe: target?.tipe,
      departemen: target?.departemen,
      vendor: target?.vendor,
      total_nilai: target?.total_nilai,
    } as any);
  },

  deleteOtorisasiHargaNP: (id: string): Promise<{ success: boolean }> => {
    const list = mockStorage.getPriceItems();
    const filtered = list.filter((p) => String(p.id) !== id && p.nomor_dokumen !== id);
    mockStorage.savePriceItems(filtered);
    return Promise.resolve({ success: true });
  },

  getOtorisasiHargaHistory: () => Promise.resolve([]),
};
