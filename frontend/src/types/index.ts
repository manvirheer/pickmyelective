// API Request/Response Types

export interface QueryFilters {
  campus?: string[];
  wqb?: string[];
  max_level?: number;
  no_prerequisites?: boolean;
  online_only?: boolean;
  exclude_departments?: string[];
}

export interface CourseResult {
  course_code: string;
  title: string;
  description: string;
  campus: string[];
  wqb: string[];
  units: number;
  prerequisites: string;
  has_prerequisites: boolean;
  instructor: string;
  delivery_methods: string[];
  relevance_score: number;
  match_reason: string;
}

export interface ApiError {
  error: string;
}

// Re-export types from api.ts for convenience
export type { QueryRequest, QueryResponse, QueryLimitResponse, QueryHistoryItem } from '@/services/api';
