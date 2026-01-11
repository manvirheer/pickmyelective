import { useEffect, useState } from 'react'
import { History, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { getQueryHistory, type QueryHistoryItem } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

interface QueryHistoryProps {
  onQueryClick?: (query: string) => void
}

export function QueryHistory({ onQueryClick }: QueryHistoryProps) {
  const { isAuthenticated } = useAuth()
  const [history, setHistory] = useState<QueryHistoryItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      fetchHistory()
    }
  }, [isAuthenticated, isOpen])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const data = await getQueryHistory()
      setHistory(data)
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // Less than 1 hour ago
    if (diff < 60 * 60 * 1000) {
      const mins = Math.floor(diff / (60 * 1000))
      return mins <= 1 ? 'Just now' : `${mins} minutes ago`
    }

    // Less than 24 hours ago
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    }

    // Otherwise show date
    return date.toLocaleDateString()
  }

  return (
    <div
      className="rounded-lg border"
      style={{
        backgroundColor: 'var(--page-surface)',
        borderColor: 'var(--page-border)',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 transition-colors hover:bg-[var(--page-background)]"
        style={{ color: 'var(--page-text)' }}
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4" style={{ color: 'var(--page-text-muted)' }} />
          <span className="font-medium text-sm">Recent Searches</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" style={{ color: 'var(--page-text-muted)' }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: 'var(--page-text-muted)' }} />
        )}
      </button>

      {isOpen && (
        <div
          className="border-t"
          style={{ borderColor: 'var(--page-border)' }}
        >
          {isLoading ? (
            <div
              className="p-4 text-center text-sm"
              style={{ color: 'var(--page-text-muted)' }}
            >
              Loading...
            </div>
          ) : history.length === 0 ? (
            <div
              className="p-4 text-center text-sm"
              style={{ color: 'var(--page-text-muted)' }}
            >
              No search history yet
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="border-b last:border-b-0"
                  style={{ borderColor: 'var(--page-border)' }}
                >
                  <button
                    onClick={() => onQueryClick?.(item.query)}
                    className="w-full p-3 text-left transition-colors hover:bg-[var(--page-background)]"
                  >
                    <p
                      className="text-sm truncate"
                      style={{ color: 'var(--page-text)' }}
                    >
                      {item.query}
                    </p>
                    <p
                      className="text-xs flex items-center gap-1 mt-1"
                      style={{ color: 'var(--page-text-muted)' }}
                    >
                      <Clock className="w-3 h-3" />
                      {formatDate(item.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
