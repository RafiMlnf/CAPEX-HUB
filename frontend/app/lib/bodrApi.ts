import { ApiBodrProposal, BodrProgressApiResponse } from "./types";
import { mockStorage } from "./mockStorage";

export const bodrApi = {
  getBodrProposals: (): Promise<ApiBodrProposal[]> => {
    const items = mockStorage.getBodrItems();
    const mapped: ApiBodrProposal[] = items.map((b) => ({
      id: String(b.id),
      bodr_no: b.nomor_bodr || `BODR-2026-${String(b.id).padStart(3, "0")}`,
      title: b.deskripsi || "Usulan BODR",
      category: "CAPEX",
      department: b.departemen || "Engineering",
      amount: 100000000,
      step: b.stage || "Draft",
      status: b.status || "Draft",
      date: b.created_at || new Date().toISOString(),
      proposer: "Budi Santoso",
      capex_id: b.capex_number || "CPX-2026-001",
      nomor_bodr: b.nomor_bodr,
      deskripsi: b.deskripsi,
      departemen: b.departemen,
      capex_number: b.capex_number,
      stage: b.stage,
      created_at: b.created_at,
    } as any));
    return Promise.resolve(mapped);
  },

  getBodrProposal: (id: string): Promise<ApiBodrProposal> => {
    const items = mockStorage.getBodrItems();
    const found = items.find((b) => String(b.id) === id || b.nomor_bodr === id) || items[0];
    return Promise.resolve({
      id: String(found?.id || 1),
      bodr_no: found?.nomor_bodr || "BODR-2026-001",
      title: found?.deskripsi || "Usulan BODR",
      category: "CAPEX",
      department: found?.departemen || "Engineering",
      amount: 100000000,
      step: found?.stage || "Draft",
      status: found?.status || "Draft",
      date: found?.created_at || new Date().toISOString(),
      proposer: "Budi Santoso",
      capex_id: found?.capex_number || "CPX-2026-001",
      nomor_bodr: found?.nomor_bodr,
      deskripsi: found?.deskripsi,
      departemen: found?.departemen,
      capex_number: found?.capex_number,
      stage: found?.stage,
      created_at: found?.created_at,
    } as any);
  },

  createBodrProposal: (data: any): Promise<ApiBodrProposal> => {
    const items = mockStorage.getBodrItems();
    const newId = items.length + 1;
    const newItem = {
      id: newId,
      nomor_bodr: data.nomor_bodr || data.bodr_no || `BODR-2026-${String(newId).padStart(3, "0")}`,
      deskripsi: data.deskripsi || data.title || "Usulan BODR Baru",
      departemen: data.departemen || data.department || "Engineering",
      capex_number: data.capex_number || data.capex_id || `CPX-2026-${String(newId).padStart(3, "0")}`,
      stage: data.stage || data.step || "Draft",
      status: data.status || "Draft",
      created_at: new Date().toISOString(),
    };
    mockStorage.saveBodrItems([newItem, ...items]);
    return Promise.resolve({
      id: String(newItem.id),
      bodr_no: newItem.nomor_bodr,
      title: newItem.deskripsi,
      category: "CAPEX",
      department: newItem.departemen,
      amount: data.amount || 100000000,
      step: newItem.stage,
      status: newItem.status,
      date: newItem.created_at,
      proposer: data.proposer || "Budi Santoso",
      capex_id: newItem.capex_number,
      nomor_bodr: newItem.nomor_bodr,
      deskripsi: newItem.deskripsi,
      departemen: newItem.departemen,
      capex_number: newItem.capex_number,
      stage: newItem.stage,
      created_at: newItem.created_at,
    } as any);
  },

  updateBodrProposal: (id: string, data: any): Promise<ApiBodrProposal> => {
    const items = mockStorage.getBodrItems();
    const idx = items.findIndex((b) => String(b.id) === id || b.nomor_bodr === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...data };
      mockStorage.saveBodrItems(items);
    }
    const target = idx !== -1 ? items[idx] : items[0];
    return Promise.resolve({
      id: String(target?.id || id),
      bodr_no: target?.nomor_bodr || "BODR-2026-001",
      title: target?.deskripsi || "Usulan BODR",
      category: "CAPEX",
      department: target?.departemen || "Engineering",
      amount: data.amount || 100000000,
      step: target?.stage || data.step || "Draft",
      status: target?.status || data.status || "Draft",
      date: target?.created_at || new Date().toISOString(),
      proposer: data.proposer || "Budi Santoso",
      capex_id: target?.capex_number,
      nomor_bodr: target?.nomor_bodr,
      deskripsi: target?.deskripsi,
      departemen: target?.departemen,
      capex_number: target?.capex_number,
      stage: target?.stage,
      created_at: target?.created_at,
    } as any);
  },

  deleteBodrProposal: (id: string): Promise<{ success: boolean }> => {
    const items = mockStorage.getBodrItems();
    const filtered = items.filter((b) => String(b.id) !== id && b.nomor_bodr !== id);
    mockStorage.saveBodrItems(filtered);
    return Promise.resolve({ success: true });
  },

  getBodrStats: (userId?: string) => {
    const items = mockStorage.getBodrItems();
    return Promise.resolve({
      total: items.length,
      draft: items.filter((b) => b.status === "Draft").length,
      in_progress: items.filter((b) => b.status === "In Progress").length,
      approved: items.filter((b) => b.status === "Approved").length,
    });
  },

  getBodrDashboard: (userId?: string) => {
    const items = mockStorage.getBodrItems();
    return Promise.resolve({
      items,
      totalCount: items.length,
    });
  },

  getBodrProgress: (): Promise<BodrProgressApiResponse> => {
    const items = mockStorage.getBodrItems();
    return Promise.resolve({
      proposals: items.map((b) => ({
        id: String(b.id),
        bodr_no: b.nomor_bodr || `BODR-2026-${String(b.id).padStart(3, "0")}`,
        title: b.deskripsi || "Usulan BODR",
        category: "CAPEX",
        department: b.departemen || "Engineering",
        proposer: "Budi Santoso",
        amount: 100000000,
        status: b.status || "Draft",
        current_step: 1,
        created_at: b.created_at || new Date().toISOString(),
        approval_history: [],
        workflow_id: null,
        workflow_steps: [],
      })),
      workflows: [],
    });
  },

  requestOtorisasiHarga: (data: { bodr_id: number; no_pr: string; deskripsi: string; amount: number }) => {
    return Promise.resolve({ success: true, message: "Otorisasi Harga requested successfully", data });
  },

  getBodrHistory: () => Promise.resolve([]),
};
