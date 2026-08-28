import { request } from "./client";
import { CapexProposal, ApiCapexItem } from "./types";

// ── Proposal Individual Helpers ──────────────────────────────────────────────

export async function getProposals(): Promise<CapexProposal[]> {
  return request<CapexProposal[]>("/capex-proposals");
}

export async function addProposal(data: Partial<CapexProposal>): Promise<CapexProposal> {
  return request<CapexProposal>("/capex-proposals", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateProposal(id: string, data: Partial<CapexProposal>): Promise<CapexProposal> {
  return request<CapexProposal>(`/capex-proposals/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function deleteProposal(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/capex-proposals/${id}`, {
    method: "DELETE"
  });
}

// ── Capex Domain API ─────────────────────────────────────────────────────────

export const capexApi = {
  getProposals,
  addProposal,
  updateProposal,
  deleteProposal,
  getCapexProposals: () => request<CapexProposal[]>("/capex-proposals"),
  getCapexItems: () => request<ApiCapexItem[]>("/capex-items"),
  syncFromBodr: () => request<{ success: boolean; message: string }>("/sync/bodr", { method: "POST" }),
};
