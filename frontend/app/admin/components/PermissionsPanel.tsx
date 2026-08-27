"use client";

import { useState, useEffect } from "react";
import { api, ApiPermission } from "../../lib/api";
import GenericMasterPanel from "./GenericMasterPanel";

export default function PermissionsPanel() {
  const [items, setItems] = useState<ApiPermission[]>([]);
  const refresh = () => api.getPermissions().then(setItems).catch(console.error);
  useEffect(() => { refresh(); }, []);
  return (
    <GenericMasterPanel
      title="Master Permission"
      items={items}
      onSave={async (data, id) => {
        id ? await api.updatePermission(id, data) : await api.createPermission(data);
        refresh();
      }}
      onDelete={async (id) => {
        await api.deletePermission(id);
        refresh();
      }}
    />
  );
}
