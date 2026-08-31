import { request } from "./client";
import { ApiOtorisasiHarga, ApiOtorisasiHargaNonProduct } from "./types";

export const otorisasiApi = {
  // Product Otorisasi Harga
  getOtorisasiHargaList: () => request<ApiOtorisasiHarga[]>("/otorisasi-harga"),
  createOtorisasiHarga: (data: any) =>
    request<ApiOtorisasiHarga>("/otorisasi-harga", { method: "POST", body: JSON.stringify(data) }),
  updateOtorisasiHarga: (id: string, data: any) =>
    request<ApiOtorisasiHarga>(`/otorisasi-harga/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteOtorisasiHarga: (id: string) =>
    request<{ success: boolean }>(`/otorisasi-harga/${id}`, { method: "DELETE" }),

  // Non-Product Otorisasi Harga
  getOtorisasiHargaNPList: () => request<ApiOtorisasiHargaNonProduct[]>("/master/otorisasi-harga-np"),
  getOtorisasiHargaNP: (id: string) =>
    request<ApiOtorisasiHargaNonProduct>(`/master/otorisasi-harga-np?id=${id}`),
  createOtorisasiHargaNP: (data: any) =>
    request<ApiOtorisasiHargaNonProduct>("/master/otorisasi-harga-np", { method: "POST", body: JSON.stringify(data) }),
  updateOtorisasiHargaNP: (id: string, data: any) =>
    request<ApiOtorisasiHargaNonProduct>(`/master/otorisasi-harga-np?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteOtorisasiHargaNP: (id: string) =>
    request<{ success: boolean }>(`/master/otorisasi-harga-np?id=${id}`, { method: "DELETE" }),
  getOtorisasiHargaHistory: (ohId?: string) =>
    request<any[]>(ohId ? `/otorisasi-harga/history?oh_id=${encodeURIComponent(ohId)}` : "/otorisasi-harga/history"),
};
