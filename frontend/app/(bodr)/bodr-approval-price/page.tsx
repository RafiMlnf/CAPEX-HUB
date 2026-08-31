"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import { User, ApiOtorisasiHargaNonProduct, ApiOtorisasiHarga, api, getCurrentUser } from "../../lib/api";
import PriceApprovalTable from "./components/PriceApprovalTable";
import PriceApprovalActionModal from "./components/PriceApprovalActionModal";

export default function BodrApprovalPricePage() {
  const [activeTab, setActiveTab] = useState<"non-product" | "product">("non-product");
  const [nonProductList, setNonProductList] = useState<ApiOtorisasiHargaNonProduct[]>([]);
  const [productList, setProductList] = useState<ApiOtorisasiHarga[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedActionItem, setSelectedActionItem] = useState<{ item: any; type: "non-product" | "product" } | null>(null);

  const refreshData = () => {
    setLoading(true);
    Promise.all([
      api.getOtorisasiHargaNPList(),
      api.getOtorisasiHargaList(),
      api.getApprovalPriceWorkflows(),
    ])
      .then(([npList, pList, wfList]) => {
        setNonProductList(npList || []);
        setProductList(pList || []);

        if (wfList && wfList.length > 0) {
          const steps: string[] = [];
          wfList.forEach((wf: any) => {
            if (wf.list_approval && Array.isArray(wf.list_approval)) {
              wf.list_approval.forEach((s: any) => {
                if (s.role && !steps.includes(s.role)) steps.push(s.role);
              });
            }
          });
          if (steps.length > 0) setWorkflowSteps(steps);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshData();
    const user = getCurrentUser();
    if (user) setCurrentUser(user);
  }, []);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen ml-64 overflow-hidden">
        <Header
          title="Approval Otorisasi Harga"
          subtitle="Pusat persetujuan bertingkat otorisasi harga produk & non-produk"
        />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Tab Selector & Controls */}
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("non-product")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "non-product"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Non-Product ({nonProductList.filter((i) => i.status === "Pending Review").length})
              </button>
              <button
                onClick={() => setActiveTab("product")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "product"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Product ({productList.filter((i) => i.status === "Pending Review").length})
              </button>
            </div>

            <button
              onClick={refreshData}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs"
            >
              Refresh
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-bold">
              Memuat antrian otorisasi harga...
            </div>
          ) : (
            <PriceApprovalTable
              activeTab={activeTab}
              nonProductList={nonProductList}
              productList={productList}
              onOpenAction={(item, type) => setSelectedActionItem({ item, type })}
            />
          )}
        </main>
      </div>

      {/* Action Modal */}
      {selectedActionItem && (
        <PriceApprovalActionModal
          item={selectedActionItem.item}
          type={selectedActionItem.type}
          currentUser={currentUser}
          workflowSteps={workflowSteps}
          onClose={() => setSelectedActionItem(null)}
          onSuccess={() => {
            setSelectedActionItem(null);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
