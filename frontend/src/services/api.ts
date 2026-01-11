import type { QueryFilters, CourseResult } from '../types';
import { getToken } from './auth';

const API_URL = 'http://localhost:8080';

export interface QueryRequest {
  query: string;
  filters?: QueryFilters;
}

export interface QueryResponse {
  query: string;
  query_interpretation: string;
  courses: CourseResult[];
  remainingQueries: number;
  resetTime: string;
  success: boolean;
  error?: string;
}

export interface QueryLimitResponse {
  remainingQueries: number;
  maxQueries: number;
  resetTime: string;
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  response: string;
  createdAt: string;
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getRecommendations(request: QueryRequest): Promise<QueryResponse> {
  const response = await fetch(`${API_URL}/api/query`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (response.status === 401) {
    throw new Error('Please log in to search for courses');
  }

  if (response.status === 429) {
    const data = await response.json();
    throw new Error(data.error || 'Query limit exceeded. Please try again later.');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get recommendations');
  }

  return response.json();
}

export async function getQueryLimit(): Promise<QueryLimitResponse> {
  const response = await fetch(`${API_URL}/api/query/limit`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get query limit');
  }

  return response.json();
}

export async function getQueryHistory(): Promise<QueryHistoryItem[]> {
  const response = await fetch(`${API_URL}/api/query/history`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get query history');
  }

  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/query/limit`, {
      headers: getAuthHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
}
