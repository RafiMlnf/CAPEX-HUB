// ── Central API Service Aggregator ──────────────────────────────────────────

export * from "./types";
export * from "./client";
export * from "./authApi";
export * from "./masterApi";
export * from "./bodrApi";
export * from "./otorisasiApi";
export * from "./capexApi";
export * from "./settingsApi";
export * from "./adminApi";
export * from "./uploadApi";

import { getUploadFileUrl } from "./client";
import {
  loginUser,
  getUsers,
  getUser,
  addUser,
  updateUser,
  deleteUser,
} from "./authApi";
import { masterApi } from "./masterApi";
import { bodrApi } from "./bodrApi";
import { otorisasiApi } from "./otorisasiApi";
import { capexApi } from "./capexApi";
import { settingsApi } from "./settingsApi";
import { adminApi } from "./adminApi";
import { uploadDocument, uploadMultipleDocuments } from "./uploadApi";

// ── Unified API Service Client (100% Backward Compatible) ────────────────────

export const api = {
  // Auth & Users
  login: loginUser,
  getUsers,
  getUser,
  createUser: addUser,
  updateUser,
  deleteUser,

  // Master Data
  ...masterApi,

  // Settings
  ...settingsApi,

  // BODR
  ...bodrApi,

  // Purchasing & Otorisasi Harga
  ...otorisasiApi,

  // Admin Dashboard & History Logs
  ...adminApi,

  // Capex (FS)
  ...capexApi,

  // Document Upload & File URL
  uploadDocument,
  uploadMultipleDocuments,
  getUploadFileUrl,
};

export default api;
