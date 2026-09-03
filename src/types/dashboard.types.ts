export interface OverviewMetrics {
  totalScreening: number;
  criticalCasesP1: number;
  highRiskCasesP2: number;
  monitoringCasesP3: number;
  normalCasesP4: number;
}

export interface FollowUpMetrics {
  pending: number;
  scheduled: number;
  completed: number;
  totalTickets: number;
}

export interface RecentEmergencyCaseItem {
  id: string;
  srqScore: number;
  priorityResult: string;
  calculatedAt: Date;
  student?: {
    id: string;
    nim: string;
    user?: {
      name: string;
      email: string;
    } | null;
    studyProgram?: {
      name: string;
      code: string;
    } | null;
  } | null;
}

export interface DashboardOverviewResponse {
  overview: OverviewMetrics;
  followUpStats: FollowUpMetrics;
  recentEmergencyCases: RecentEmergencyCaseItem[];
}
