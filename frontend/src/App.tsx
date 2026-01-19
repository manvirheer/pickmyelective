import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import geminiIcon from '@/assets/Google_Gemini_icon_2025.svg.png'
import { SearchBar, FilterPanel, CourseCard } from '@/components'
import { LoginModal } from '@/components/LoginModal'
import { QueryLimitIndicator } from '@/components/QueryLimitIndicator'
import { QueryHistory } from '@/components/QueryHistory'
import { getRecommendations } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useQueryLimit } from '@/context/QueryLimitContext'
import { Search, GraduationCap, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import type { QueryFilters, CourseResult } from '@/types'

// Animation variants for staggered list
const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

function App() {
  const [filters, setFilters] = useState<QueryFilters>({})
  const [courses, setCourses] = useState<CourseResult[]>([])
  const [interpretation, setInterpretation] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pendingQueryRef = useRef<{ query: string; filters: QueryFilters } | null>(null)

  const { isAuthenticated } = useAuth()
  const { refreshLimit } = useQueryLimit()

  // Reset app state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setCourses([])
      setInterpretation('')
      setError(null)
      setHasSearched(false)
      setSearchQuery('')
      setFilters({})
    }
  }, [isAuthenticated])

  // Execute search (bypasses auth check - called when we know user is authenticated)
  const executeSearch = async (query: string, searchFilters?: QueryFilters) => {
    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    // Use provided filters or current filter state
    const filtersToUse = searchFilters ?? filters

    try {
      const response = await getRecommendations({
        query,
        filters: Object.keys(filtersToUse).length > 0 ? filtersToUse : undefined,
      })

      setCourses(response.courses || [])
      setInterpretation(response.query_interpretation || '')

      // Refresh query limit indicator
      refreshLimit()
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
    // If not authenticated, show login modal and save the query with current filters
    if (!isAuthenticated) {
      pendingQueryRef.current = { query, filters: { ...filters } }
      setIsLoginModalOpen(true)
      return
    }

    executeSearch(query)
  }

  const handleLoginSuccess = () => {
    // Ensure modal is closed (avoid stale closure issue)
    setIsLoginModalOpen(false)

    // If there was a pending query, execute it with the saved filters
    // We know user just logged in, so skip auth check by calling executeSearch
    if (pendingQueryRef.current) {
      const { query, filters: savedFilters } = pendingQueryRef.current
      pendingQueryRef.current = null
      // Restore the filters that were active when the user initiated the search
      setFilters(savedFilters)
      executeSearch(query, savedFilters)
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

      {/* Header */}
      <Header
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogoClick={handleLogoClick}
      />

      {/* Main Content */}
      <main className="flex-1">
        <div className="py-6 sm:py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Hero Section */}
            <div className="hero-panel">
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.h1
                  className="hero-title mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Find Your Perfect Elective
                </motion.h1>
                <motion.p
                  className="hero-subtitle max-w-3xl mx-auto text-lg sm:text-xl font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  Describe what you're looking for and let AI find the best matches
                </motion.p>
              </motion.div>

              {/* Search Box */}
              <motion.div
                className="max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="mb-3">
                  <QueryLimitIndicator />
                </div>
                <SearchBar
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  query={searchQuery}
                  onQueryChange={setSearchQuery}
                />
                {/* Powered by Gemini */}
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  <span className="text-sm font-medium" style={{ color: 'var(--page-text)' }}>
                    Powered by
                  </span>
                  <img src={geminiIcon} alt="" className="w-4 h-4" />
                  <span className="text-sm font-medium" style={{ color: 'var(--page-text)' }}>
                    Gemini
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
              {/* Sidebar */}
              <motion.aside
                className="lg:col-span-1 space-y-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <FilterPanel filters={filters} onChange={setFilters} />
                <QueryHistory onQueryClick={handleHistoryQueryClick} />
              </motion.aside>

              {/* Results Area */}
              <section className="lg:col-span-3">
                {/* Error State */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      key="error"
                      className="bento-card-static mb-4 flex items-start gap-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--page-error-subtle)' }}
                      >
                        <AlertCircle className="w-4 h-4" style={{ color: 'var(--page-error)' }} />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium mb-0.5" style={{ color: 'var(--page-text)' }}>
                          Something went wrong
                        </p>
                        <p className="text-[13px]" style={{ color: 'var(--page-text-muted)' }}>
                          {error}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Query Interpretation */}
                <AnimatePresence mode="wait">
                  {interpretation && !error && (
                    <motion.div
                      key="interpretation"
                      className="bento-card-static mb-4 flex items-start gap-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--page-primary-subtle)' }}
                      >
                        <Sparkles className="w-4 h-4" style={{ color: 'var(--page-primary)' }} />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium mb-0.5" style={{ color: 'var(--page-text)' }}>
                          Understanding your search
                        </p>
                        <p className="text-[13px]" style={{ color: 'var(--page-text-muted)' }}>
                          {interpretation}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading State */}
                <AnimatePresence mode="wait">
                  {isLoading && (
                    <motion.div
                      key="loading"
                      className="bento-card-static text-center py-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col items-center">
                        <Loader2
                          className="w-8 h-8 animate-spin mb-3"
                          style={{ color: 'var(--page-primary)' }}
                        />
                        <p className="text-[14px] font-medium" style={{ color: 'var(--page-text)' }}>
                          Finding courses...
                        </p>
                        <p className="text-[13px]" style={{ color: 'var(--page-text-muted)' }}>
                          Analyzing your request
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Results */}
                <AnimatePresence mode="wait">
                  {!isLoading && courses.length > 0 && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[14px] font-medium" style={{ color: 'var(--page-text)' }}>
                          {courses.length} course{courses.length !== 1 ? 's' : ''} found
                        </p>
                      </div>
                      <motion.div
                        variants={listContainerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {courses.map((course, index) => (
                          <CourseCard key={course.course_code} course={course} index={index} />
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty State */}
                <AnimatePresence mode="wait">
                  {!isLoading && hasSearched && courses.length === 0 && !error && (
                    <motion.div
                      key="empty"
                      className="bento-card-static text-center py-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                        style={{ backgroundColor: 'var(--page-hover)' }}
                      >
                        <Search className="w-5 h-5" style={{ color: 'var(--page-text-muted)' }} />
                      </div>
                      <p className="text-[14px] font-medium mb-1" style={{ color: 'var(--page-text)' }}>
                        No courses found
                      </p>
                      <p className="text-[13px]" style={{ color: 'var(--page-text-muted)' }}>
                        Try adjusting your search or filters
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Initial State */}
                {!hasSearched && (
                  <motion.div
                    className="bento-card-static text-center py-12"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <div
                      className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: 'var(--page-primary-subtle)' }}
                    >
                      <GraduationCap className="w-7 h-7" style={{ color: 'var(--page-primary)' }} />
                    </div>
                    <p className="text-[15px] font-medium mb-1" style={{ color: 'var(--page-text)' }}>
                      Ready to explore?
                    </p>
                    <p className="text-[13px] mb-6 max-w-sm mx-auto" style={{ color: 'var(--page-text-muted)' }}>
                      Describe your ideal course using natural language
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        'Psychology without prerequisites',
                        'AI and machine learning',
                        'Writing intensive humanities',
                      ].map((example) => (
                        <motion.button
                          key={example}
                          onClick={() => setSearchQuery(example)}
                          className="text-sm font-medium px-4 py-2 rounded-md"
                          style={{
                            backgroundColor: 'var(--page-hover)',
                            color: 'var(--page-text)',
                          }}
                          whileHover={{
                            backgroundColor: 'var(--page-active)',
                          }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.1 }}
                        >
                          {example}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
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
