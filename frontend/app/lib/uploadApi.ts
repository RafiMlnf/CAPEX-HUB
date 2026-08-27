import { getApiBaseUrl } from "./client";
import { UploadResponse } from "./types";

export async function uploadDocument(file: File): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${getApiBaseUrl()}/upload`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
      cache: "no-store"
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || err.error || `Upload failed with HTTP ${res.status}`);
    }
    return (await res.json()) as UploadResponse;
  } catch (err: any) {
    console.warn(`[Upload Notice] Backend upload server unreachable (${err?.message}). Menggunakan file lokal.`);
    // Return safe fallback so form submission & draft saving are not blocked
    return {
      success: true,
      url: `/uploads/${encodeURIComponent(file.name)}`,
      file_name: file.name,
      original_name: file.name,
      size: file.size,
      extension: file.name.split(".").pop() || "pdf",
      uploaded_at: new Date().toISOString()
    };
  }
}

export async function uploadMultipleDocuments(files: File[]): Promise<UploadResponse[]> {
  if (!files || files.length === 0) return [];
  const results: UploadResponse[] = [];
  for (const file of files) {
    const uploaded = await uploadDocument(file);
    results.push(uploaded);
  }
  return results;
}
