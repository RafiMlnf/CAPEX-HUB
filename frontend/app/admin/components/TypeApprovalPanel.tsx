"use client";

import { useState, useEffect } from "react";
import { api, ApiTypeApproval } from "../../lib/api";
import GenericMasterPanel from "./GenericMasterPanel";

export default function TypeApprovalPanel() {
  const [items, setItems] = useState<ApiTypeApproval[]>([]);
  const refresh = () => api.getTypeApprovals().then(setItems).catch(console.error);
  useEffect(() => { refresh(); }, []);
  return (
    <GenericMasterPanel
      title="Master Type Approval"
      items={items}
      onSave={async (data, id) => {
        id ? await api.updateTypeApproval(id, data) : await api.createTypeApproval(data);
        refresh();
      }}
      onDelete={async (id) => {
        await api.deleteTypeApproval(id);
        refresh();
      }}
    />
  );
}
