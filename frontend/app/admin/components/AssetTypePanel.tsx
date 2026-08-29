"use client";

import { useState, useEffect, useMemo } from "react";
import { api, ApiAssetType } from "../../lib/api";
import GenericMasterPanel from "./GenericMasterPanel";

export default function AssetTypePanel() {
  const [rawItems, setRawItems] = useState<ApiAssetType[]>([]);
  const refresh = () => api.getAssetTypes().then(setRawItems).catch(console.error);

  useEffect(() => {
    refresh();
  }, []);

  const items = useMemo(() => {
    return rawItems.map((item) => ({
      ...item,
      kode: item.class,
      nama: item.nama_type,
    }));
  }, [rawItems]);

  return (
    <GenericMasterPanel
      title="Master Asset Type"
      items={items}
      onSave={async (data, id) => {
        const payload: Partial<ApiAssetType> = {
          class: (data as any).kode || (data as any).class,
          nama_type: (data as any).nama || (data as any).nama_type,
          deskripsi: data.deskripsi,
          status: data.status,
        };
        id ? await api.updateAssetType(id, payload) : await api.createAssetType(payload);
        refresh();
      }}
      onDelete={async (id) => {
        await api.deleteAssetType(id);
        refresh();
      }}
    />
  );
}
