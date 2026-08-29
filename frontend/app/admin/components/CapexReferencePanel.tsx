"use client";

import { useState, useEffect } from "react";
import { api, ApiCapexReference } from "../../lib/api";
import GenericMasterPanel from "./GenericMasterPanel";

export default function CapexReferencePanel() {
  const [items, setItems] = useState<ApiCapexReference[]>([]);
  const refresh = () => api.getCapexReferences().then(setItems).catch(console.error);

  useEffect(() => {
    refresh();
  }, []);

  return (
    <GenericMasterPanel
      title="Master Capex Reference"
      items={items}
      onSave={async (data, id) => {
        id ? await api.updateCapexReference(id, data) : await api.createCapexReference(data);
        refresh();
      }}
      onDelete={async (id) => {
        await api.deleteCapexReference(id);
        refresh();
      }}
    />
  );
}
