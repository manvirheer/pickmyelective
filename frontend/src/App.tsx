import { useState, useRef, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import geminiIcon from '@/assets/Google_Gemini_icon_2025.svg.png'
import { SearchBar, FilterPanel, CourseCard } from '@/components'
import { LoginModal } from '@/components/LoginModal'
import { QueryLimitIndicator } from '@/components/QueryLimitIndicator'
import { QueryHistory } from '@/components/QueryHistory'
import { getRecommendations } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Search, GraduationCap, Loader2, AlertCircle, MessageSquare } from 'lucide-react'
import type { QueryFilters, CourseResult } from '@/types'

function App() {
  const [filters, setFilters] = useState<QueryFilters>({})
  const [courses, setCourses] = useState<CourseResult[]>([])
  const [interpretation, setInterpretation] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pendingQueryRef = useRef<string | null>(null)

  const { isAuthenticated } = useAuth()

  // Reset app state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setCourses([])
      setInterpretation('')
      setError(null)
      setHasSearched(false)
      setSearchQuery('')
    }
  }, [isAuthenticated])

  // Execute search (bypasses auth check - called when we know user is authenticated)
  const executeSearch = async (query: string) => {
    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const response = await getRecommendations({
        query,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      })

      setCourses(response.courses || [])
      setInterpretation(response.query_interpretation || '')

      // Refresh query limit indicator
      const refreshLimit = (window as { refreshQueryLimit?: () => void }).refreshQueryLimit
      if (refreshLimit) refreshLimit()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      setCourses([])
      setInterpretation('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    // If not authenticated, show login modal and save the query
    if (!isAuthenticated) {
      pendingQueryRef.current = query
      setIsLoginModalOpen(true)
      return
    }

    executeSearch(query)
  }

  const handleLoginSuccess = () => {
    // Ensure modal is closed (avoid stale closure issue)
    setIsLoginModalOpen(false)

    // If there was a pending query, execute it directly
    // We know user just logged in, so skip auth check by calling executeSearch
    if (pendingQueryRef.current) {
      const query = pendingQueryRef.current
      pendingQueryRef.current = null
      executeSearch(query)
    }
  }

  const handleHistoryQueryClick = (query: string) => {
    handleSearch(query)
  }

  const handleLogoClick = () => {
    setCourses([])
    setInterpretation('')
    setError(null)
    setHasSearched(false)
    setSearchQuery('')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Clean Header - NO background image */}
      <Header
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogoClick={handleLogoClick}
      />

      {/* Main Content Area - WITH blurred background */}
      <main className="flex-1 blurred-bg-section">
        <div className="blurred-bg-content py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Hero Text */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                Find Your Perfect Elective
              </h1>
              <p className="text-xl text-white font-medium tracking-wide drop-shadow-lg" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                AI powered course recommendations for SFU students
              </p>
            </div>

            {/* Search Box - Bento card style */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bento-card-static relative">
                <div className="flex items-center justify-between mb-3">
                  <QueryLimitIndicator />
                </div>
                <SearchBar
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  query={searchQuery}
                  onQueryChange={setSearchQuery}
                />
                {/* Powered by Gemini badge */}
                <div className="flex items-center justify-end gap-1.5 mt-3 opacity-70">
                  <span className="text-xs" style={{ color: 'var(--page-text-muted)' }}>
                    Powered by
                  </span>
                  <img
                    src={geminiIcon}
                    alt="Gemini"
                    className="w-4 h-4"
                  />
                  <span className="text-xs font-medium" style={{ color: 'var(--page-text-muted)' }}>
                    Gemini
                  </span>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              <aside className="lg:col-span-1 space-y-4">
                <FilterPanel filters={filters} onChange={setFilters} />
                <QueryHistory onQueryClick={handleHistoryQueryClick} />
              </aside>

              {/* Results Area */}
              <section className="lg:col-span-3">
                {/* Error State */}
                {error && (
                  <div
                    className="bento-card-static mb-4 border-l-4 flex items-start gap-3"
                    style={{ borderLeftColor: 'var(--page-error)' }}
                  >
                    <AlertCircle
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: 'var(--page-error)' }}
                    />
                    <p style={{ color: 'var(--page-error)' }}>{error}</p>
                  </div>
                )}

                {/* Query Interpretation */}
                {interpretation && !error && (
                  <div
                    className="bento-card-static mb-4 border-l-4 flex items-start gap-3"
                    style={{ borderLeftColor: 'var(--page-primary)' }}
                  >
                    <MessageSquare
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: 'var(--page-primary)' }}
                    />
                    <p style={{ color: 'var(--page-text)' }}>
                      <strong>Understanding your request:</strong> {interpretation}
                    </p>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="bento-card-static text-center py-12">
                    <Loader2
                      className="w-12 h-12 mx-auto mb-4 animate-spin"
                      style={{ color: 'var(--page-primary)' }}
                    />
                    <p style={{ color: 'var(--page-text-muted)' }}>
                      Finding the best courses for you...
                    </p>
                  </div>
                )}

                {/* Results */}
                {!isLoading && courses.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4 drop-shadow">
                      Found {courses.length} matching course{courses.length !== 1 ? 's' : ''}
                    </h2>
                    {courses.map((course) => (
                      <CourseCard key={course.course_code} course={course} />
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && hasSearched && courses.length === 0 && !error && (
                  <div className="bento-card-static text-center py-12">
                    <Search
                      className="w-16 h-16 mx-auto mb-4"
                      style={{ color: 'var(--page-text-muted)' }}
                    />
                    <h3
                      className="text-xl font-semibold mb-2"
                      style={{ color: 'var(--page-text)' }}
                    >
                      No courses found
                    </h3>
                    <p style={{ color: 'var(--page-text-muted)' }}>
                      Try adjusting your search terms or removing some filters.
                    </p>
                  </div>
                )}

                {/* Initial State */}
                {!hasSearched && (
                  <div className="bento-card-static text-center py-12">
                    <GraduationCap
                      className="w-16 h-16 mx-auto mb-4"
                      style={{ color: 'var(--page-primary)' }}
                    />
                    <h3
                      className="text-xl font-semibold mb-2"
                      style={{ color: 'var(--page-text)' }}
                    >
                      Ready to find your perfect elective?
                    </h3>
                    <p className="mb-4" style={{ color: 'var(--page-text-muted)' }}>
                      Describe what you're looking for in natural language. Our Gemini powered
                      RAG model will understand your needs and find courses that match your interests.
                    </p>
                    <div className="text-sm" style={{ color: 'var(--page-text-muted)' }}>
                      <strong>Example searches:</strong>
                      <br />
                      "easy psychology course with no prerequisites"
                      <br />
                      "interesting AI and machine learning courses"
                      <br />
                      "writing intensive humanities breadth requirement"
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
