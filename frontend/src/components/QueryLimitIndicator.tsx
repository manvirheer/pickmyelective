import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { getQueryLimit } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

interface QueryLimitState {
  remainingQueries: number
  maxQueries: number
  resetTime: string | null
}

export function QueryLimitIndicator() {
  const { isAuthenticated } = useAuth()
  const [limit, setLimit] = useState<QueryLimitState | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchLimit()
    } else {
      // Reset limit state when user logs out
      setLimit(null)
    }
  }, [isAuthenticated])

  const fetchLimit = async () => {
    try {
      const data = await getQueryLimit()
      setLimit(data)
    } catch {
      // Silently fail - user will see limit in query response
    }
  }

  // Expose refresh function for parent components
  useEffect(() => {
    (window as { refreshQueryLimit?: () => void }).refreshQueryLimit = fetchLimit
    return () => {
      delete (window as { refreshQueryLimit?: () => void }).refreshQueryLimit
    }
  }, [])

  if (!isAuthenticated || !limit) {
    return null
  }

  const formatResetTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isLow = limit.remainingQueries <= 1

  return (
    <div
      className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full"
      style={{
        backgroundColor: isLow ? 'rgba(239, 68, 68, 0.1)' : 'var(--page-surface)',
        color: isLow ? '#ef4444' : 'var(--page-text-muted)',
      }}
    >
      <span>
        {limit.remainingQueries}/{limit.maxQueries} queries
      </span>
      {limit.resetTime && limit.remainingQueries < limit.maxQueries && (
        <span className="flex items-center gap-1 opacity-75">
          <Clock className="w-3 h-3" />
          resets {formatResetTime(limit.resetTime)}
        </span>
      )}
    </div>
  )
}
