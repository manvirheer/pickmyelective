import { Clock, Zap } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useQueryLimit } from '@/context/QueryLimitContext'

export function QueryLimitIndicator() {
  const { isAuthenticated } = useAuth()
  const { remainingQueries, maxQueries, resetTime } = useQueryLimit()

  if (!isAuthenticated || maxQueries === 0) {
    return null
  }

  const formatResetTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isLow = remainingQueries <= 1
  const percentage = (remainingQueries / maxQueries) * 100

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
          {remainingQueries}/{maxQueries}
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

      {resetTime && remainingQueries < maxQueries && (
        <span
          className="flex items-center gap-1.5 text-[13px]"
          style={{ color: 'var(--page-text-muted)' }}
        >
          <Clock className="w-3.5 h-3.5" />
          {formatResetTime(resetTime)}
        </span>
      )}
    </div>
  )
}
