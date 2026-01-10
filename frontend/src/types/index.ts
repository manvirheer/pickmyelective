// API Request/Response Types

export interface QueryFilters {
  campus?: string[];
  wqb?: string[];
  max_level?: number;
  no_prerequisites?: boolean;
  exclude_departments?: string[];
}

export interface RecommendRequest {
  query: string;
  filters?: QueryFilters;
  top_k?: number;
  min_relevance?: number;
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

export interface RecommendResponse {
  success: boolean;
  query_interpretation: string;
  courses: CourseResult[];
}

export interface ApiError {
  detail: string;
}
