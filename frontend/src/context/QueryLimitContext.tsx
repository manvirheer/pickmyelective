import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getQueryLimit, type QueryLimitResponse } from '@/services/api'
import { useAuth } from './AuthContext'

interface QueryLimitContextType {
  remainingQueries: number
  maxQueries: number
  resetTime: string | null
  refreshLimit: () => Promise<void>
}

const QueryLimitContext = createContext<QueryLimitContextType>({
  remainingQueries: 0,
  maxQueries: 5,
  resetTime: null,
  refreshLimit: async () => {},
})

export function QueryLimitProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [limit, setLimit] = useState<QueryLimitResponse | null>(null)

  const refreshLimit = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const data = await getQueryLimit()
      setLimit(data)
    } catch {
      // Silently fail - user will see limit in query response
    }
  }, [isAuthenticated])

  // Fetch limit on auth change
  useEffect(() => {
    if (isAuthenticated) {
      refreshLimit()
    } else {
      setLimit(null)
    }
  }, [isAuthenticated, refreshLimit])

  return (
    <QueryLimitContext.Provider
      value={{
        remainingQueries: limit?.remainingQueries ?? 0,
        maxQueries: limit?.maxQueries ?? 5,
        resetTime: limit?.resetTime ?? null,
        refreshLimit,
      }}
    >
      {children}
    </QueryLimitContext.Provider>
  )
}

export const useQueryLimit = () => useContext(QueryLimitContext)
