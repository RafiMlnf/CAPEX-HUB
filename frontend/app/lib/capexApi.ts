import { request } from "./client";
import { CapexProposal, ApiCapexItem } from "./types";

const LOCAL_STORAGE_KEY = "capex_proposals_store";

function getLocalProposals(): CapexProposal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalProposals(items: CapexProposal[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

// ── Proposal Individual Helpers ──────────────────────────────────────────────

export async function getProposals(): Promise<CapexProposal[]> {
  try {
    const data = await request<CapexProposal[]>("/capex-proposals");
    if (Array.isArray(data) && data.length > 0) {
      saveLocalProposals(data);
      return data;
    }
  } catch (err) {
    console.warn("[capexApi] Backend getProposals failed, reading from local store:", err);
  }
  return getLocalProposals();
}

export async function addProposal(data: Partial<CapexProposal>): Promise<CapexProposal> {
  const localId = data.id || `CPX-${Date.now().toString().slice(-6)}`;
  const fallbackItem: CapexProposal = {
    id: localId,
    capexId: data.capexId || "-",
    name: data.name || "Proposal CAPEX",
    description: data.description || "-",
    department: data.department || "PE",
    pic: data.pic || "User",
    estimatedCost: Number(data.estimatedCost) || 0,
    createdAt: new Date().toISOString(),
    gateStatus: (data.gateStatus as any) || "Gate 1 - Finance Review",
    purpose: data.purpose || "Capacity",
    investmentType: data.investmentType || "Capacity Up",
    startDate: data.startDate || new Date().toISOString().slice(0, 10),
    endDate: data.endDate || new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    attachmentName: data.attachmentName || "",
    initialAttachmentName: data.attachmentName || "",
    history: [
      {
        gate: 1,
        action: "Pengajuan Budget Planning Terkirim",
        actor: data.pic || "User",
        timestamp: new Date().toISOString(),
        notes: "Pengajuan baru berhasil dibuat dan diteruskan ke Finance Review."
      }
    ]
  };

  try {
    const result = await request<CapexProposal>("/capex-proposals", {
      method: "POST",
      body: JSON.stringify(data)
    });
    if (result && result.id) {
      const current = getLocalProposals().filter((p) => p.id !== result.id);
      saveLocalProposals([result, ...current]);
      return result;
    }
  } catch (err) {
    console.warn("[capexApi] Backend addProposal failed, saving locally:", err);
  }

  const current = getLocalProposals().filter((p) => p.id !== fallbackItem.id);
  saveLocalProposals([fallbackItem, ...current]);
  return fallbackItem;
}

export async function updateProposal(id: string, data: Partial<CapexProposal>): Promise<CapexProposal> {
  const current = getLocalProposals();
  const existing = current.find((p) => p.id === id);
  const updatedFallback: CapexProposal = {
    ...(existing || ({} as CapexProposal)),
    ...data,
    id,
  };

  try {
    const result = await request<CapexProposal>(`/capex-proposals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
    if (result && result.id) {
      const next = current.map((p) => (p.id === id ? result : p));
      saveLocalProposals(next);
      return result;
    }
  } catch (err) {
    console.warn("[capexApi] Backend updateProposal failed, updating locally:", err);
  }

  const next = current.map((p) => (p.id === id ? updatedFallback : p));
  saveLocalProposals(next);
  return updatedFallback;
}

export async function deleteProposal(id: string): Promise<{ success: boolean }> {
  try {
    await request<{ success: boolean }>(`/capex-proposals/${id}`, {
      method: "DELETE"
    });
  } catch (err) {
    console.warn("[capexApi] Backend deleteProposal failed:", err);
  }
  const next = getLocalProposals().filter((p) => p.id !== id);
  saveLocalProposals(next);
  return { success: true };
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
