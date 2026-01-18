import { useState, useRef, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import geminiIcon from '@/assets/Google_Gemini_icon_2025.svg.png'
import { SearchBar, FilterPanel, CourseCard } from '@/components'
import { LoginModal } from '@/components/LoginModal'
import { QueryLimitIndicator } from '@/components/QueryLimitIndicator'
import { QueryHistory } from '@/components/QueryHistory'
import { getRecommendations } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Search, GraduationCap, Loader2, AlertCircle, MessageSquare, Sparkles, Zap } from 'lucide-react'
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

      {/* Glass Header */}
      <Header
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogoClick={handleLogoClick}
      />

      {/* Main Content Area */}
      <main className="flex-1 blurred-bg-section">
        <div className="blurred-bg-content py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Hero Section */}
            <div className="text-center mb-10 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ backgroundColor: 'var(--page-primary-light)' }}>
                <Sparkles className="w-4 h-4" style={{ color: 'var(--page-primary)' }} />
                <span className="text-[14px] font-medium" style={{ color: 'var(--page-primary)' }}>AI-Powered Course Discovery</span>
              </div>
              <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl text-white mb-4 drop-shadow-lg">
                Find Your Perfect{' '}
                <span className="text-gradient">Elective</span>
              </h1>
              <p className="hero-subtitle text-lg md:text-xl text-white/90 max-w-2xl mx-auto" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                Discover courses that match your interests using natural language search powered by AI
              </p>
            </div>

            {/* Search Box */}
            <div className="max-w-4xl mx-auto mb-10">
              <div className="bento-card-static relative animate-slideUp" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-4">
                  <QueryLimitIndicator />
                </div>
                <SearchBar
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  query={searchQuery}
                  onQueryChange={setSearchQuery}
                />
                {/* Powered by Gemini badge */}
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--page-border)' }}>
                  <span className="text-[13px]" style={{ color: 'var(--page-text-muted)' }}>
                    Powered by
                  </span>
                  <img
                    src={geminiIcon}
                    alt="Gemini"
                    className="w-4 h-4"
                  />
                  <span className="text-[13px] font-medium" style={{ color: 'var(--page-text-muted)' }}>
                    Gemini
                  </span>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              <aside className="lg:col-span-1 space-y-4 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                <FilterPanel filters={filters} onChange={setFilters} />
                <QueryHistory onQueryClick={handleHistoryQueryClick} />
              </aside>

              {/* Results Area */}
              <section className="lg:col-span-3">
                {/* Error State */}
                {error && (
                  <div
                    className="bento-card-static mb-4 border-l-4 flex items-start gap-3 animate-fadeIn"
                    style={{ borderLeftColor: 'var(--page-error)' }}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'var(--page-error-light)' }}
                    >
                      <AlertCircle
                        className="w-5 h-5"
                        style={{ color: 'var(--page-error)' }}
                      />
                    </div>
                    <div>
                      <p className="font-medium mb-1" style={{ color: 'var(--page-error)' }}>Something went wrong</p>
                      <p className="text-sm" style={{ color: 'var(--page-text-muted)' }}>{error}</p>
                    </div>
                  </div>
                )}

                {/* Query Interpretation */}
                {interpretation && !error && (
                  <div
                    className="bento-card-static mb-4 border-l-4 flex items-start gap-3 animate-fadeIn"
                    style={{ borderLeftColor: 'var(--page-primary)' }}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'var(--page-primary-light)' }}
                    >
                      <MessageSquare
                        className="w-5 h-5"
                        style={{ color: 'var(--page-primary)' }}
                      />
                    </div>
                    <div>
                      <p className="font-medium mb-1" style={{ color: 'var(--page-text)' }}>Understanding your request</p>
                      <p className="text-sm" style={{ color: 'var(--page-text-muted)' }}>{interpretation}</p>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="bento-card-static text-center py-16 animate-fadeIn">
                    <div
                      className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, var(--page-primary) 0%, var(--page-accent) 100%)' }}
                    >
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--page-text)' }}>
                      Finding perfect courses...
                    </h3>
                    <p style={{ color: 'var(--page-text-muted)' }}>
                      Our AI is analyzing your request
                    </p>
                  </div>
                )}

                {/* Results */}
                {!isLoading && courses.length > 0 && (
                  <div className="animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-white drop-shadow flex items-center gap-2">
                        <Zap className="w-5 h-5" style={{ color: 'var(--page-primary)' }} />
                        Found {courses.length} matching course{courses.length !== 1 ? 's' : ''}
                      </h2>
                    </div>
                    {courses.map((course, index) => (
                      <CourseCard key={course.course_code} course={course} index={index} />
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && hasSearched && courses.length === 0 && !error && (
                  <div className="bento-card-static text-center py-16 animate-fadeIn">
                    <div
                      className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: 'var(--page-surface-hover)' }}
                    >
                      <Search className="w-8 h-8" style={{ color: 'var(--page-text-muted)' }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--page-text)' }}>
                      No courses found
                    </h3>
                    <p className="text-[15px] leading-relaxed" style={{ color: 'var(--page-text-muted)' }}>
                      Try adjusting your search terms or removing some filters
                    </p>
                  </div>
                )}

                {/* Initial State */}
                {!hasSearched && (
                  <div className="bento-card-static text-center py-16 animate-slideUp" style={{ animationDelay: '0.3s' }}>
                    <div
                      className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, var(--page-primary) 0%, var(--page-accent) 100%)' }}
                    >
                      <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--page-text)' }}>
                      Ready to discover your perfect elective?
                    </h3>
                    <p className="mb-6 max-w-md mx-auto" style={{ color: 'var(--page-text-muted)' }}>
                      Describe what you're looking for in natural language. Our AI will understand your needs and find courses that match your interests.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                      {[
                        { icon: '🧠', text: 'Psychology without prerequisites' },
                        { icon: '🤖', text: 'AI and machine learning' },
                        { icon: '✍️', text: 'Writing intensive humanities' },
                      ].map((example) => (
                        <button
                          key={example.text}
                          onClick={() => setSearchQuery(example.text)}
                          className="suggestion-tag text-left p-3 flex items-start gap-2"
                        >
                          <span className="text-lg">{example.icon}</span>
                          <span className="text-[13px] leading-snug">{example.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default App
