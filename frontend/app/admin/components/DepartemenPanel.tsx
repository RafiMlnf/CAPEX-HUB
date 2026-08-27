"use client";

import { useState, useEffect } from "react";
import { api, ApiDepartemen } from "../../lib/api";
import GenericMasterPanel from "./GenericMasterPanel";

export default function DepartemenPanel() {
  const [items, setItems] = useState<ApiDepartemen[]>([]);
  const refresh = () => api.getDepartemens().then(setItems).catch(console.error);
  useEffect(() => { refresh(); }, []);
  return (
    <GenericMasterPanel
      title="Master Departemen"
      items={items}
      onSave={async (data, id) => {
        id ? await api.updateDepartemen(id, data) : await api.createDepartemen(data);
        refresh();
      }}
      onDelete={async (id) => {
        await api.deleteDepartemen(id);
        refresh();
      }}
    />
  );
}
