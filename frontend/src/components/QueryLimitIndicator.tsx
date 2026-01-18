import { useEffect, useState } from 'react'
import { Clock, Zap } from 'lucide-react'
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
  const percentage = (limit.remainingQueries / limit.maxQueries) * 100

  return (
    <div
      className="flex items-center gap-3 text-sm px-4 py-2.5 rounded-xl transition-all duration-200"
      style={{
        backgroundColor: isLow ? 'var(--page-error-light)' : 'var(--page-primary-light)',
        border: `1px solid ${isLow ? 'var(--page-error)' : 'var(--page-primary)'}`,
      }}
    >
      <div className="flex items-center gap-2">
        <Zap
          className="w-4 h-4"
          style={{ color: isLow ? 'var(--page-error)' : 'var(--page-primary)' }}
        />
        <span
          className="font-medium"
          style={{ color: isLow ? 'var(--page-error)' : 'var(--page-primary)' }}
        >
          {limit.remainingQueries}/{limit.maxQueries}
        </span>
        <span style={{ color: isLow ? 'var(--page-error)' : 'var(--page-text-muted)' }}>
          queries
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-16 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: isLow ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            background: isLow
              ? 'var(--page-error)'
              : 'linear-gradient(90deg, var(--page-primary) 0%, var(--page-accent) 100%)',
          }}
        />
      </div>

      {limit.resetTime && limit.remainingQueries < limit.maxQueries && (
        <span
          className="flex items-center gap-1.5 text-[13px]"
          style={{ color: 'var(--page-text-muted)' }}
        >
          <Clock className="w-3.5 h-3.5" />
          {formatResetTime(limit.resetTime)}
        </span>
      )}
    </div>
  )
}
