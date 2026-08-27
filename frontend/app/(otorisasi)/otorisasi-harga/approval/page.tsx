"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../components/Header";
import { User, ApiOtorisasiHargaNonProduct, ApiOtorisasiHarga, ApprovalHistoryOH, api, getCurrentUser } from "../../../lib/api";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const STEPS_NP = ["SH PURH", "DH PURH", "User DH", "User Div Head", "Admin Div Head", "Direktur", "Presiden Direktur"];
const STEPS_P = ["SH PURH", "DH PURH", "Admin Div Head", "Direktur", "Presiden Direktur"];

const getFullStepName = (step: string): string => {
  const mapping: Record<string, string> = {
    "SH PURH": "Section Head Purchasing",
    "DH PURH": "Department Head Purchasing",
    "DH Purch": "Department Head Purchasing",
    "User DH": "User Dept Head",
    "User Div Head": "User Div Head",
    "Div Head": "User Div Head",
    "Admin Div Head": "Admin Division Head",
    "Direktur": "Direktur",
    "Presiden Direktur": "Presiden Direktur"
  };
  return mapping[step] || step;
};

const statusBadge = (s: string) => {
  if (s === "Approved") return "bg-emerald-50 text-emerald-700 border border-emerald-300";
  if (s === "Rejected") return "bg-red-50 text-red-700 border border-red-300";
  return "bg-blue-50 text-blue-700 border border-blue-300";
};

// Check if user has permission to approve
const isUserAuthorizedForStep = (user: User | null, step: string): boolean => {
  if (!user) return false;
  const userRole = (user.role as string || "").toUpperCase();
  const userName = (user.username as string || "").toUpperCase();
  
  if (userRole === "ADMIN" || userName === "ADMIN") return true;
  
  const stepUpper = step.toUpperCase();
  if (stepUpper === "SH PURH") {
    return userRole.includes("PURCH") && (userRole.includes("SH") || userRole.includes("SECTION HEAD"));
  }
  if (stepUpper === "DH PURH" || stepUpper === "DH PURCH") {
    return userRole.includes("PURCH") && (userRole.includes("DH") || userRole.includes("DEPT HEAD"));
  }
  if (stepUpper === "USER DH") {
    return userRole.includes("DH") || userRole.includes("DEPT HEAD") || user.department !== "PURCHASING";
  }
  if (stepUpper === "USER DIV HEAD" || stepUpper === "DIV HEAD") {
    return userRole.includes("DIV HEAD") || userRole.includes("DIVISION HEAD");
  }
  if (stepUpper === "ADMIN DIV HEAD") {
    return userRole.includes("ADMIN") || userRole.includes("SEC") || userRole.includes("STAFF") || userRole.includes("DIV HEAD");
  }
  if (stepUpper === "DIREKTUR") {
    return userRole.includes("DIR") || userRole.includes("DIREKTUR") || userRole.includes("DIRECTOR");
  }
  if (stepUpper === "PRESIDEN DIREKTUR") {
    return userRole.includes("PRESDIR") || userRole.includes("PRESIDEN DIREKTUR") || userRole.includes("PRESIDENT DIRECTOR");
  }
  
  return false;
};

