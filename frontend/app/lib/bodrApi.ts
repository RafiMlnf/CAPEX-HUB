import { request } from "./client";
import { ApiBodrProposal } from "./types";

export const bodrApi = {
  getBodrProposals: () => request<ApiBodrProposal[]>("/bodr"),
  getBodrProposal: (id: string) => request<ApiBodrProposal>(`/bodr/${id}`),
  createBodrProposal: (data: any) =>
    request<ApiBodrProposal>("/bodr", { method: "POST", body: JSON.stringify(data) }),
  updateBodrProposal: (id: string, data: any) =>
    request<ApiBodrProposal>(`/bodr/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBodrProposal: (id: string) =>
    request<{ success: boolean }>(`/bodr/${id}`, { method: "DELETE" }),
  getBodrStats: () => request<any>("/bodr/stats"),
  getBodrDashboard: () => request<any>("/bodr-dashboard"),
  getBodrProgress: () => request<any[]>("/bodr/progress"),
  requestOtorisasiHarga: (data: { bodr_id: number; no_pr: string; deskripsi: string; amount: number }) =>
    request<any>("/bodr/otorisasi-harga-request", { method: "POST", body: JSON.stringify(data) }),
};
