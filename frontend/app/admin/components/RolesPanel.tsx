"use client";

import { useState, useEffect } from "react";
import { api, ApiRole } from "../../lib/api";
import GenericMasterPanel from "./GenericMasterPanel";

export default function RolesPanel() {
  const [items, setItems] = useState<ApiRole[]>([]);
  const refresh = () => api.getRoles().then(setItems).catch(console.error);
  useEffect(() => { refresh(); }, []);
  return (
    <GenericMasterPanel
      title="Master Roles"
      items={items}
      onSave={async (data, id) => {
        id ? await api.updateRole(id, data) : await api.createRole(data);
        refresh();
      }}
      onDelete={async (id) => {
        await api.deleteRole(id);
        refresh();
      }}
    />
  );
}