export default function OtorisasiHargaApprovalPage() {
  const [activeTab, setActiveTab] = useState<"non-product" | "product">("non-product");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // List States
  const [npItems, setNpItems] = useState<ApiOtorisasiHargaNonProduct[]>([]);
  const [pItems, setPItems] = useState<ApiOtorisasiHarga[]>([]);
  
  // Search & Role states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRoleTab, setActiveRoleTab] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selection states (for Detail Modal)
  const [selectedNP, setSelectedNP] = useState<ApiOtorisasiHargaNonProduct | null>(null);
  const [selectedP, setSelectedP] = useState<ApiOtorisasiHarga | null>(null);

  // Action states
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [bypassCheck, setBypassCheck] = useState(true); // Easy testing bypass
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Advanced Filters
  const [filterBuyer, setFilterBuyer] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Load data
  useEffect(() => {
    setCurrentUser(getCurrentUser());
    refreshData();
  }, []);

  const refreshData = () => {
    api.getOtorisasiHargaNPList()
      .then(data => setNpItems(data || []))
      .catch(err => {
        console.error("Failed to load NP list:", err);
        setNpItems([]);
      });

    api.getOtorisasiHargaList()
      .then(data => setPItems(data || []))
      .catch(err => {
        console.error("Failed to load Product list:", err);
        setPItems([]);
      });
  };

  // Filter Logic for Non-Product
  const filteredNP = npItems.filter(i => {
    if (i.status !== "Pending Review") return false;

    // Dropdown Role Filter mapping
    if (activeRoleTab !== "all" && i.step !== activeRoleTab) return false;

    // Search query
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      const matchSearch = i.no_doc.toLowerCase().includes(s) || i.buyer_nama.toLowerCase().includes(s) || i.no_pr.toLowerCase().includes(s) || i.no_bodr.toLowerCase().includes(s);
      if (!matchSearch) return false;
    }

    // Advanced Filters
    if (filterBuyer && !i.buyer_nama.toLowerCase().includes(filterBuyer.toLowerCase())) return false;
    if (filterDate && !i.tanggal.includes(filterDate)) return false;

    return true;
  });

  // Filter Logic for Product
  const filteredP = pItems.filter(i => {
    if (i.status !== "Pending Review") return false;

    // Dropdown Role Filter mapping
    if (activeRoleTab !== "all" && i.step !== activeRoleTab) return false;

    // Search query
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      const matchSearch = (i.id || "").toLowerCase().includes(s) || (i.product || "").toLowerCase().includes(s) || (i.customer || "").toLowerCase().includes(s);
      if (!matchSearch) return false;
    }

    // Advanced Filters
    if (filterBuyer && !(i.prepared_by || i.buyer || "").toLowerCase().includes(filterBuyer.toLowerCase())) return false;

    return true;
  });

  // Pagination bounds
  const totalNPPages = Math.ceil(filteredNP.length / pageSize) || 1;
  const paginatedNP = filteredNP.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalPPages = Math.ceil(filteredP.length / pageSize) || 1;
  const paginatedP = filteredP.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Stats Card values
  const totalPendingNP = npItems.filter(i => i.status === "Pending Review").length;
  const approvedNPCount = npItems.filter(i => i.status === "Approved").length;
  const rejectedNPCount = npItems.filter(i => i.status === "Rejected").length;

  const totalPendingP = pItems.filter(i => i.status === "Pending Review").length;
  const approvedPCount = pItems.filter(i => i.status === "Approved").length;
  const rejectedPCount = pItems.filter(i => i.status === "Rejected").length;

  // Handle Approval Action
  const handleApprove = async () => {
    if (activeTab === "non-product") {
      if (!selectedNP) return;
      const steps = STEPS_NP;
      const currentStepIdx = steps.indexOf(selectedNP.step);
      const nextStep = steps[currentStepIdx + 1];
      const isLast = currentStepIdx === steps.length - 1;
      
      const nextStatus = isLast ? "Approved" : "Pending Review";
      const nextStepVal = isLast ? selectedNP.step : nextStep;

      const newHistoryEntry: ApprovalHistoryOH = {
        role: selectedNP.step,
        name: currentUser?.name || "Current User",
        status: "Approved",
        note: note || "Disetujui",
        timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " " + new Date().toLocaleTimeString("id-ID"),
      };

      const updated: ApiOtorisasiHargaNonProduct = {
        ...selectedNP,
        step: nextStepVal,
        status: nextStatus as any,
        approval_history: [...(selectedNP.approval_history || []), newHistoryEntry]
      };

      try {
        await api.updateOtorisasiHargaNP(selectedNP.id, updated);
        refreshData();
        setSelectedNP(null);
        setNote("");
        setProcessing(false);
        setAlertMessage("Otorisasi Non-Product berhasil disetujui!");
      } catch (e) {
        console.error(e);
        setProcessing(false);
      }
    } else {
      if (!selectedP) return;
      const stepVal = selectedP.step || "SH PURH";
      const steps = STEPS_P;
      const currentStepIdx = steps.indexOf(stepVal);
      const nextStep = steps[currentStepIdx + 1];
      const isLast = currentStepIdx === steps.length - 1;

      const nextStatus = isLast ? "Approved" : "Pending Review";
      const nextStepVal = isLast ? stepVal : nextStep;

      const newHistoryEntry: ApprovalHistoryOH = {
        role: stepVal,
        name: currentUser?.name || "Current User",
        status: "Approved",
        note: note || "Disetujui",
        timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " " + new Date().toLocaleTimeString("id-ID"),
      };

      const updated: ApiOtorisasiHarga = {
        ...selectedP,
        step: nextStepVal,
        status: nextStatus as any,
        approval_history: [...(selectedP.approval_history || []), newHistoryEntry]
      };

      try {
        await api.updateOtorisasiHarga(selectedP.id, updated);
        refreshData();
        setSelectedP(null);
        setNote("");
        setProcessing(false);
        setAlertMessage("Otorisasi Product berhasil disetujui!");
      } catch (e) {
        console.error(e);
        setProcessing(false);
      }
    }
  };

  // Handle Rejection
  const handleReject = async () => {
    if (activeTab === "non-product") {
      if (!selectedNP) return;
      const newHistoryEntry: ApprovalHistoryOH = {
        role: selectedNP.step,
        name: currentUser?.name || "Current User",
        status: "Rejected",
        note: note || "Ditolak",
        timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " " + new Date().toLocaleTimeString("id-ID"),
      };

      const updated: ApiOtorisasiHargaNonProduct = {
        ...selectedNP,
        status: "Rejected",
        approval_history: [...(selectedNP.approval_history || []), newHistoryEntry]
      };

      try {
        await api.updateOtorisasiHargaNP(selectedNP.id, updated);
        refreshData();
        setSelectedNP(null);
        setNote("");
        setProcessing(false);
        setAlertMessage("Otorisasi Non-Product ditolak!");
      } catch (e) {
        console.error(e);
        setProcessing(false);
      }
    } else {
      if (!selectedP) return;
      const stepVal = selectedP.step || "SH PURH";
      const newHistoryEntry: ApprovalHistoryOH = {
        role: stepVal,
        name: currentUser?.name || "Current User",
        status: "Rejected",
        note: note || "Ditolak",
        timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " " + new Date().toLocaleTimeString("id-ID"),
      };

      const updated: ApiOtorisasiHarga = {
        ...selectedP,
        status: "Rejected",
        approval_history: [...(selectedP.approval_history || []), newHistoryEntry]
      };

      try {
        await api.updateOtorisasiHarga(selectedP.id, updated);
        refreshData();
        setSelectedP(null);
        setNote("");
        setProcessing(false);
        setAlertMessage("Otorisasi Product ditolak!");
      } catch (e) {
        console.error(e);
        setProcessing(false);
      }
    }
  };

  const getCheapestNPIndex = (item: ApiOtorisasiHargaNonProduct) => {
    let cheapestIdx = -1;
    let minPrice = Infinity;
    item.suppliers?.forEach((s, idx) => {
      const price = s.total_final_price ?? s.harga ?? 0;
      if (price < minPrice) {
        minPrice = price;
        cheapestIdx = idx;
      }
    });
    return cheapestIdx;
  };

  // Dropdown list based on active tab steps
  const ROLE_OPTIONS = activeTab === "non-product" 
    ? [{ label: "ALL ROLE", value: "all" }, ...STEPS_NP.map(s => ({ label: getFullStepName(s), value: s }))]
    : [{ label: "ALL ROLE", value: "all" }, ...STEPS_P.map(s => ({ label: getFullStepName(s), value: s }))]

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header 
          title="Approval Harga" 
          subtitle="Verifikasi dan review perbandingan supplier atau diskon penjualan" 
        />
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          
          {/* Active Tab Switcher (Non-Product / Product) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex gap-2 w-fit shadow-sm">
            <button
              onClick={() => { setActiveTab("non-product"); setSearchQuery(""); setNote(""); setProcessing(false); setCurrentPage(1); setActiveRoleTab("all"); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "non-product" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"}`}
            >
              Otorisasi Non-Product ({filteredNP.length})
            </button>
            <button
              onClick={() => { setActiveTab("product"); setSearchQuery(""); setNote(""); setProcessing(false); setCurrentPage(1); setActiveRoleTab("all"); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "product" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"}`}
            >
              Otorisasi Product ({filteredP.length})
            </button>
          </div>

          {/* Stats KPI Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <p className="text-2xl font-black text-blue-600">
                {activeTab === "non-product" ? totalPendingNP : totalPendingP}
              </p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Menunggu Review</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <p className="text-2xl font-black text-emerald-600">
                {activeTab === "non-product" ? approvedNPCount : approvedPCount}
              </p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Approved</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <p className="text-2xl font-black text-red-600">
                {activeTab === "non-product" ? rejectedNPCount : rejectedPCount}
              </p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Rejected / Ditolak</p>
            </div>
          </div>

          {/* Filters Bar — MATCHES BODR STYLE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            
            {/* PILIH ROLE select filter dropdown */}
            <div className="relative flex items-center w-full lg:w-64">
              <span className="absolute left-3.5 text-[9px] font-black text-slate-450 uppercase tracking-widest pointer-events-none">
                Pilih Role:
              </span>
              <select
                value={activeRoleTab}
                onChange={(e) => {
                  setActiveRoleTab(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none pl-20 pr-9 py-2 rounded-xl border outline-none bg-slate-50 border-slate-200 text-slate-900 font-extrabold focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 transition-all text-xs cursor-pointer shadow-xs"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-3.5 text-slate-400 pointer-events-none">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>

            {/* Filter Toggle and Export Button Layout */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-start lg:justify-end flex-shrink-0">
              <button
                onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-xs ${
                  showFiltersDrawer
                    ? "bg-blue-50 text-blue-600 border-blue-300"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
              </button>
              
              {/* Simulation Mode Toggle directly on top right bar */}
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-250 px-4 py-2.5 rounded-xl text-[10px] font-extrabold text-amber-800 shadow-xs">
                <input 
                  type="checkbox" 
                  id="bypass" 
                  checked={bypassCheck} 
                  onChange={e => setBypassCheck(e.target.checked)} 
                  className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer w-3.5 h-3.5"
                />
                <label htmlFor="bypass" className="cursor-pointer">Simulasi Bypass</label>
              </div>
            </div>
          </div>

          {/* Advanced Drawer Filter */}
          {showFiltersDrawer && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-fadeIn">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Pencarian Lanjutan
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Buyer (Nama Pengaju)</label>
                  <input
                    type="text"
                    placeholder="Nama buyer..."
                    value={filterBuyer}
                    onChange={(e) => { setFilterBuyer(e.target.value); setCurrentPage(1); }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white text-slate-800 placeholder-slate-400 focus:border-blue-600 font-semibold h-[40px] text-xs"
                  />
                </div>
                {activeTab === "non-product" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Tanggal Laporan</label>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD..."
                      value={filterDate}
                      onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white text-slate-800 placeholder-slate-400 focus:border-blue-600 font-semibold h-[40px] text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub Bar search box */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="text-slate-500 font-bold">
              Menampilkan {activeTab === "non-product" ? paginatedNP.length : paginatedP.length} dari {activeTab === "non-product" ? filteredNP.length : filteredP.length} item pending
            </div>
            
            <div className="relative w-full md:w-96">
              <svg className="w-4 h-4 text-slate-450 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={activeTab === "non-product" ? "Cari nomor dokumen, buyer, PR..." : "Cari product, customer..."}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:border-blue-600 shadow-xs"
              />
            </div>
          </div>

          {/* Tabular List Representation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 text-[11px] font-black uppercase tracking-wider">
                    {activeTab === "non-product" ? (
                      <>
                        <th className="py-3.5 px-4 text-center border-r border-slate-200 w-32">NOMOR DOKUMEN</th>
                        <th className="py-3.5 px-4 text-center border-r border-slate-200">NO. PR / NO. BODR</th>
                        <th className="py-3.5 px-4 border-r border-slate-200">BUYER (PENGUSUL)</th>
                        <th className="py-3.5 px-4 text-right border-r border-slate-200 w-44">DANA BODR</th>
                        <th className="py-3.5 px-4 text-center border-r border-slate-200 w-40">STATUS VERIFIKASI</th>
                        <th className="py-3.5 px-4 text-center w-32">AKSI</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3.5 px-4 text-center border-r border-slate-200 w-32">NOMOR OTORISASI</th>
                        <th className="py-3.5 px-4 border-r border-slate-200">NAMA PRODUCT / COMPONENT</th>
                        <th className="py-3.5 px-4 border-r border-slate-200">CUSTOMER</th>
                        <th className="py-3.5 px-4 text-right border-r border-slate-200 w-44">HARGA FINAL</th>
                        <th className="py-3.5 px-4 text-center border-r border-slate-200 w-40">STATUS VERIFIKASI</th>
                        <th className="py-3.5 px-4 text-center w-32">AKSI</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 text-xs bg-white">
                  {activeTab === "non-product" ? (
                    paginatedNP.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 italic font-semibold">
                          Tidak ada item pengajuan Non-Product pending review.
                        </td>
                      </tr>
                    ) : (
                      paginatedNP.map(item => (
                        <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 text-center font-bold text-blue-700 font-mono border-r border-slate-200">
                            {item.no_doc}
                          </td>
                          <td className="py-4 px-4 text-center font-semibold text-slate-700 font-mono border-r border-slate-200">
                            <div className="text-[10px] text-slate-400">PR: {item.no_pr || "—"}</div>
                            <div className="text-[10px] text-slate-600 font-bold">BODR: {item.no_bodr || "—"}</div>
                          </td>
                          <td className="py-4 px-4 border-r border-slate-200 font-extrabold text-slate-850">
                            {item.buyer_nama}
                          </td>
                          <td className="py-4 px-4 text-right font-black text-slate-900 font-mono border-r border-slate-200">
                            {fmt(item.dana_bodr)}
                          </td>
                          <td className="py-4 px-4 text-center border-r border-slate-200">
                            <div className="flex items-center gap-2 justify-center">
                              <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 animate-pulse" />
                              <span className="font-extrabold text-blue-600 text-[10px] uppercase">
                                Menunggu {getFullStepName(item.step)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => { setSelectedNP(item); setNote(""); setProcessing(false); }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    paginatedP.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 italic font-semibold">
                          Tidak ada item pengajuan Product pending review.
                        </td>
                      </tr>
                    ) : (
                      paginatedP.map(item => (
                        <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 text-center font-bold text-blue-700 font-mono border-r border-slate-200">
                            {item.id}
                          </td>
                          <td className="py-4 px-4 border-r border-slate-200 font-extrabold text-slate-850">
                            {item.product || item.no_doc || "Product"}
                          </td>
                          <td className="py-4 px-4 border-r border-slate-200 font-bold text-slate-700">
                            {item.customer || item.buyer || "-"}
                          </td>
                          <td className="py-4 px-4 text-right font-black text-slate-900 font-mono border-r border-slate-200">
                            {fmt((item.normal_price || item.final_price || 0) * (1 - (item.discount_pct || 0)/100))}
                          </td>
                          <td className="py-4 px-4 text-center border-r border-slate-200">
                            <div className="flex items-center gap-2 justify-center">
                              <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 animate-pulse" />
                              <span className="font-extrabold text-blue-600 text-[10px] uppercase">
                                Menunggu {getFullStepName(item.step || "SH PURH")}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => { setSelectedP(item); setNote(""); setProcessing(false); }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Halaman {currentPage} dari {activeTab === "non-product" ? totalNPPages : totalPPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 border border-slate-250 rounded-xl font-bold bg-white text-slate-700 hover:bg-slate-50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === (activeTab === "non-product" ? totalNPPages : totalPPages)}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, activeTab === "non-product" ? totalNPPages : totalPPages))}
                  className="px-4 py-2 border border-slate-250 rounded-xl font-bold bg-white text-slate-700 hover:bg-slate-50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ────────────────── Detail Modals ────────────────── */}

      {/* Non-Product Detail Modal */}
      {selectedNP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-[720px] max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 animate-scaleUp transform transition-all duration-300 relative">
            <button 
              onClick={() => setSelectedNP(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <div className="flex items-center gap-3.5">
                <h3 className="font-black text-slate-900 tracking-wide text-sm">{selectedNP.no_doc}</h3>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded border ${statusBadge(selectedNP.status)}`}>{selectedNP.status}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">Detail Otorisasi Harga Non-Product</p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
              <div><p className="text-slate-400 font-bold uppercase text-[9px]">No. PR</p><p className="font-bold text-slate-700 font-mono">{selectedNP.no_pr || "—"}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[9px]">No. BODR</p><p className="font-bold text-slate-700 font-mono">{selectedNP.no_bodr || "—"}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[9px]">Buyer</p><p className="font-bold text-slate-700">{selectedNP.buyer_nama}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[9px]">Dana BODR</p><p className="font-black text-emerald-700 font-mono">{fmt(selectedNP.dana_bodr)}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[9px]">Tahap Approval</p><p className="font-bold text-blue-700">{getFullStepName(selectedNP.step)}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[9px]">Tanggal</p><p className="font-bold text-slate-700">{selectedNP.tanggal}</p></div>
            </div>

            {/* Stepper progress */}
            <div>
              <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest mb-3">Progress Persetujuan</p>
              <div className="grid grid-cols-7 gap-1 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                {STEPS_NP.map((st, sIdx) => {
                  const currentIdx = STEPS_NP.indexOf(selectedNP.step);
                  const isCompleted = sIdx < currentIdx;
                  const isCurrent = sIdx === currentIdx;
                  return (
                    <div key={st} className="text-center space-y-1">
                      <div className={`h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'}`} />
                      <p className={`text-[8.5px] font-black truncate px-0.5 ${isCurrent ? 'text-blue-700 font-black' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {getFullStepName(st)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supplier comparison list */}
            {selectedNP.suppliers && selectedNP.suppliers.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest mb-2">Perbandingan Supplier</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedNP.suppliers.map((s, i) => {
                    const isCheapest = i === getCheapestNPIndex(selectedNP);
                    return (
                      <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between ${isCheapest ? 'border-emerald-500 bg-emerald-50/30 font-medium' : 'border-slate-200 bg-slate-50/50'}`}>
                        <div>
                          <p className="font-extrabold text-slate-900 leading-snug">
                            {s.vendor_nama}
                            {isCheapest && <span className="text-emerald-600 font-black ml-1.5 block md:inline text-[9px] uppercase tracking-wider">Termurah</span>}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{s.jenis_otorisasi_nama || "-"}</p>
                        </div>
                        <p className="font-black text-slate-900 text-xs font-mono mt-3 pt-2 border-t border-slate-100 flex justify-between">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Total Penawaran:</span>
                          {fmt(s.harga ?? s.total_final_price ?? 0)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approval history log */}
            {selectedNP.approval_history && selectedNP.approval_history.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest mb-2">Catatan Persetujuan Sebelumnya</p>
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-150 max-h-40 overflow-y-auto">
                  {selectedNP.approval_history.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${h.status === "Approved" ? "bg-emerald-500" : "bg-red-500"}`} />
                      <div className="flex-1">
                        <p className="font-bold text-slate-700 text-[11px]">{getFullStepName(h.role)} — <span className={h.status === "Approved" ? "text-emerald-600" : "text-red-600"}>{h.status}</span></p>
                        <p className="text-[10px] text-slate-500 font-medium">Oleh: {h.name} · {h.timestamp}</p>
                        <p className="text-[10px] text-slate-400 italic mt-0.5">Note: "{h.note || "—"}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision panel */}
            <ApprovalActionBox
              step={selectedNP.step}
              currentUser={currentUser}
              bypassCheck={bypassCheck}
              processing={processing}
              note={note}
              setNote={setNote}
              setProcessing={setProcessing}
              handleReject={handleReject}
              handleApprove={handleApprove}
            />

          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-[720px] max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 animate-scaleUp transform transition-all duration-300 relative">
            <button 
              onClick={() => setSelectedP(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <div className="flex items-center gap-3.5">
                <h3 className="font-black text-slate-900 tracking-wide text-sm">{selectedP.id}</h3>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded border ${statusBadge(selectedP.status)}`}>{selectedP.status}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">Detail Otorisasi Harga Product</p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
              <div className="col-span-2">
                <p className="text-slate-400 font-bold uppercase text-[9px]">Nama Product / Component</p>
                <p className="font-black text-slate-800 text-sm">{selectedP.product || selectedP.no_doc || "Product"}</p>
              </div>
              <div><p className="text-slate-400 font-bold uppercase text-[9px]">Customer</p><p className="font-bold text-slate-700">{selectedP.customer || selectedP.buyer || "-"}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[9px]">Prepared By</p><p className="font-bold text-slate-700">{selectedP.prepared_by || selectedP.buyer || "-"}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[9px]">Normal Price</p><p className="font-bold text-slate-500 line-through font-mono">{fmt(selectedP.normal_price || selectedP.final_price || 0)}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[9px]">Discount (%)</p><p className="font-bold text-red-600 font-mono">{selectedP.discount_pct || 0}%</p></div>
              <div className="col-span-2"><p className="text-slate-400 font-bold uppercase text-[9px]">Final Price Proposal</p><p className="font-black text-emerald-700 text-sm font-mono">{fmt((selectedP.normal_price || selectedP.final_price || 0) * (1 - (selectedP.discount_pct || 0)/100))}</p></div>
              <div><p className="text-slate-400 font-bold uppercase text-[9px]">Tahap Approval</p><p className="font-bold text-blue-700">{getFullStepName(selectedP.step || "SH PURH")}</p></div>
            </div>

            {/* Stepper progress */}
            <div>
              <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest mb-3">Progress Persetujuan</p>
              <div className="grid grid-cols-5 gap-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                {STEPS_P.map((st, sIdx) => {
                  const currentIdx = STEPS_P.indexOf(selectedP.step || "SH PURH");
                  const isCompleted = sIdx < currentIdx;
                  const isCurrent = sIdx === currentIdx;
                  return (
                    <div key={st} className="text-center space-y-1">
                      <div className={`h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'}`} />
                      <p className={`text-[8.5px] font-black truncate px-0.5 ${isCurrent ? 'text-blue-700 font-black' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {getFullStepName(st)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            {selectedP.notes && (
              <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl text-xs">
                <p className="font-bold text-blue-800 text-[10px] uppercase tracking-wider mb-0.5">Catatan Pengaju</p>
                <p className="text-slate-650 italic">"{selectedP.notes}"</p>
              </div>
            )}

            {/* Approval history log */}
            {selectedP.approval_history && selectedP.approval_history.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest mb-2">Catatan Persetujuan Sebelumnya</p>
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-150 max-h-40 overflow-y-auto">
                  {selectedP.approval_history.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${h.status === "Approved" ? "bg-emerald-500" : "bg-red-500"}`} />
                      <div className="flex-1">
                        <p className="font-bold text-slate-700 text-[11px]">{getFullStepName(h.role)} — <span className={h.status === "Approved" ? "text-emerald-600" : "text-red-600"}>{h.status}</span></p>
                        <p className="text-[10px] text-slate-500 font-medium">Oleh: {h.name} · {h.timestamp}</p>
                        <p className="text-[10px] text-slate-400 italic mt-0.5">Note: "{h.note || "—"}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision panel */}
            <ApprovalActionBox
              step={selectedP.step || "SH PURH"}
              currentUser={currentUser}
              bypassCheck={bypassCheck}
              processing={processing}
              note={note}
              setNote={setNote}
              setProcessing={setProcessing}
              handleReject={handleReject}
              handleApprove={handleApprove}
            />

          </div>
        </div>
      )}

      {/* ────────────────── Centered Premium Notification Modal ────────────────── */}
      {alertMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl p-7 w-96 max-w-[90%] shadow-2xl text-center space-y-4 animate-scaleUp transform transition-all duration-300">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner text-2xl font-black">
              ✓
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-slate-800 text-sm tracking-wide uppercase">Notifikasi</h4>
              <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{alertMessage}</p>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer w-full shadow-md"
            >
              Selesai (OK)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Action Box sub-component
interface ActionBoxProps {
  step: string;
  currentUser: User | null;
  bypassCheck: boolean;
  processing: boolean;
  note: string;
  setNote: (s: string) => void;
  setProcessing: (b: boolean) => void;
  handleReject: () => void;
  handleApprove: () => void;
}

function ApprovalActionBox({
  step,
  currentUser,
  bypassCheck,
  processing,
  note,
  setNote,
  setProcessing,
  handleReject,
  handleApprove
}: ActionBoxProps) {
  const isAuthorized = bypassCheck || isUserAuthorizedForStep(currentUser, step);

  return (
    <div className="border-t border-slate-100 pt-4 space-y-3">
      {!isAuthorized && (
        <div className="bg-amber-50 border border-amber-250 rounded-xl p-3 text-xs text-amber-800 font-bold leading-relaxed">
          Peran login Anda ({currentUser?.role || "Tidak Ada"}) tidak diatur untuk menyetujui langkah <strong>"{step}"</strong> saat ini.
          <p className="text-[10px] text-amber-600 mt-1 font-medium">Gunakan 'Mode Simulasi' di atas untuk menyetujui secara langsung.</p>
        </div>
      )}

      {!processing ? (
        <button 
          onClick={() => setProcessing(true)} 
          disabled={!isAuthorized}
          className={`w-full py-3 font-bold rounded-xl text-xs transition-all shadow-sm ${isAuthorized ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
        >
          Proses Approval / Keputusan →
        </button>
      ) : (
        <div className="space-y-3 animate-fadeIn">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Catatan Keputusan</label>
            <textarea 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500" 
              rows={2} 
              placeholder="Berikan catatan keputusan..."
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleReject} 
              className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-655 text-xs transition-all shadow-xs"
            >
              Tolak (Reject)
            </button>
            <button 
              onClick={handleApprove} 
              className="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-655 text-xs transition-all shadow-xs"
            >
              Setujui (Approve)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
