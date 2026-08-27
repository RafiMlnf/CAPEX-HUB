import { useState } from "react";

interface DeptBreakdownProps {
  deptData: Record<string, { budget: number; count: number }>;
  totalBudget: number;
  proposals: any[];
}

export default function DeptBreakdown({ deptData, totalBudget, proposals }: DeptBreakdownProps) {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const deptProposals = proposals.filter(
    (p) => p.department.toLowerCase() === selectedDept?.toLowerCase()
  );

  const selectedDeptSummary = selectedDept ? deptData[selectedDept] || { budget: 0, count: 0 } : { budget: 0, count: 0 };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
      <div className="pb-2 border-b border-slate-200">
        <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Distribusi Anggaran per Departemen</h3>
        <p className="text-xs text-slate-500 mt-0.5 font-normal">Akumulasi pengajuan budget investasi (Klik departemen untuk melihat detail dokumen)</p>
      </div>

      <div className="space-y-3.5">
        {Object.keys(deptData).length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-4">Belum ada data departemen.</p>
        ) : (
          Object.entries(deptData).map(([dept, data]) => {
            const pct = totalBudget > 0 ? (data.budget / totalBudget) * 100 : 0;
            return (
              <div
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className="space-y-1.5 p-2 rounded-xl hover:bg-slate-50/80 border border-transparent hover:border-slate-150 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-800 font-semibold group-hover:text-blue-600 transition-colors">
                    {dept}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-600 font-normal">
                      Rp {data.budget.toLocaleString("id-ID")} ({data.count} proposal)
                    </span>
                    <div className="p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 transition-all shadow-3xs flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                  <div className="bg-blue-600 h-2 rounded-full transition-all group-hover:bg-blue-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Detail Dokumen per Departemen */}
      {selectedDept && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedDept(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-250 w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transform scale-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                  Detail Dokumen CAPEX — {selectedDept}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Total Anggaran: <span className="text-slate-800 font-semibold">Rp {selectedDeptSummary.budget.toLocaleString("id-ID")}</span> ({selectedDeptSummary.count} Dokumen)
                </p>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                className="p-1.5 hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Table */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider select-none">
                      <th className="py-2.5 px-3 text-center w-8">No</th>
                      <th className="py-2.5 px-3 w-28">ID Capex</th>
                      <th className="py-2.5 px-3">Nama Capex</th>
                      <th className="py-2.5 px-3 w-28">PIC</th>
                      <th className="py-2.5 px-3 w-32">Estimasi Anggaran</th>
                      <th className="py-2.5 px-3 text-center w-36">Status Gate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
                    {deptProposals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-450 italic font-normal">
                          Tidak ada dokumen untuk departemen ini.
                        </td>
                      </tr>
                    ) : (
                      deptProposals.map((item: any, idx: number) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/50 transition-colors ${idx % 2 === 1 ? "bg-slate-50/30" : "bg-white"}`}
                        >
                          <td className="py-2.5 px-3 text-center font-medium text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 text-xs">{item.id}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-70 wrap-break-word whitespace-normal leading-snug">{item.name}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-normal">{item.pic}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                            Rp {item.estimatedCost.toLocaleString("id-ID")}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border shadow-2xs ${
                              item.gateStatus === "Closed" ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : item.gateStatus.includes("Rejected") ? "bg-red-50 text-red-800 border-red-200"
                                : item.gateStatus === "Gate 0 - Idea" ? "bg-slate-50 text-slate-700 border-slate-200"
                                : "bg-blue-50 text-blue-800 border-blue-200"
                            }`}>
                              {item.gateStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedDept(null)}
                className="px-4 py-1.5 bg-white border border-slate-250 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
