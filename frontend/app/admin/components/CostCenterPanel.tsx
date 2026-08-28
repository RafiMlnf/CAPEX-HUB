"use client";

import { useState, useEffect } from "react";
import { api, ApiCostCenter } from "../../lib/api";
import GenericMasterPanel from "./GenericMasterPanel";

export default function CostCenterPanel() {
  const [items, setItems] = useState<ApiCostCenter[]>([]);
  const refresh = () => api.getCostCenters().then(setItems).catch(console.error);
  useEffect(() => { refresh(); }, []);
  return (
    <GenericMasterPanel
      title="Master Cost Center"
      items={items}
      onSave={async (data, id) => {
        id ? await api.updateCostCenter(id, data) : await api.createCostCenter(data);
        refresh();
      }}
      onDelete={async (id) => {
        await api.deleteCostCenter(id);
        refresh();
      }}
    />
  );
}
