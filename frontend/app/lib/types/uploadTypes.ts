export interface UploadResponse {
  success: boolean;
  url: string;
  file_name: string;
  original_name: string;
  size: number;
  extension: string;
  uploaded_at: string;
}
