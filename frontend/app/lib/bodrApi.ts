import { request } from "./client";
import { ApiBodrProposal, BodrProgressApiResponse } from "./types";

export const bodrApi = {
  getBodrProposals: () => request<ApiBodrProposal[]>("/bodr"),
  getBodrProposal: (id: string) => request<ApiBodrProposal>(`/bodr/${id}`),
  createBodrProposal: (data: any) =>
    request<ApiBodrProposal>("/bodr", { method: "POST", body: JSON.stringify(data) }),
  updateBodrProposal: (id: string, data: any) =>
    request<ApiBodrProposal>(`/bodr/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBodrProposal: (id: string) =>
    request<{ success: boolean }>(`/bodr/${id}`, { method: "DELETE" }),
  getBodrStats: (userId?: string) =>
    request<any>(userId ? `/bodr/stats?user_id=${encodeURIComponent(userId)}` : "/bodr/stats"),
  getBodrDashboard: (userId?: string) =>
    request<any>(userId ? `/bodr-dashboard?user_id=${encodeURIComponent(userId)}` : "/bodr-dashboard"),
  getBodrProgress: () => request<BodrProgressApiResponse>("/bodr/progress"),
  requestOtorisasiHarga: (data: { bodr_id: number; no_pr: string; deskripsi: string; amount: number }) =>
    request<any>("/bodr/otorisasi-harga-request", { method: "POST", body: JSON.stringify(data) }),
  getBodrHistory: (bodrId?: string) =>
    request<any[]>(bodrId ? `/bodr/history?bodr_id=${encodeURIComponent(bodrId)}` : "/bodr/history"),
};
