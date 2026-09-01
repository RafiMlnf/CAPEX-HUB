import { CapexProposal, ApiCapexItem } from "./types";
import { mockStorage } from "./mockStorage";

// ── Proposal CRUD (Client-side Mock Database) ────────────────────────────────

export async function getProposals(): Promise<CapexProposal[]> {
  return mockStorage.getProposals();
}

export async function addProposal(data: Partial<CapexProposal>): Promise<CapexProposal> {
  const list = mockStorage.getProposals();
  const nextNum = list.length + 1;
  const capexId = `CPX-2026-${String(nextNum).padStart(3, "0")}`;
  const now = new Date().toISOString();

  const newProposal: CapexProposal = {
    id: capexId,
    capexId: capexId,
    name: data.name || "Usulan CAPEX Baru",
    description: data.description || "-",
    department: data.department || "Engineering",
    pic: data.pic || "Pemohon",
    estimatedCost: data.estimatedCost || 0,
    purpose: data.purpose || "Capacity",
    investmentType: data.investmentType || "Capacity Up",
    startDate: data.startDate || now.slice(0, 10),
    endDate: data.endDate || now.slice(0, 10),
    createdAt: now,
    gateStatus: data.gateStatus || (data.id ? "Gate 1 - Finance Review" : "Gate 0 - Idea"),
    attachmentName: data.attachmentName || "",
    history: data.history || [
      {
        gate: 0,
        action: "Usulan Dibuat (Gate 0)",
        actor: data.pic || "Pemohon",
        timestamp: now,
        notes: data.description || "Inisiasi belanja modal baru.",
      },
    ],
  };

  const updated = [newProposal, ...list];
  mockStorage.saveProposals(updated);
  return newProposal;
}

export async function updateProposal(id: string, data: Partial<CapexProposal>): Promise<CapexProposal> {
  const list = mockStorage.getProposals();
  const idx = list.findIndex((p) => p.id === id || p.capexId === id);
  if (idx === -1) {
    // If not found, create it as new
    return addProposal(data);
  }
  const updatedItem: CapexProposal = {
    ...list[idx],
    ...data,
  };
  list[idx] = updatedItem;
  mockStorage.saveProposals(list);
  return updatedItem;
}

export async function deleteProposal(id: string): Promise<{ success: boolean }> {
  const list = mockStorage.getProposals();
  const filtered = list.filter((p) => p.id !== id && p.capexId !== id);
  mockStorage.saveProposals(filtered);
  return { success: true };
}

// ── Capex Domain API ─────────────────────────────────────────────────────────

export const capexApi = {
  getProposals,
  addProposal,
  updateProposal,
  deleteProposal,
  getCapexProposals: () => Promise.resolve(mockStorage.getProposals()),
  getCapexItems: (): Promise<ApiCapexItem[]> => {
    const list = mockStorage.getProposals();
    const items: ApiCapexItem[] = list.map((p, i) => ({
      id: String(i + 1),
      name: p.name,
      department: p.department,
      tahun: "2026",
      budget: p.estimatedCost,
      amount_bodr: 0,
      available: p.estimatedCost,
      capex_type: p.investmentType || "Machine & Equipment",
      status: p.gateStatus,
      created_at: p.createdAt,
    }));
    return Promise.resolve(items);
  },
  syncFromBodr: () => Promise.resolve({ success: true, message: "Synced successfully" }),
  getCapexHistory: (capexId?: string) => {
    const list = mockStorage.getProposals();
    if (capexId) {
      const p = list.find((item) => item.id === capexId || item.capexId === capexId);
      return Promise.resolve(p?.history || []);
    }
    const allHistory = list.flatMap((p) => p.history || []);
    return Promise.resolve(allHistory);
  },
};
