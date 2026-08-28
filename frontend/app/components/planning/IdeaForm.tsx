"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import InfoTooltip from "../InfoTooltip";
import { CapexProposal, api } from "../../lib/api";
import { useCapex } from "../../context/CapexContext";

interface IdeaFormProps {
  initialData?: CapexProposal | null;
  isModal?: boolean;
  onSubmit: (proposal: {
    id?: string;
    name: string;
    description: string;
    department: string;
    pic: string;
    estimatedCost: number;
    purpose: string;
    investmentType: string;
    startDate: string;
    endDate: string;
    attachmentName: string;
    initialAttachmentName?: string;
    revisedAttachmentName?: string;
    isDraft?: boolean;
  }) => void;
  onCancel?: () => void;
}

export default function IdeaForm({ onSubmit, initialData, onCancel, isModal = false }: IdeaFormProps) {
  const { currentUser } = useCapex();

  const investmentTypesMap: Record<string, string[]> = {
    Capacity: ["Capacity Up"],
    Capability: [
      "Improve Product Quality",
      "Cost Reduction",
      "Safety",
      "Environment",
      "Restore Capacity",
      "Increase Value Added",
    ],
    Supporting: ["Supporting"],
  };

  const isRevisionMode = Boolean(
    initialData &&
      (initialData.revisionSource ||
        initialData.revisedAttachmentName ||
        initialData.gateStatus?.toLowerCase().includes("revis"))
  );

  const initialDocs = initialData
    ? (initialData.initialAttachmentName || (isRevisionMode ? initialData.attachmentName : ""))
        ?.split(", ")
        .map((s) => s.trim())
        .filter(Boolean) || []
    : [];

  const [purpose, setPurpose] = useState(initialData?.purpose || "");
  const [investmentType, setInvestmentType] = useState(initialData?.investmentType || "");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [department, setDepartment] = useState(initialData?.department || currentUser?.department || "Engineering");
  const [pic, setPic] = useState(initialData?.pic || currentUser?.name || currentUser?.username || "");
  const [estimatedCost, setEstimatedCost] = useState(initialData?.estimatedCost ? initialData.estimatedCost.toLocaleString("id-ID") : "");
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [endDate, setEndDate] = useState(initialData?.endDate || "");
  const [attachmentNames, setAttachmentNames] = useState<string[]>(
    initialData?.revisedAttachmentName
      ? initialData.revisedAttachmentName.split(", ").filter(Boolean)
      : isRevisionMode
      ? []
      : initialData?.attachmentName
      ? initialData.attachmentName.split(", ").filter(Boolean)
      : []
  );
  const [uploadingFile, setUploadingFile] = useState(false);

  const handlePurposeChange = (val: string) => {
    setPurpose(val);
    if (val === "Supporting") {
      setInvestmentType("Supporting");
    } else {
      setInvestmentType("");
    }
  };

  const formatNumber = (val: string) => {
    const numericOnly = val.replace(/\D/g, "");
    if (!numericOnly) return "";
    return Number(numericOnly).toLocaleString("id-ID");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (attachmentNames.length + files.length > 20) {
        Swal.fire({
          title: "Batas Maksimum Dokumen",
          text: "Maksimal dokumen pendukung yang dapat diunggah adalah 20 file.",
          icon: "warning",
          confirmButtonColor: "#2563eb",
        });
        return;
      }
      setUploadingFile(true);
      try {
        const fileArr = Array.from(files);
        const uploadResults = await api.uploadMultipleDocuments(fileArr);
        const uploadedNames: string[] = uploadResults.map(
          (r: any) => (typeof r === "string" ? r : r.file_name || r.original_name || r.name || "dokumen")
        );
        setAttachmentNames((prev) => {
          const combined = Array.from(new Set([...prev, ...uploadedNames]));
          return combined.slice(0, 20);
        });
      } catch (err) {
        console.error("Upload error in IdeaForm:", err);
      } finally {
        setUploadingFile(false);
      }
    }
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();

    if (!isDraft) {
      if (!name || !purpose || !investmentType || !description || !estimatedCost || !startDate || !endDate) {
        Swal.fire({
          title: "Form Belum Lengkap",
          text: "Silakan lengkapi seluruh field wajib sebelum mengirim pengajuan.",
          icon: "warning",
          confirmButtonColor: "#2563eb",
        });
        return;
      }
    }

    const draftName = name.trim() || (purpose ? `Draft Usulan ${purpose}` : "Draft Usulan Capex Baru");
    const numericCost = Number(estimatedCost.replace(/\./g, "")) || 0;

    const finalAttachmentName =
      attachmentNames.length > 0
        ? attachmentNames.join(", ")
        : (initialData?.attachmentName || "");
    const finalInitialAttachmentName =
      initialData?.initialAttachmentName || (isRevisionMode ? initialData?.attachmentName : finalAttachmentName);
    const finalRevisedAttachmentName =
      isRevisionMode && attachmentNames.length > 0 ? attachmentNames.join(", ") : initialData?.revisedAttachmentName;

    onSubmit({
      id: initialData?.id,
      name: isDraft ? draftName : name,
      description: description || (isDraft ? "-" : name),
      department: department || currentUser?.department || "Engineering",
      pic: pic || currentUser?.name || currentUser?.username || "Budi Santoso",
      estimatedCost: numericCost,
      purpose: purpose || (isDraft ? "" : "Capacity"),
      investmentType: investmentType || (isDraft ? "" : (purpose === "Supporting" ? "Supporting" : "Capacity Up")),
      startDate: startDate || "",
      endDate: endDate || "",
      attachmentName: finalAttachmentName,
      initialAttachmentName: finalInitialAttachmentName,
      revisedAttachmentName: finalRevisedAttachmentName,
      isDraft,
    });

    // Reset form fields
    setPurpose("");
    setInvestmentType("");
    setName("");
    setDescription("");
    setPic(currentUser?.name || currentUser?.username || "Budi Santoso");
    setDepartment(currentUser?.department || "Engineering");
    setEstimatedCost("");
    setStartDate("");
    setEndDate("");
    setAttachmentNames([]);
    
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const formContent = (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4 text-xs font-normal">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* PIC Pengaju & Departemen (Auto-filled at the top, Non-mandatory label) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                PIC Pengaju
              </label>
              <input
                type="text"
                readOnly
                value={pic}
                className="w-full bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-2.5 cursor-not-allowed select-none outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Departemen
              </label>
              <input
                type="text"
                readOnly
                value={department}
                className="w-full bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-2.5 cursor-not-allowed select-none outline-none"
              />
            </div>
          </div>

          {/* Purpose & Investment Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Purpose <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={purpose}
                onChange={(e) => handlePurposeChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
              >
                <option value="" disabled>Pilih Purpose</option>
                <option value="Capacity">Capacity</option>
                <option value="Capability">Capability</option>
                <option value="Supporting">Supporting</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Investment Type <span className="text-red-500">*</span>
              </label>
              {purpose === "Supporting" ? (
                <input
                  type="text"
                  readOnly
                  value="Supporting"
                  className="w-full bg-slate-100/80 border border-slate-200 text-slate-600 text-xs font-medium rounded-xl px-3 py-2.5 cursor-not-allowed outline-none select-none"
                />
              ) : (
                <select
                  required
                  disabled={!purpose}
                  value={investmentType}
                  onChange={(e) => setInvestmentType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>{purpose ? "Pilih Investment Type" : "Pilih Purpose Terlebih Dahulu"}</option>
                  {purpose && investmentTypesMap[purpose]?.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Project Name & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="Contoh: Pembelian Server Core Database..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Amount (Rp) <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-semibold text-slate-400 text-xs select-none pointer-events-none">
                  Rp
                </span>
                <input
                  required
                  type="text"
                  placeholder="0"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(formatNumber(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors font-medium"
                />
              </div>
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Benefit */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Benefit <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder={"Jelaskan manfaat dan keuntungan investasi ini...\nContoh:\n1. Meningkatkan kapasitas produksi sebesar 20%\n2. Mengurangi biaya maintenance mesin tahunan"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.currentTarget;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const val = target.value;
                  const lastLineStart = val.lastIndexOf("\n", start - 1) + 1;
                  const currentLine = val.substring(lastLineStart, start);

                  const numberMatch = currentLine.match(/^(\s*)(\d+)(\.|\))\s+(.*)$/);
                  const emptyNumberMatch = currentLine.match(/^(\s*)(\d+)(\.|\))\s*$/);
                  const bulletMatch = currentLine.match(/^(\s*)([-*•])\s+(.*)$/);
                  const emptyBulletMatch = currentLine.match(/^(\s*)([-*•])\s*$/);

                  if (emptyNumberMatch || emptyBulletMatch) {
                    e.preventDefault();
                    const nextVal = val.substring(0, lastLineStart) + val.substring(end);
                    setDescription(nextVal);
                    setTimeout(() => {
                      target.selectionStart = target.selectionEnd = lastLineStart;
                    }, 0);
                    return;
                  }

                  if (numberMatch) {
                    e.preventDefault();
                    const indent = numberMatch[1];
                    const nextNum = parseInt(numberMatch[2], 10) + 1;
                    const delimiter = numberMatch[3];
                    const insertion = `\n${indent}${nextNum}${delimiter} `;
                    const nextVal = val.substring(0, start) + insertion + val.substring(end);
                    setDescription(nextVal);
                    setTimeout(() => {
                      target.selectionStart = target.selectionEnd = start + insertion.length;
                    }, 0);
                    return;
                  }

                  if (bulletMatch) {
                    e.preventDefault();
                    const indent = bulletMatch[1];
                    const bulletChar = bulletMatch[2];
                    const insertion = `\n${indent}${bulletChar} `;
                    const nextVal = val.substring(0, start) + insertion + val.substring(end);
                    setDescription(nextVal);
                    setTimeout(() => {
                      target.selectionStart = target.selectionEnd = start + insertion.length;
                    }, 0);
                    return;
                  }
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors leading-relaxed font-normal whitespace-pre-wrap"
            />
          </div>
        </div>

        {/* Right Column: Attachment Document (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
          
          {/* Dokumen Awal (Snapshot Versi Pengajuan Sebelum Revisi) - Readonly for Audit */}
          {isRevisionMode && initialDocs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-700 tracking-wider flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Dokumen Awal (Audit Archive)
                </span>
              </div>
              <p className="text-[10px] text-slate-500 italic leading-snug">
                Snapshot berkas saat pengajuan awal untuk riwayat audit.
              </p>
              <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                {initialDocs.map((docName, i) => {
                  const isExcel = /\.(xlsx?|csv)$/i.test(docName);
                  const isPdf = /\.pdf$/i.test(docName);
                  const fileUrl = api.getUploadFileUrl(docName);

                  return (
                    <a
                      key={i}
                      href={fileUrl}
                      download={isExcel ? docName : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] text-slate-700 hover:text-blue-700 transition-all group"
                      title={isExcel ? `Klik untuk otomatis download Excel: ${docName}` : isPdf ? `Klik untuk preview PDF: ${docName}` : `Klik untuk unduh/buka: ${docName}`}
                    >
                      <span className="truncate max-w-44 underline font-normal">{docName}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-slate-200/80 text-slate-600">
                          {isExcel ? "Excel" : isPdf ? "PDF" : "Doc"}
                        </span>
                        <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          {isExcel ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          )}
                        </svg>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {isRevisionMode ? "Dokumen Revisi Terbaru" : "Attachment Document"}
            </label>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              {attachmentNames.length}/20 File {isRevisionMode ? "Revisi" : ""}
            </span>
          </div>

          {/* Upload Dropzone */}
          {attachmentNames.length < 20 ? (
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-blue-50/40 hover:border-blue-400 transition-all">
                <div className="flex flex-col items-center justify-center py-3 px-2 text-center">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                    {uploadingFile ? (
                      <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg
                        className="w-3.5 h-3.5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="mb-0.5 text-xs text-slate-600">
                    <span className="font-semibold text-blue-600">{uploadingFile ? "Mengunggah..." : isRevisionMode ? "Upload Berkas Revisi" : "Klik upload"}</span> atau drag & drop
                  </p>
                  <p className="text-[10px] text-slate-400">PDF, Excel, Word, PPT, JPG/PNG (s/d 10MB)</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.ppt,.pptx,.png"
                  multiple
                  disabled={uploadingFile}
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Batas maksimum 20 file revisi telah tercapai.
            </div>
          )}

          {/* File Cards List */}
          {attachmentNames.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {attachmentNames.map((name, index) => {
                const isExcel = /\.(xlsx?|csv)$/i.test(name);
                const isPdf = /\.pdf$/i.test(name);
                const fileUrl = api.getUploadFileUrl(name);

                return (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isExcel ? "bg-emerald-50 border-emerald-200 text-emerald-600" : isPdf ? "bg-red-50 border-red-200 text-red-600" : "bg-blue-50 border-blue-200 text-blue-600"
                      }`}>
                        {isExcel ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        ) : isPdf ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <a
                          href={fileUrl}
                          download={isExcel ? name : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-slate-700 hover:text-blue-600 hover:underline truncate max-w-44 transition-colors cursor-pointer"
                          title={isExcel ? `Klik untuk otomatis download Excel: ${name}` : isPdf ? `Klik untuk preview PDF: ${name}` : `Klik untuk unduh/buka: ${name}`}
                        >
                          {name}
                        </a>
                        <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-1">
                          <span>✓ {isRevisionMode ? "Berkas Revisi" : "Terlampir"}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 font-mono text-[8px] uppercase">{isExcel ? "Download Excel" : isPdf ? "Preview PDF" : "File"}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={fileUrl}
                        download={isExcel ? name : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        title={isExcel ? "Download Excel" : isPdf ? "Preview PDF" : "Buka Dokumen"}
                      >
                        {isExcel ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentNames((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Hapus berkas"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs italic">
              {isRevisionMode ? "Belum ada berkas revisi baru yang diunggah." : "Belum ada dokumen yang diunggah."}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        {initialData && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-2xs text-center"
          >
            Batal
          </button>
        )}

        {/* Simpan Sebagai Draft Button */}
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-400 font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-2xs active:scale-98"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          <span>Simpan sebagai Draft</span>
        </button>

        {/* Kirim Pengajuan Button */}
        <button
          type="button"
          onClick={(e) => handleSubmit(e, false)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span>{initialData ? "Update & Kirim Ulang" : "Kirim Pengajuan Budget Planning"}</span>
        </button>
      </div>
    </form>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-fit shadow-2xs">
      <div className="pb-2 border-b border-slate-200 flex items-center gap-3">
        <div className="bg-blue-600 text-white font-semibold text-sm w-7 h-7 flex items-center justify-center rounded-lg shrink-0">
          +
        </div>
        <div>
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center">
            Pengajuan Budget Planning
            <InfoTooltip content="Lengkapi informasi di bawah untuk mengajukan rencana anggaran investasi baru." />
          </h2>
        </div>
      </div>
      {formContent}
    </div>
  );
}
