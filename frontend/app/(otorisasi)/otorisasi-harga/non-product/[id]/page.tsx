"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../../components/Header";
import { ApiOtorisasiHargaNonProduct, ApprovalHistoryOH, api } from "../../../../lib/api";
import { useCapex } from "../../../../context/CapexContext";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const OH_STEPS = [
  "SH PURH",
  "DH Purch",
  "User DH",
  "Div Head",
  "Admin Div Head",
  "Direktur",
  "Presiden Direktur"
];

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

export default function OtorisasiNPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { currentUser } = useCapex();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [item, setItem] = useState<ApiOtorisasiHargaNonProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getOtorisasiHargaNP(id)
      .then(data => setItem(data || null))
      .catch(err => {
        console.error(err);
        setItem(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 font-sans text-xs">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen ml-64">
          <Header title="Otorisasi Harga Non-Product" />
          <div className="flex-1 flex items-center justify-center text-slate-500 font-bold">
            Memuat detail dokumen...
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen bg-slate-50 font-sans text-xs">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen ml-64">
          <Header title="Otorisasi Harga Non-Product" />
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-slate-500 font-bold">Dokumen tidak ditemukan.</p>
            <Link href="/otorisasi-harga/non-product" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-500">
              Kembali ke List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Determine cheapest supplier
  let cheapestIndex = -1;
  let minPrice = Infinity;
  item.suppliers?.forEach((s, idx) => {
    const price = s.total_final_price ?? s.harga ?? 0;
    if (price < minPrice) {
      minPrice = price;
      cheapestIndex = idx;
    }
  });

  const handleApprove = () => {
    setError("");
    const currentIdx = OH_STEPS.indexOf(item.step);
    let nextStep = item.step;
    let nextStatus = item.status;

    if (currentIdx < OH_STEPS.length - 1) {
      nextStep = OH_STEPS[currentIdx + 1];
      nextStatus = "Pending Review";
    } else {
      nextStatus = "Approved";
    }

    const newHistoryEntry: ApprovalHistoryOH = {
      role: item.step,
      name: currentUser?.name || "System Approver",
      status: "Approved",
      timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " " + new Date().toLocaleTimeString("id-ID"),
      note: note || "Approved."
    };

    const updated = {
      ...item,
      step: nextStep,
      status: nextStatus,
      approval_history: [...(item.approval_history || []), newHistoryEntry]
    };

    api.updateOtorisasiHargaNP(item.id, updated)
      .then(() => {
        setItem(updated);
        setNote("");
        setAlertMessage("Dokumen berhasil disetujui!");
      })
      .catch(err => {
        console.error(err);
        setError("Gagal menyetujui dokumen.");
      });
  };

  const handleReject = () => {
    setError("");
    if (!note) {
      setError("Catatan reject wajib diisi!");
      return;
    }

    const newHistoryEntry: ApprovalHistoryOH = {
      role: item.step,
      name: currentUser?.name || "System Approver",
      status: "Rejected",
      timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " " + new Date().toLocaleTimeString("id-ID"),
      note: note
    };

    const updated = {
      ...item,
      status: "Rejected" as const,
      approval_history: [...(item.approval_history || []), newHistoryEntry]
    };

    api.updateOtorisasiHargaNP(item.id, updated)
      .then(() => {
        setItem(updated);
        setNote("");
        setAlertMessage("Dokumen berhasil ditolak!");
      })
      .catch(err => {
        console.error(err);
        setError("Gagal menolak dokumen.");
      });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-xs text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header title="Detail Otorisasi Harga Non-Product" subtitle={`Nomor Dokumen: ${item.no_doc}`} />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-xl font-bold">
              {error}
            </div>
          )}

          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Nomor PR</span>
              <p className="text-sm font-black text-slate-900 font-mono">{item.no_pr || "-"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Nomor BODR</span>
              <p className="text-sm font-black text-slate-900 font-mono">{item.no_bodr || "-"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Dana BODR</span>
              <p className="text-sm font-black text-blue-600 font-mono">{fmt(item.dana_bodr)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Status Dokumen</span>
              <div className="mt-1">
                {item.status === "Approved" ? (
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold uppercase tracking-wider text-[9px]">
                    Disetujui Penuh
                  </span>
                ) : item.status === "Rejected" ? (
                  <span className="px-2.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 font-bold uppercase tracking-wider text-[9px]">
                    Ditolak
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 font-bold uppercase tracking-wider text-[9px]">
                    Menunggu {getFullStepName(item.step)}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Tanggal Pengajuan</span>
              <p className="text-xs font-bold text-slate-700">{item.tanggal}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Buyer (Pembuat)</span>
              <p className="text-xs font-bold text-slate-700">{item.buyer_nama}</p>
            </div>
            <div className="col-span-2 flex justify-end items-center">
              <Link href="/otorisasi-harga/non-product" className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-[10px] uppercase tracking-wider">
                Kembali
              </Link>
            </div>
          </div>

          {/* Simple Step Progress Stepper */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Tahap Approval Dokumen</h4>
            <div className="grid grid-cols-7 gap-1.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {OH_STEPS.map((stepName, idx) => {
                const activeIdx = OH_STEPS.indexOf(item.step);
                const isCompleted = idx < activeIdx || item.status === "Approved";
                const isCurrent = idx === activeIdx && item.status !== "Approved" && item.status !== "Rejected";
                
                return (
                  <div key={stepName} className="text-center space-y-1">
                    <div className={`h-1.5 rounded-full ${isCompleted ? "bg-emerald-500" : isCurrent ? "bg-blue-600 animate-pulse" : "bg-slate-200"}`} />
                    <p className={`text-[8.5px] font-bold truncate px-0.5 ${isCurrent ? "text-blue-700 font-extrabold" : isCompleted ? "text-emerald-600" : "text-slate-400"}`}>
                      {getFullStepName(stepName)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supplier Sheets Comparison */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1.5">Perbandingan Penawaran Supplier</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {item.suppliers && item.suppliers.length > 0 ? (
                item.suppliers.map((sup, sIdx) => {
                  const isCheapest = sIdx === cheapestIndex;
                  return (
                    <div key={sup.vendor_id} className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col space-y-4 transition-all relative overflow-hidden ${
                      isCheapest ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/10" : "border-slate-200"
                    }`}>
                      {isCheapest && (
                        <div className="absolute top-0 right-0 bg-emerald-600 text-white font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-xs">
                          Rekomendasi Termurah
                        </div>
                      )}
                      <div>
                        <span className="text-[8px] font-mono text-slate-400 font-bold block">{sup.vendor_id}</span>
                        <h4 className="text-xs font-black text-slate-900 mt-0.5">{sup.vendor_nama}</h4>
                      </div>

                      {/* Items Table */}
                      <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                        <table className="w-full text-[10px]">
                          <thead className="bg-slate-100/70 border-b border-slate-150">
                            <tr className="text-slate-500 font-bold">
                              <th className="py-2 px-3 text-left">Part Name</th>
                              <th className="py-2 px-3 text-center">Qty</th>
                              <th className="py-2 px-3 text-right">Price Quot</th>
                              <th className="py-2 px-3 text-right">Final Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-slate-700">
                            {sup.items && sup.items.map((it, iIdx) => (
                              <tr key={iIdx}>
                                <td className="py-2 px-3">
                                  <span className="font-bold block text-slate-800">{it.part_name}</span>
                                  <span className="text-[8px] font-mono text-slate-400">{it.part_number}</span>
                                </td>
                                <td className="py-2 px-3 text-center font-bold text-slate-600">{it.qty} {it.satuan}</td>
                                <td className="py-2 px-3 text-right font-mono font-medium">{fmt(it.price_quot)}</td>
                                <td className="py-2 px-3 text-right font-mono font-black text-slate-900">{fmt(it.final_price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Factors and Total */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-150 text-[10px]">
                        <div>
                          <span className="text-slate-450 font-bold block">Quality Factor</span>
                          <span className="font-extrabold text-slate-800">{sup.quality_factor || "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-450 font-bold block">Delivery Factor</span>
                          <span className="font-extrabold text-slate-800">{sup.delivery_factor || "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-450 font-bold block">Safety Factor</span>
                          <span className="font-extrabold text-slate-800">{sup.safety_factor || "-"}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Penawaran</span>
                        <span className="text-sm font-black text-blue-600 font-mono">{fmt(sup.total_final_price ?? sup.harga ?? 0)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 italic">
                  Belum ada supplier yang didaftarkan pada dokumen ini.
                </div>
              )}
            </div>
          </div>

          {/* Workflow Actions */}
          {item.status === "Pending Review" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-850">
                Persetujuan Otorisasi (Step saat ini: {getFullStepName(item.step)})
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Berikan catatan justifikasi lalu klik setuju untuk meneruskan dokumen ke tahap workflow berikutnya, atau tolak dokumen.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Catatan Justifikasi / Review</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ketik catatan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white resize-none font-medium placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleReject}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl transition-all cursor-pointer text-[10px] uppercase tracking-wider shadow-xs"
                >
                  Tolak (Reject)
                </button>
                <button
                  onClick={handleApprove}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition-all cursor-pointer text-[10px] uppercase tracking-wider shadow-xs"
                >
                  Setuju (Approve)
                </button>
              </div>
            </div>
          )}

          {/* Log History */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1.5">Riwayat Approval Workflow</h3>
            <div className="space-y-3">
              {item.approval_history && item.approval_history.length > 0 ? (
                item.approval_history.map((h, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-xs transition-shadow">
                    <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-600 text-xs">
                      {h.name?.substring(0, 2).toUpperCase() || "AP"}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono uppercase">
                            {getFullStepName(h.role)}
                          </span>
                          <span className="text-[11px] font-black text-slate-950">{h.name}</span>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                          h.status === "Approved" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-red-100 text-red-800 border border-red-200"
                        }`}>
                          {h.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">{h.timestamp}</p>
                      <p className="text-[10px] text-slate-650 leading-relaxed font-semibold italic border-l-2 border-slate-300 pl-3.5 mt-2 bg-white/50 py-1.5 rounded-r">
                        &quot;{h.note || "Tanpa catatan."}&quot;
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 italic py-4">Belum ada riwayat approval pada dokumen ini.</p>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Centered Premium Notification Modal */}
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
