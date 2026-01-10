import type { RecommendRequest, RecommendResponse } from '../types';

const RAG_API_URL = 'http://localhost:8000';

export async function getRecommendations(request: RecommendRequest): Promise<RecommendResponse> {
  const response = await fetch(`${RAG_API_URL}/api/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get recommendations');
  }

  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${RAG_API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
