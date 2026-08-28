"use client";

import React from "react";
import { ApiOtorisasiHargaNonProduct, ApiOtorisasiHarga } from "@/app/lib/api";

interface PriceApprovalTableProps {
  activeTab: "non-product" | "product";
  nonProductList: ApiOtorisasiHargaNonProduct[];
  productList: ApiOtorisasiHarga[];
  onOpenAction: (item: any, type: "non-product" | "product") => void;
}

const statusBadge = (s: string) => {
  if (s === "Approved") return "bg-emerald-50 text-emerald-700 border border-emerald-300";
  if (s === "Rejected") return "bg-red-50 text-red-700 border border-red-300";
  return "bg-blue-50 text-blue-700 border border-blue-300";
};

export default function PriceApprovalTable({
  activeTab,
  nonProductList,
  productList,
  onOpenAction,
}: PriceApprovalTableProps) {
  if (activeTab === "non-product") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 text-[10px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 text-center border-r border-slate-200">No</th>
                <th className="py-3 px-3 border-r border-slate-200">No Doc</th>
                <th className="py-3 px-3 border-r border-slate-200">No. PR</th>
                <th className="py-3 px-3 border-r border-slate-200">No. BODR</th>
                <th className="py-3 px-3 border-r border-slate-200">Buyer</th>
                <th className="py-3 px-3 border-r border-slate-200">Create Date</th>
                <th className="py-3 px-3 text-center border-r border-slate-200">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {nonProductList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 italic font-normal">
                    Tidak ada antrian persetujuan otorisasi harga non-produk.
                  </td>
                </tr>
              ) : (
                nonProductList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800 border-r border-slate-200">{item.no_doc || item.id}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-blue-600 border-r border-slate-200">{item.no_pr || "—"}</td>
                    <td className="py-3 px-3 font-mono text-slate-700 border-r border-slate-200">{item.no_bodr || "—"}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800 border-r border-slate-200">{item.buyer_nama || "—"}</td>
                    <td className="py-3 px-3 text-slate-500 border-r border-slate-200 font-normal">{item.tanggal || item.created_at?.slice(0, 10)}</td>
                    <td className="py-3 px-3 text-center border-r border-slate-200">
                      <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${statusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onOpenAction(item, "non-product")}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold uppercase transition-all shadow-2xs active:scale-95 cursor-pointer"
                      >
                        {item.status === "Approved" ? "View Details" : "Approval"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 text-[9px] font-semibold uppercase tracking-wider">
              <th className="py-3 px-3 text-center border-r border-slate-200">No</th>
              <th className="py-3 px-3 border-r border-slate-200">No. PR</th>
              <th className="py-3 px-3 border-r border-slate-200">Produk</th>
              <th className="py-3 px-3 border-r border-slate-200">Vendor</th>
              <th className="py-3 px-3 border-r border-slate-200">Customer</th>
              <th className="py-3 px-3 border-r border-slate-200">Harga Final</th>
              <th className="py-3 px-3 text-center border-r border-slate-200">Tahap</th>
              <th className="py-3 px-3 text-center border-r border-slate-200">Status</th>
              <th className="py-3 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {productList.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 italic font-normal">
                  Tidak ada antrian persetujuan otorisasi harga produk.
                </td>
              </tr>
            ) : (
              productList.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-center font-mono font-semibold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-blue-600 border-r border-slate-200">{item.no_pr || item.id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800 border-r border-slate-200">{item.product}</td>
                  <td className="py-3 px-3 text-slate-600 border-r border-slate-200 font-normal">{item.vendor || "-"}</td>
                  <td className="py-3 px-3 text-slate-600 border-r border-slate-200 font-normal">{item.customer || "-"}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800 border-r border-slate-200">
                    Rp {Number(item.final_price || item.normal_price || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-700 border-r border-slate-200 text-[11px]">{item.step}</td>
                  <td className="py-3 px-3 text-center border-r border-slate-200">
                    <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border ${statusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onOpenAction(item, "product")}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold uppercase transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
