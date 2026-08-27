"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import { ApiBodrProposal, ApiDeptSettings } from "../../lib/api";
import { api } from "../../lib/api";

const STEPS = [
  "Create", "Approval Dept", "Approve ACC", "Approve Dept. ACC",
  "Approve Div Plan", "Approve Div Eng", "Approve Div Admin",
  "Approve Director", "Approve Presdir"
];

const statusBadge = (s: string) => {
  if (s === "Approved") return "bg-emerald-50 text-emerald-700 border border-emerald-300";
  if (s === "Rejected") return "bg-red-50 text-red-700 border border-red-300";
  if (s === "Revision Required") return "bg-orange-50 text-orange-700 border border-orange-300";
  return "bg-blue-50 text-blue-700 border border-blue-300";
};

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function BodrProgressPage() {
  const [items, setItems] = useState<ApiBodrProposal[]>([]);
  const [deptSettings, setDeptSettings] = useState<ApiDeptSettings[]>([]);
  const [dynamicSteps, setDynamicSteps] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    Promise.all([
      api.getBodrProposals(),
      api.getDeptSettings(),
      api.getApprovalWorkflows(),
    ]).then(([proposals, depts, workflows]) => {
      setItems(proposals || []);
      setDeptSettings(depts || []);
      if (workflows && workflows.length > 0) {
        // Collect all distinct step roles/names from active workflows
        const allSteps: string[] = [];
        workflows.forEach((wf: any) => {
          if (wf.list_approval && Array.isArray(wf.list_approval)) {
            wf.list_approval.forEach((s: any) => {
              if (s.role && !allSteps.includes(s.role)) {
                allSteps.push(s.role);
              }
            });
          }
        });
        if (allSteps.length > 0) {
          setDynamicSteps(allSteps);
        } else {
          setDynamicSteps(STEPS);
        }
      } else {
        setDynamicSteps(STEPS);
      }
    }).catch(console.error);
  }, []);

  const activeSteps = dynamicSteps.length > 0 ? dynamicSteps : STEPS;

  const filtered = items.filter(b => {
    const s = search.toLowerCase();
    const matchSearch = b.title.toLowerCase().includes(s) || b.bodr_no.toLowerCase().includes(s) || b.proposer.toLowerCase().includes(s);
    const matchCat = categoryFilter === "ALL" || b.category === categoryFilter;
    const matchStat = statusFilter === "ALL" || b.status === statusFilter;
    return matchSearch && matchCat && matchStat;
  });

  const getStepIndex = (step: string) => {
    const idx = activeSteps.indexOf(step);
    return idx >= 0 ? idx : 0;
  };
  const totalSteps = activeSteps.length;

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header
          title="Progress BODR"
          subtitle="Monitoring status dan progress approval seluruh pengajuan BODR"
        />
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari judul, no BODR, pengusul..."
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-normal focus:outline-none focus:border-blue-600 w-72 shadow-2xs"
            />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer">
              <option value="ALL">Semua Kategori</option>
              <option value="CAPEX">CAPEX</option>
              <option value="FOH">FOH</option>
              <option value="GOP">GOP</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer">
              <option value="ALL">Semua Status</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Revision Required">Revision Required</option>
              <option value="Rejected">Rejected</option>
            </select>
            <span className="text-xs text-slate-500 font-medium ml-auto">{filtered.length} BODR</span>
          </div>

          {/* Progress Cards */}
          <div className="space-y-4">
            {filtered.map(bodr => {
              const currentStepIdx = getStepIndex(bodr.step);
              const progressPct = Math.round(((currentStepIdx + 1) / totalSteps) * 100);
              const headDept = deptSettings.find(ds => ds.departemen_nama === bodr.department);

              return (
                <div key={bodr.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
                  {/* Row 1: Title + Status */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-blue-600 font-semibold">{bodr.bodr_no}</span>
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${statusBadge(bodr.status)}`}>{bodr.status}</span>
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full">{bodr.category}</span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{bodr.title}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-500 font-normal">{bodr.department}</span>
                        <span className="text-xs text-slate-500 font-normal">{bodr.proposer}</span>
                        <span className="text-xs font-semibold text-slate-800">{fmt(bodr.amount)}</span>
                        {headDept && <span className="text-xs text-slate-500 font-normal">Head: {headDept.head_dept_nama}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-semibold text-blue-600">{progressPct}%</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Progress</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                      <span>Step {currentStepIdx + 1} / {totalSteps}</span>
                      <span className="text-blue-600 font-semibold">{bodr.step}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${bodr.status === 'Approved' ? 'bg-emerald-500' : bodr.status === 'Rejected' ? 'bg-red-500' : 'bg-blue-600'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Step Indicators */}
                  <div className="flex items-center gap-0 overflow-x-auto pb-1">
                    {STEPS.map((step, idx) => {
                      const isDone = idx < currentStepIdx;
                      const isCurrent = idx === currentStepIdx;
                      return (
                        <div key={step} className="flex items-center shrink-0">
                          <div className="flex flex-col items-center" title={step}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white transition-all ${
                              isDone ? 'bg-emerald-500 scale-90' : isCurrent ? 'bg-blue-600 ring-2 ring-blue-300 scale-110' : 'bg-slate-200 text-slate-400'
                            }`}>
                              {isDone ? "✓" : idx + 1}
                            </div>
                            <p className={`text-[9px] font-semibold mt-1 text-center max-w-14 leading-tight ${isCurrent ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {step.replace("Approve ", "").replace("Approval ", "")}
                            </p>
                          </div>
                          {idx < STEPS.length - 1 && (
                            <div className={`h-0.5 w-5 shrink-0 mx-0.5 ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Last Note */}
                  {bodr.last_note && (
                    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Catatan Terakhir ({bodr.last_actor})</p>
                      <p className="text-xs text-slate-600 italic font-normal">"{bodr.last_note}"</p>
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-400 font-normal">
                <p className="font-semibold text-sm">Tidak ada BODR yang sesuai filter</p>
                <p className="text-xs mt-1">Coba ubah pencarian atau filter Anda</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
