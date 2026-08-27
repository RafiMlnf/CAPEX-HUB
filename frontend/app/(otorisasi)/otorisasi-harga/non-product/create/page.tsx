"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "../../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../../components/Header";
import { ApiBodrProposal, ApiVendor, ApiJenisOtorisasi, api } from "../../../../lib/api";
import { useCapex } from "../../../../context/CapexContext";

const inputCls = "w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm shadow-xs transition-all placeholder:text-slate-400";
const selectCls = "w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm shadow-xs transition-all cursor-pointer";
const fmt = (n: number) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

interface ItemRow {
  part_number: string;
  part_name: string;
  qty: number;
  satuan: string;
  price_quote: number;
  target_price: number;
  final_price: number;
}

interface SupplierFormItem {
  vendor_id: string;
  vendor_nama: string;
  items: ItemRow[];
  quality_factor: string;
  delivery_factor: string;
  safety_factor: string;
  keterangan: string;
  recommended: boolean;
}

export default function CreateOtorisasiNPPage() {
  const { currentUser } = useCapex();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preBodrId = searchParams.get("bodr_id") || "";

  const [bodrList, setBodrList] = useState<ApiBodrProposal[]>([]);
  const [vendors, setVendors] = useState<ApiVendor[]>([]);
  const [jenisOtorisasi, setJenisOtorisasi] = useState<ApiJenisOtorisasi[]>([]);

  // Header form fields
  const [noDoc, setNoDoc] = useState("");
  const [selectedBodr, setSelectedBodr] = useState<ApiBodrProposal | null>(null);
  const [noPr, setNoPr] = useState("");
  const [danaBodr, setDanaBodr] = useState(0);
  const [selectedJenisId, setSelectedJenisId] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);

  // Suppliers list with multiple items and Q/D/S factors
  const [suppliers, setSuppliers] = useState<SupplierFormItem[]>([
    {
      vendor_id: "",
      vendor_nama: "",
      items: [
        { part_number: "", part_name: "", qty: 1, satuan: "pcs", price_quote: 0, target_price: 0, final_price: 0 }
      ],
      quality_factor: "Baik",
      delivery_factor: "On-Time",
      safety_factor: "OK",
      keterangan: "",
      recommended: false,
    }
  ]);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Generate default No. Doc
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    setNoDoc(`OH-NP/${dateStr}/${String(Math.floor(1000 + Math.random() * 9000))}`);
  }, []);

  const handleSelectBodr = useCallback((b: ApiBodrProposal | null) => {
    setSelectedBodr(b);
    if (b) {
      setNoPr((b as any).no_pr || (b as any).pr_no || `PR-${b.bodr_no.replace("BODR-", "")}`);
      setDanaBodr(b.amount || 0);
    } else {
      setNoPr("");
      setDanaBodr(0);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      api.getBodrProposals(),
      api.getVendors(),
      api.getJenisOtorisasi(),
    ]).then(([allBodr, vList, jList]) => {
      const approved = (allBodr || []).filter(b => b.status === "Approved" || b.status === "approved");
      setBodrList(approved);
      setVendors(vList || []);
      setJenisOtorisasi(jList || []);
      if (jList && jList.length > 0) setSelectedJenisId(jList[0].id);

      if (preBodrId) {
        const found = approved.find(b => b.id === preBodrId);
        if (found) {
          handleSelectBodr(found);
        }
      }
    }).catch(console.error);
  }, [preBodrId, handleSelectBodr]);

  // Supplier handlers
  const addSupplier = () => {
    setSuppliers(prev => [
      ...prev,
      {
        vendor_id: "",
        vendor_nama: "",
        items: [
          { part_number: "", part_name: "", qty: 1, satuan: "pcs", price_quote: 0, target_price: 0, final_price: 0 }
        ],
        quality_factor: "Baik",
        delivery_factor: "On-Time",
        safety_factor: "OK",
        keterangan: "",
        recommended: false,
      }
    ]);
  };

  const removeSupplier = (idx: number) => {
    if (suppliers.length <= 1) return;
    setSuppliers(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSupplierField = (idx: number, field: keyof SupplierFormItem, value: any) => {
    setSuppliers(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      if (field === "vendor_id") {
        const v = vendors.find(v => v.id === value);
        return { ...s, vendor_id: value, vendor_nama: v?.nama || "" };
      }
      return { ...s, [field]: value };
    }));
  };

  // Item per supplier handlers
  const addItem = (supplierIdx: number) => {
    setSuppliers(prev => prev.map((s, i) => {
      if (i !== supplierIdx) return s;
      return {
        ...s,
        items: [
          ...s.items,
          { part_number: "", part_name: "", qty: 1, satuan: "pcs", price_quote: 0, target_price: 0, final_price: 0 }
        ]
      };
    }));
  };

  const removeItem = (supplierIdx: number, itemIdx: number) => {
    setSuppliers(prev => prev.map((s, i) => {
      if (i !== supplierIdx) return s;
      if (s.items.length <= 1) return s;
      return {
        ...s,
        items: s.items.filter((_, idx) => idx !== itemIdx)
      };
    }));
  };

  const updateItemField = (supplierIdx: number, itemIdx: number, field: keyof ItemRow, value: any) => {
    setSuppliers(prev => prev.map((s, i) => {
      if (i !== supplierIdx) return s;
      const updatedItems = s.items.map((it, idx) => {
        if (idx !== itemIdx) return it;
        return { ...it, [field]: value };
      });
      return { ...s, items: updatedItems };
    }));
  };

  // Calculate total final price per supplier
  const getSupplierTotal = (s: SupplierFormItem) => {
    return s.items.reduce((acc, it) => acc + (Number(it.qty || 1) * Number(it.final_price || 0)), 0);
  };

  // Find lowest price supplier
  const totals = suppliers.map(s => getSupplierTotal(s));
  const validTotals = totals.filter(t => t > 0);
  const lowestTotal = validTotals.length > 0 ? Math.min(...validTotals) : -1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noDoc) { setError("No. Dokumen wajib diisi!"); return; }
    if (!selectedBodr) { setError("Pilih BODR yang terkait!"); return; }
    if (!noPr) { setError("No. PR wajib diisi!"); return; }
    if (suppliers.some(s => !s.vendor_id)) { setError("Pilih vendor untuk setiap supplier!"); return; }
    if (suppliers.some(s => s.items.some(it => !it.part_name || it.final_price <= 0))) {
      setError("Lengkapi nama part dan harga final pada setiap item supplier!");
      return;
    }

    setError("");
    setSubmitting(true);

    // Pick recommendation
    let finalRecommendedIndex = suppliers.findIndex(s => s.recommended);
    if (finalRecommendedIndex === -1 && lowestTotal > 0) {
      finalRecommendedIndex = totals.findIndex(t => t === lowestTotal);
    }
    if (finalRecommendedIndex === -1) finalRecommendedIndex = 0;

    const formattedSuppliers = suppliers.map((s, i) => {
      const supTotal = getSupplierTotal(s);
      return {
        vendor_id: s.vendor_id,
        vendor_nama: s.vendor_nama,
        harga: supTotal,
        total_final_price: supTotal,
        items: s.items,
        quality_factor: s.quality_factor,
        delivery_factor: s.delivery_factor,
        safety_factor: s.safety_factor,
        keterangan: s.keterangan,
        recommended: i === finalRecommendedIndex,
        is_lowest_price: supTotal === lowestTotal,
      };
    });

    try {
      await api.createOtorisasiHargaNP({
        no_doc: noDoc,
        no_pr: noPr,
        bodr_id: selectedBodr.id,
        no_bodr: selectedBodr.bodr_no,
        dana_bodr: danaBodr,
        tanggal,
        buyer_id: currentUser?.id || "USR-001",
        buyer_nama: currentUser?.name || "Purchasing Staff",
        jenis_otorisasi_id: selectedJenisId,
        suppliers: formattedSuppliers,
        step: "SH PURH",
        status: "Pending Review",
        approval_history: [],
      });

      router.push("/otorisasi-harga/non-product");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal membuat otorisasi harga non-product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/80 font-sans text-slate-900 antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header
          title="Buat Otorisasi Harga Non-Product"
          subtitle="Form perbandingan harga supplier dari pengajuan BODR"
        />
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200/80 text-red-700 text-sm p-4 rounded-2xl font-medium flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* 1. INFORMASI DOKUMEN & BODR */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4.5 bg-gradient-to-r from-slate-50/80 to-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight">Informasi Dokumen & BODR</h3>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-lg">
                  Non-Product
                </span>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-slate-600 font-semibold text-xs flex items-center gap-1">
                      No. Dokumen <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className={inputCls}
                      value={noDoc}
                      onChange={e => setNoDoc(e.target.value)}
                      placeholder="Contoh: OH-NP/2026/001"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-600 font-semibold text-xs flex items-center gap-1">
                      BODR Terkait (Approved) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className={selectCls}
                      value={selectedBodr?.id || ""}
                      onChange={e => {
                        const b = bodrList.find(b => b.id === e.target.value);
                        handleSelectBodr(b || null);
                      }}
                      required
                    >
                      <option value="">Pilih Pengajuan BODR</option>
                      {bodrList.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.bodr_no} — {b.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-600 font-semibold text-xs flex items-center gap-1">
                      No. PR <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className={inputCls}
                      value={noPr}
                      onChange={e => setNoPr(e.target.value)}
                      placeholder="Contoh: PR-2026-001"
                      required
                    />
                  </div>
                </div>

                {selectedBodr && (
                  <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100 rounded-xl p-4.5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-blue-100/60">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">No. BODR</p>
                      <p className="font-mono font-bold text-blue-700 text-sm">{selectedBodr.bodr_no}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-blue-100/60">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Judul Pengajuan</p>
                      <p className="font-semibold text-slate-800 text-xs truncate" title={selectedBodr.title}>{selectedBodr.title}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-blue-100/60">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Dana Alokasi BODR</p>
                      <p className="font-bold text-emerald-700 text-sm">{fmt(danaBodr)}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-slate-600 font-semibold text-xs">Jenis Source</label>
                    <select
                      className={selectCls}
                      value={selectedJenisId}
                      onChange={e => setSelectedJenisId(e.target.value)}
                    >
                      {jenisOtorisasi.map(j => (
                        <option key={j.id} value={j.id}>{j.kode} — {j.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-600 font-semibold text-xs flex items-center gap-1">
                      Tanggal Kerja <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      className={inputCls}
                      value={tanggal}
                      onChange={e => setTanggal(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-600 font-semibold text-xs">Buyer (Purchasing)</label>
                    <div className="relative">
                      <input
                        className={inputCls + " bg-slate-50 text-slate-600 font-medium pl-9 cursor-not-allowed"}
                        value={currentUser?.name || "Purchasing Staff"}
                        readOnly
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PERBANDINGAN HARGA SUPPLIER & DETAIL ITEM */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4.5 bg-gradient-to-r from-slate-50/80 to-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                    Perbandingan Harga Supplier
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lengkapi penawaran item dan faktor penilaian (Quality, Delivery, Safety) untuk tiap supplier
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSupplier}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-all shadow-xs hover:shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                  Tambah Supplier
                </button>
              </div>

              <div className="p-6 space-y-6">
                {suppliers.map((s, sIdx) => {
                  const sTotal = getSupplierTotal(s);
                  const isLowest = sTotal > 0 && sTotal === lowestTotal;
                  return (
                    <div
                      key={sIdx}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isLowest
                          ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/30 to-white shadow-xs'
                          : s.recommended
                          ? 'border-blue-300 bg-gradient-to-b from-blue-50/20 to-white shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Supplier Card Header */}
                      <div className={`px-5 py-3.5 border-b flex items-center justify-between flex-wrap gap-2 ${
                        isLowest ? 'bg-emerald-50/70 border-emerald-200' : s.recommended ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50/80 border-slate-100'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs ${
                            isLowest ? 'bg-emerald-600 text-white' : s.recommended ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
                          }`}>
                            {sIdx + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            Supplier {sIdx + 1}
                          </span>
                          {isLowest && (
                            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                              ★ Harga Terendah
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:border-blue-300">
                            <input
                              type="radio"
                              name="recommended"
                              checked={s.recommended || (isLowest && !suppliers.some(s2 => s2.recommended))}
                              onChange={() => {
                                setSuppliers(prev => prev.map((s2, i2) => ({
                                  ...s2,
                                  recommended: i2 === sIdx
                                })));
                              }}
                              className="accent-blue-600 w-3.5 h-3.5"
                            />
                            <span>Pilih Rekomendasi</span>
                          </label>

                          {suppliers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSupplier(sIdx)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-5 space-y-5">
                        {/* Supplier Vendor Selector & Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-slate-600 font-semibold text-xs flex items-center gap-1">
                              Nama Supplier (Master Vendor) <span className="text-rose-500">*</span>
                            </label>
                            <select
                              className={selectCls}
                              value={s.vendor_id}
                              onChange={e => updateSupplierField(sIdx, "vendor_id", e.target.value)}
                              required
                            >
                              <option value="">Pilih Vendor</option>
                              {vendors.map(v => (
                                <option key={v.id} value={v.id}>
                                  {v.kode} — {v.nama}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-slate-600 font-semibold text-xs">
                              Catatan / Keterangan Khusus
                            </label>
                            <input
                              className={inputCls}
                              value={s.keterangan}
                              onChange={e => updateSupplierField(sIdx, "keterangan", e.target.value)}
                              placeholder="Catatan penawaran supplier..."
                            />
                          </div>
                        </div>

                        {/* Detail Items Table */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-slate-700 font-bold text-xs flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              Daftar Item Material / Jasa
                            </label>
                            <button
                              type="button"
                              onClick={() => addItem(sIdx)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50/60 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                              </svg>
                              Tambah Item
                            </button>
                          </div>

                          <div className="border border-slate-200/90 rounded-xl overflow-x-auto shadow-2xs">
                            <table className="w-full text-xs text-left min-w-[760px]">
                              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                                <tr>
                                  <th className="px-3.5 py-3 w-[16%]">Part Number</th>
                                  <th className="px-3.5 py-3 w-[24%]">Part Name <span className="text-rose-500">*</span></th>
                                  <th className="px-3.5 py-3 w-[10%]">Qty</th>
                                  <th className="px-3.5 py-3 w-[11%]">Satuan</th>
                                  <th className="px-3.5 py-3 w-[13%]">Price Quote (Rp)</th>
                                  <th className="px-3.5 py-3 w-[13%]">Target Price (Rp)</th>
                                  <th className="px-3.5 py-3 w-[15%]">Final Price (Rp) <span className="text-rose-500">*</span></th>
                                  <th className="px-2 py-3 w-10 text-center"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {s.items.map((it, itIdx) => (
                                  <tr key={itIdx} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-2.5">
                                      <input
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                        value={it.part_number}
                                        onChange={e => updateItemField(sIdx, itIdx, "part_number", e.target.value)}
                                        placeholder="PN-001"
                                      />
                                    </td>
                                    <td className="p-2.5">
                                      <input
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                        value={it.part_name}
                                        onChange={e => updateItemField(sIdx, itIdx, "part_name", e.target.value)}
                                        placeholder="Nama part / jasa"
                                        required
                                      />
                                    </td>
                                    <td className="p-2.5">
                                      <input
                                        type="number"
                                        min={1}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={it.qty}
                                        onChange={e => updateItemField(sIdx, itIdx, "qty", Number(e.target.value))}
                                        required
                                      />
                                    </td>
                                    <td className="p-2.5">
                                      <select
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                        value={it.satuan}
                                        onChange={e => updateItemField(sIdx, itIdx, "satuan", e.target.value)}
                                      >
                                        <option value="pcs">pcs</option>
                                        <option value="kg">kg</option>
                                        <option value="unit">unit</option>
                                        <option value="set">set</option>
                                        <option value="lot">lot</option>
                                        <option value="meter">meter</option>
                                        <option value="lembar">lembar</option>
                                      </select>
                                    </td>
                                    <td className="p-2.5">
                                      <input
                                        type="number"
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                        value={it.price_quote || ""}
                                        onChange={e => updateItemField(sIdx, itIdx, "price_quote", Number(e.target.value))}
                                        placeholder="0"
                                      />
                                    </td>
                                    <td className="p-2.5">
                                      <input
                                        type="number"
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                        value={it.target_price || ""}
                                        onChange={e => updateItemField(sIdx, itIdx, "target_price", Number(e.target.value))}
                                        placeholder="0"
                                      />
                                    </td>
                                    <td className="p-2.5">
                                      <input
                                        type="number"
                                        className="w-full bg-blue-50/50 border border-blue-200 text-blue-900 font-bold rounded-lg px-2.5 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-blue-300"
                                        value={it.final_price || ""}
                                        onChange={e => updateItemField(sIdx, itIdx, "final_price", Number(e.target.value))}
                                        placeholder="0"
                                        required
                                      />
                                    </td>
                                    <td className="p-2.5 text-center">
                                      {s.items.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeItem(sIdx, itIdx)}
                                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors cursor-pointer"
                                          title="Hapus baris item"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Final Supplier Evaluation Factors (Q/D/S) */}
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-bold text-slate-700">
                              Faktor Penilaian Final Supplier (Quality, Delivery, Safety)
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                            <div className="space-y-1">
                              <label className="text-slate-500 font-semibold text-[11px]">Quality Factor</label>
                              <input
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                                value={s.quality_factor}
                                onChange={e => updateSupplierField(sIdx, "quality_factor", e.target.value)}
                                placeholder="Contoh: Baik / Grade A"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-500 font-semibold text-[11px]">Delivery Factor</label>
                              <input
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                                value={s.delivery_factor}
                                onChange={e => updateSupplierField(sIdx, "delivery_factor", e.target.value)}
                                placeholder="Contoh: On-Time / 1 Minggu"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-500 font-semibold text-[11px]">Safety Factor</label>
                              <input
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                                value={s.safety_factor}
                                onChange={e => updateSupplierField(sIdx, "safety_factor", e.target.value)}
                                placeholder="Default: OK"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Total Calculation */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-xs font-semibold text-slate-500">
                            Total Penawaran Supplier {sIdx + 1}:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-900 font-mono">
                              {fmt(sTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3.5 pt-2 pb-12">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-all shadow-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Submit Otorisasi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
