import { UploadResponse } from "./types";

export async function uploadDocument(file: File): Promise<UploadResponse> {
  let fileUrl = "";
  if (typeof window !== "undefined" && typeof URL !== "undefined") {
    try {
      fileUrl = URL.createObjectURL(file);
    } catch {
      fileUrl = `/uploads/${encodeURIComponent(file.name)}`;
    }
  }

  const ext = file.name.split(".").pop() || "";

  return {
    success: true,
    file_name: file.name,
    original_name: file.name,
    url: fileUrl,
    size: file.size,
    extension: ext,
    uploaded_at: new Date().toISOString(),
  };
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
