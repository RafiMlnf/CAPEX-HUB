"use client";

import { useState, useEffect } from "react";
import { api, ApiCapexType } from "../../lib/api";
import GenericMasterPanel from "./GenericMasterPanel";

export default function CapexTypePanel() {
  const [items, setItems] = useState<ApiCapexType[]>([]);
  const refresh = () => api.getCapexTypes().then(setItems).catch(console.error);

  useEffect(() => {
    refresh();
  }, []);

  return (
    <GenericMasterPanel
      title="Master Capex Type"
      items={items}
      onSave={async (data, id) => {
        id ? await api.updateCapexType(id, data) : await api.createCapexType(data);
        refresh();
      }}
      onDelete={async (id) => {
        await api.deleteCapexType(id);
        refresh();
      }}
    />
  );
}
