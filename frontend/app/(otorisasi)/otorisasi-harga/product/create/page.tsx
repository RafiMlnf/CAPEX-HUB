"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../../components/Header";
import { ApiBodrProposal, ApiVendor, ApiPartNumber, ApiJenisOtorisasi, api } from "../../../../lib/api";
import { useCapex } from "../../../../context/CapexContext";

const inputCls = "w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 text-sm shadow-xs";
const selectCls = "w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 text-sm shadow-xs";
const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function CreateProductPage() {
  const { currentUser } = useCapex();
  const router = useRouter();

  const [bodrList, setBodrList] = useState<ApiBodrProposal[]>([]);
  const [vendors, setVendors] = useState<ApiVendor[]>([]);
  const [parts, setParts] = useState<ApiPartNumber[]>([]);
  const [jenisOtorisasi, setJenisOtorisasi] = useState<ApiJenisOtorisasi[]>([]);

  // Form state
  const [selectedBodr, setSelectedBodr] = useState<ApiBodrProposal | null>(null);
  const [noPr, setNoPr] = useState("");
  const [selectedPart, setSelectedPart] = useState("");
  const [productName, setProductName] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedJenisOto, setSelectedJenisOto] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getBodrProposals(),
      api.getVendors(),
      api.getPartNumbers(),
      api.getJenisOtorisasi(),
    ]).then(([allBodr, vList, pList, jList]) => {
      const approved = (allBodr || []).filter(b => b.status === "Approved");
      setBodrList(approved);
      setVendors(vList || []);
      setParts(pList || []);
      setJenisOtorisasi(jList || []);
      if (jList && jList.length > 0) {
        setSelectedJenisOto(jList[0].id);
      }
      if (pList && pList.length > 0) {
        setSelectedPart(pList[0].nama_material || pList[0].id);
        setProductName(pList[0].deskripsi_material || pList[0].nama_material);
      }
      if (vList && vList.length > 0) {
        setSelectedVendor(vList[0].id);
      }
    }).catch(console.error);
  }, []);

  const handlePartChange = (partVal: string) => {
    setSelectedPart(partVal);
    const found = parts.find(p => p.nama_material === partVal || p.id === partVal);
    if (found) {
      setProductName(found.deskripsi_material || found.nama_material);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBodr) {
      setError("Pilih BODR yang terkait!");
      return;
    }
    const numPrice = Number(finalPrice.replace(/\D/g, ""));
    if (numPrice <= 0) {
      setError("Masukkan final price / harga yang valid!");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const vObj = vendors.find(v => v.id === selectedVendor);
      const jObj = jenisOtorisasi.find(j => j.id === selectedJenisOto);

      await api.createOtorisasiHarga({
        bodr_id: Number(selectedBodr.id),
        no_pr: noPr,
        product: productName || selectedPart || "Barang Product",
        part_number: selectedPart,
        vendor: vObj?.nama || "Vendor",
        jenis: "product",
        jenis_otorisasi_id: selectedJenisOto ? Number(selectedJenisOto) : undefined,
        dana_bodr: Number(selectedBodr.amount),
        final_price: numPrice,
        buyer_id: currentUser?.id || "",
        buyer: currentUser?.name || "",
        tanggal,
        status: "Pending Review",
        step: "SH PURH",
      });

      router.push("/otorisasi-harga/product");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal membuat otorisasi harga product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header title="Buat Otorisasi Harga Product" subtitle="Pengajuan otorisasi harga barang produk terhubung ke database backend" />
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3.5 rounded-xl font-semibold">
                {error}
              </div>
            )}

            {/* Informasi Dokumen */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-semibold text-slate-800 uppercase tracking-wide text-sm border-b border-slate-100 pb-3">
                Informasi Dokumen & BODR Terkait
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">BODR Terkait *</label>
                  <select
                    className={selectCls}
                    value={selectedBodr?.id || ""}
                    onChange={e => {
                      const b = bodrList.find(x => x.id === e.target.value);
                      setSelectedBodr(b || null);
                    }}
                    required
                  >
                    <option value="">Pilih BODR yang telah diapprove...</option>
                    {bodrList.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bodr_no} — {b.title} ({fmt(b.amount)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">No. PR *</label>
                  <input
                    className={inputCls}
                    value={noPr}
                    onChange={e => setNoPr(e.target.value)}
                    placeholder="PR-2026-XXXX"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Tanggal Pengajuan *</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Jenis Source *</label>
                  <select
                    className={selectCls}
                    value={selectedJenisOto}
                    onChange={e => setSelectedJenisOto(e.target.value)}
                    required
                  >
                    {jenisOtorisasi.map(j => (
                      <option key={j.id} value={j.id}>{j.nama || j.kode}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Informasi Produk & Harga */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-semibold text-slate-800 uppercase tracking-wide text-sm border-b border-slate-100 pb-3">
                Detail Part Number & Harga Supplier
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Part Number *</label>
                  {parts.length > 0 ? (
                    <select
                      className={selectCls}
                      value={selectedPart}
                      onChange={e => handlePartChange(e.target.value)}
                      required
                    >
                      {parts.map(p => (
                        <option key={p.id} value={p.nama_material}>
                          {p.nama_material} {p.deskripsi_material ? `— ${p.deskripsi_material}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={inputCls}
                      value={selectedPart}
                      onChange={e => setSelectedPart(e.target.value)}
                      placeholder="Masukkan part number..."
                      required
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Nama Produk / Material *</label>
                  <input
                    className={inputCls}
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder="Deskripsi / nama produk..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Vendor / Supplier *</label>
                  <select
                    className={selectCls}
                    value={selectedVendor}
                    onChange={e => setSelectedVendor(e.target.value)}
                    required
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.nama || v.kode}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Final Price (Rp) *</label>
                  <input
                    className={inputCls}
                    value={finalPrice}
                    onChange={e => {
                      const num = e.target.value.replace(/\D/g, "");
                      setFinalPrice(num ? Number(num).toLocaleString("id-ID") : "");
                    }}
                    placeholder="Nominal harga yang disetujui..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 text-sm cursor-pointer shadow-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-xs flex items-center gap-2"
              >
                {submitting ? "Menyimpan ke Database..." : "Simpan & Ajukan Otorisasi"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
