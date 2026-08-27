"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Sidebar from "../../components/sidebars/SidebarFS";
import Header from "../../components/Header";
import { useCapex } from "../../context/CapexContext";
import { useSearchParams } from "next/navigation";
import Modal from "../../components/shared/Modal";
import Swal from "sweetalert2";
import { api, CapexProposal } from "../../lib/api";

export default function PlanningPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-semibold text-slate-500">Memuat Halaman Perencanaan CAPEX...</div>}>
      <PlanningPageContent />
    </Suspense>
  );
}

function PlanningPageContent() {
  const { proposals, hasPermission, createProposal, loadingProposals, currentUser } = useCapex();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Form states
  const [purpose, setPurpose] = useState("Capacity");
  const [investmentType, setInvestmentType] = useState("Capacity Up");
  const [projectName, setProjectName] = useState("");
  const [pic, setPic] = useState(currentUser?.name || "");
  const [benefit, setBenefit] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [department, setDepartment] = useState(currentUser?.department || "PE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab & Table states
  const [activeTab, setActiveTab] = useState<"list" | "status">("status");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingProposal, setViewingProposal] = useState<CapexProposal | null>(null);

  const canCreate = hasPermission("perm_create_capex");

  // Auto-fill PIC and Department if currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (!pic) setPic(currentUser.name || "");
      if (!department) setDepartment(currentUser.department || "PE");
    }
  }, [currentUser, pic, department]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const results = await api.uploadMultipleDocuments(Array.from(files));
      const names = results.map((r) => r.file_name || r.original_name);
      setAttachedFiles((prev) => Array.from(new Set([...prev, ...names])));
    } catch (err: any) {
      Swal.fire({
        title: "Gagal Mengunggah",
        text: err.message || "Gagal mengunggah file lampiran.",
        icon: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      Swal.fire({ title: "Nama Proyek Wajib Diisi", icon: "warning" });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      Swal.fire({ title: "Nominal Amount Wajib Diisi", icon: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      await createProposal({
        name: projectName.trim(),
        description: benefit.trim() || "-",
        department: department || "PE",
        pic: pic.trim() || "-",
        estimatedCost: Number(amount),
        purpose,
        investmentType,
        startDate: startDate || new Date().toISOString().slice(0, 10),
        endDate: endDate || new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
        attachmentName: attachedFiles.join(", "),
        gateStatus: "Gate 1 - Finance Review",
      });

      Swal.fire({
        title: "Pengajuan Terkirim!",
        text: "Pengajuan Budget Planning berhasil dikirim ke Finance Review.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      // Reset form
      setProjectName("");
      setBenefit("");
      setAmount("");
      setStartDate("");
      setEndDate("");
      setAttachedFiles([]);
    } catch (err: any) {
      Swal.fire({
        title: "Gagal Mengirim",
        text: err.message || "Terjadi kesalahan saat membuat pengajuan.",
        icon: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const planningProposals = useMemo(() => {
    return proposals.filter((p) => {
      if (activeTab === "status") {
        return p.gateStatus === "Gate 1 - Finance Review" || p.gateStatus === "Gate 2 - Committee Review" || p.gateStatus.includes("Gate");
      }
      return true;
    });
  }, [proposals, activeTab]);

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen ml-64 bg-slate-100 min-w-0 overflow-x-hidden">
        <Header
          title="Perencanaan Capex"
          subtitle="Formulir pengajuan usulan anggaran modal investasi dan pemantauan status persetujuan aktif"
        />

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5 w-full min-w-0">
          
          {/* Top Card: PENGAJUAN BUDGET PLANNING */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs w-full space-y-5">
            {/* Header */}
            <div className="flex items-center gap-2.5 pb-2">
              <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                +
              </span>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                PENGAJUAN BUDGET PLANNING
                <span className="text-slate-400 cursor-help" title="Formulir pengajuan investasi">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </h2>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Purpose & Investment Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    PURPOSE <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                  >
                    <option value="Capacity">Capacity</option>
                    <option value="Cost Reduction">Cost Reduction</option>
                    <option value="Quality">Quality</option>
                    <option value="Safety / Environment">Safety / Environment</option>
                    <option value="Replacement / Overhaul">Replacement / Overhaul</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    INVESTMENT TYPE <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={investmentType}
                    onChange={(e) => setInvestmentType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                  >
                    <option value="Capacity Up">Capacity Up</option>
                    <option value="Line Expansion">Line Expansion</option>
                    <option value="New Model">New Model</option>
                    <option value="Machine Renewal">Machine Renewal</option>
                    <option value="Automation">Automation</option>
                    <option value="Cost Down">Cost Down</option>
                    <option value="Safety / 5S">Safety / 5S</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Project Name & PIC Pengaju */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    PROJECT NAME <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pembelian Server Core Database..."
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      PIC PENGAJU <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[9px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      Sesuai Akun Login
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    required
                    value={currentUser?.name || currentUser?.username || pic || "User"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none shadow-2xs font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Row 3: Benefit */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  BENEFIT <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jelaskan manfaat dan keuntungan investasi ini..."
                  value={benefit}
                  onChange={(e) => setBenefit(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs resize-none font-normal"
                />
              </div>

              {/* Row 4: Amount & Departemen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    AMOUNT (RP) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-slate-400 select-none pointer-events-none">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="0"
                      value={amount === "" ? "" : Number(amount).toLocaleString("id-ID")}
                      onChange={(e) => {
                        const cleanDigits = e.target.value.replace(/\D/g, "");
                        setAmount(cleanDigits === "" ? "" : Number(cleanDigits));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    DEPARTEMEN <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                  >
                    <option value="PE">PE</option>
                    <option value="Production">Production</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Quality">Quality</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Finance">Finance</option>
                    <option value="HRGA">HRGA</option>
                    <option value="Purchasing">Purchasing</option>
                    <option value="Logistics">Logistics</option>
                    <option value="IT">IT</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Start Date & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    START DATE <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    END DATE <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                  />
                </div>
              </div>

              {/* Row 6: Attachment Document Dropzone */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  ATTACHMENT DOCUMENT
                </label>
                <label className="flex flex-col items-center justify-center w-full py-6 px-4 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 transition-all text-center">
                  <svg className="w-6 h-6 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-[11px] font-semibold text-slate-700">
                    {isUploading ? "Mengunggah file..." : "Click to upload or drag and drop"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Proposal Business Case (PDF, Excel, Word, JPG/PNG, PPT up to 10MB)
                  </span>
                  <input
                    type="file"
                    multiple
                    disabled={isUploading}
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </label>

                {/* File list tags */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachedFiles.map((fn, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {fn}
                        <button
                          type="button"
                          onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-blue-400 hover:text-red-600 font-bold ml-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs tracking-wider transition-all shadow-xs cursor-pointer active:scale-99 disabled:opacity-50"
              >
                {isSubmitting ? "Mengirim Pengajuan..." : "Kirim Pengajuan Budget Planning"}
              </button>
            </form>
          </div>

          {/* Bottom Card: STATUS PERENCANAAN AKTIF */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs w-full space-y-4">
            {/* Header with Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                STATUS PERENCANAAN AKTIF
                <span className="text-slate-400 cursor-help" title="Status pengajuan">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </h2>

              {/* Toggle Buttons */}
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === "list"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  List Pengajuan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("status")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === "status"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Status
                </button>
              </div>
            </div>

            {/* Table */}
            {planningProposals.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic text-xs font-normal">
                Belum ada proposal yang lolos perencanaan.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider select-none">
                      <th className="py-3 px-3.5 text-center w-12">NO</th>
                      <th className="py-3 px-3.5">PROPOSAL ID</th>
                      <th className="py-3 px-3.5">DEPARTMENT</th>
                      <th className="py-3 px-3.5">PROJECT NAME</th>
                      <th className="py-3 px-3.5">PURPOSE / TYPE</th>
                      <th className="py-3 px-3.5">PIC</th>
                      <th className="py-3 px-3.5 text-right">AMOUNT</th>
                      <th className="py-3 px-3.5 text-center">DURATION</th>
                      <th className="py-3 px-3.5 text-center">ATTACHMENT</th>
                      <th className="py-3 px-3.5 text-center">STATUS GATE</th>
                      <th className="py-3 px-3.5 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {planningProposals.map((p, idx) => {
                      const firstDoc = (p.attachmentName || "").split(", ")[0]?.trim();
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3.5 font-mono text-slate-800 text-[11px]">
                            {p.capexId && p.capexId !== "-" ? p.capexId : p.id}
                          </td>
                          <td className="py-3 px-3.5 text-slate-700">{p.department}</td>
                          <td className="py-3 px-3.5 text-slate-800 font-medium">{p.name}</td>
                          <td className="py-3 px-3.5 text-slate-600">
                            <div>{p.purpose || "-"}</div>
                            <div className="text-[10px] text-slate-400">{p.investmentType || "-"}</div>
                          </td>
                          <td className="py-3 px-3.5 text-slate-600">{p.pic}</td>
                          <td className="py-3 px-3.5 font-bold text-blue-600 text-right">
                            Rp {p.estimatedCost.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-3.5 text-center text-[10px] font-mono">
                            {p.startDate && p.endDate && p.startDate !== "-" && p.endDate !== "-" ? (
                              <div className="space-y-0.5">
                                <span className="text-slate-600 block">{p.startDate} s/d {p.endDate}</span>
                                {(() => {
                                  const s = new Date(p.startDate).getTime();
                                  const e = new Date(p.endDate).getTime();
                                  if (!isNaN(s) && !isNaN(e) && e >= s) {
                                    const days = Math.round((e - s) / (1000 * 60 * 60 * 24));
                                    return (
                                      <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        ⏱️ {days} Hari
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            ) : (
                              <span className="text-slate-500">{p.startDate || "-"}</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {firstDoc ? (
                              <a
                                href={api.getUploadFileUrl(firstDoc)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-medium hover:bg-blue-100 transition-colors"
                              >
                                <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                {firstDoc}
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              • {p.gateStatus.replace("Gate 1 - ", "").replace("Gate 2 - ", "")}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => setViewingProposal(p)}
                              className="text-slate-400 hover:text-blue-600 p-1 transition-colors cursor-pointer"
                              title="Lihat Detail"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* View Detail Modal */}
        {viewingProposal && (
          <Modal
            open={!!viewingProposal}
            onClose={() => setViewingProposal(null)}
            title={`Detail Usulan: ${viewingProposal.capexId || viewingProposal.id}`}
          >
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID CAPEX</span>
                    <p className="font-mono font-bold text-slate-800">{viewingProposal.capexId || viewingProposal.id}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">STATUS</span>
                    <p className="font-bold text-blue-600">{viewingProposal.gateStatus}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NAMA PROYEK</span>
                    <p className="font-bold text-slate-800">{viewingProposal.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DEPARTEMEN</span>
                    <p className="text-slate-700">{viewingProposal.department}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ESTIMASI COST</span>
                    <p className="font-bold text-blue-600">Rp {viewingProposal.estimatedCost.toLocaleString("id-ID")}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PIC PENGAJU</span>
                    <p className="text-slate-700">{viewingProposal.pic}</p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">BENEFIT / DESKRIPSI</span>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 leading-relaxed font-normal">
                  {viewingProposal.description || "-"}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewingProposal(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
