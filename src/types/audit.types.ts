export interface RecordAuditInput {
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string; // Contoh: "USER_CREATE", "ROLE_UPDATE", "PERMISSION_ASSIGN"
  module: string; // Contoh: "USER_MANAGEMENT", "SYSTEM_SETTING", "SCREENING_SRQ20"
  targetEntity?: string | null; // Contoh: "users", "roles", "permissions"
  targetId?: string | null;
  ipAddress?: string | null;
  details?: Record<string, any> | null;
}

export interface ListAuditLogsQuery {
  page?: number | string;
  limit?: number | string;
  search?: string; // Pencarian global (email, action, targetEntity, ipAddress)
  module?: string; // Filter Modul
  action?: string; // Filter Aksi Spesifik (USER_CREATE, DELETE, dll)
  actorEmail?: string; // Filter Email Pelaku
  actorUserId?: string; // Filter ID Pelaku
  targetEntity?: string; // Filter Entitas Terkait (users, roles, permissions)
  targetId?: string; // Filter ID Objek Spesifik
  startDate?: string; // Filter Tanggal Awal (Format: YYYY-MM-DD atau ISO String)
  endDate?: string; // Filter Tanggal Akhir (Format: YYYY-MM-DD atau ISO String)
  sortOrder?: "asc" | "desc"; // Urutan Waktu (Default: desc)
}

export interface AuditLogResponse {
  id: string;
  actorUserId: string | null;
  actorEmail: string;
  action: string;
  module: string;
  targetEntity: string | null;
  targetId: string | null;
  ipAddress: string | null;
  details: Record<string, any> | null;
  createdAt: string | Date; // Biarkan menerima string (ISO) atau Date
}
