export type SessionStatusFilter = "all" | "active" | "inactive";

export interface SessionQueryParams {
  page?: number;
  limit?: number;
  status?: SessionStatusFilter;
}

export interface SessionResponse {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  deviceInfo: string;
  isRevoked: boolean;
  isActive: boolean;
  expiredAt: string;
  createdAt: string;
}

export type GetSessionInput = SessionQueryParams;
