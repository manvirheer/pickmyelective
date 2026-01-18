import { useEffect, useState } from 'react'
import { History, ChevronDown, ChevronUp, Clock, Search } from 'lucide-react'
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
    <div className="history-panel">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 transition-all duration-200"
        style={{ color: 'var(--page-text)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--page-accent-light)' }}
          >
            <History className="w-4 h-4" style={{ color: 'var(--page-accent)' }} />
          </div>
          <span className="font-medium text-[15px]">Recent Searches</span>
        </div>
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{ backgroundColor: 'var(--page-surface-hover)' }}
        >
          {isOpen ? (
            <ChevronUp className="w-4 h-4" style={{ color: 'var(--page-text-muted)' }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--page-text-muted)' }} />
          )}
        </div>
      </button>

      {isOpen && (
        <div
          className="border-t"
          style={{ borderColor: 'var(--page-border)' }}
        >
          {isLoading ? (
            <div className="p-6 text-center">
              <div
                className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center animate-pulse"
                style={{ backgroundColor: 'var(--page-surface-hover)' }}
              >
                <Search className="w-4 h-4" style={{ color: 'var(--page-text-muted)' }} />
              </div>
              <p
                className="text-sm"
                style={{ color: 'var(--page-text-muted)' }}
              >
                Loading history...
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-6 text-center">
              <div
                className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: 'var(--page-surface-hover)' }}
              >
                <Search className="w-5 h-5" style={{ color: 'var(--page-text-muted)' }} />
              </div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: 'var(--page-text)' }}
              >
                No searches yet
              </p>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: 'var(--page-text-muted)' }}
              >
                Your search history will appear here
              </p>
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="history-item"
                >
                  <button
                    onClick={() => onQueryClick?.(item.query)}
                    className="w-full p-4 text-left transition-all duration-200 flex items-start gap-3"
                  >
                    <div
                      className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: 'var(--page-primary-light)' }}
                    >
                      <Search className="w-3 h-3" style={{ color: 'var(--page-primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[14px] font-medium truncate mb-1.5 leading-snug"
                        style={{ color: 'var(--page-text)' }}
                      >
                        {item.query}
                      </p>
                      <p
                        className="text-[13px] flex items-center gap-1.5"
                        style={{ color: 'var(--page-text-muted)' }}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
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
