import { useState } from 'react';
import './App.css';
import { SearchBar, FilterPanel, CourseCard } from './components';
import { getRecommendations } from './services/api';
import type { QueryFilters, CourseResult } from './types';

function App() {
  const [filters, setFilters] = useState<QueryFilters>({});
  const [courses, setCourses] = useState<CourseResult[]>([]);
  const [interpretation, setInterpretation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await getRecommendations({
        query,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        top_k: 5,
        min_relevance: 0.3,
      });

      setCourses(response.courses);
      setInterpretation(response.query_interpretation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCourses([]);
      setInterpretation('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="container py-4">
        {/* Header */}
        <header className="text-center mb-4">
          <h1 className="display-4 fw-bold text-white">PickMyElective</h1>
          <p className="lead text-white-50">
            Find the perfect SFU elective using AI-powered recommendations
          </p>
        </header>

        {/* Search Bar */}
        <div className="row justify-content-center mb-4">
          <div className="col-lg-10">
            <div className="search-container bg-white rounded-3 p-4 shadow">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="row justify-content-center">
          {/* Filters Sidebar */}
          <div className="col-lg-3 col-md-4 mb-4">
            <FilterPanel filters={filters} onChange={setFilters} />
          </div>

          {/* Results */}
          <div className="col-lg-7 col-md-8">
            {/* Error State */}
            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {/* Query Interpretation */}
            {interpretation && !error && (
              <div className="alert alert-info mb-3" role="alert">
                <i className="bi bi-chat-dots me-2"></i>
                <strong>Understanding your request:</strong> {interpretation}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Finding the best courses for you...</p>
              </div>
            )}

            {/* Results */}
            {!isLoading && courses.length > 0 && (
              <div className="results-section">
                <h5 className="text-white mb-3">
                  Found {courses.length} matching course{courses.length !== 1 ? 's' : ''}
                </h5>
                {courses.map((course) => (
                  <CourseCard key={course.course_code} course={course} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && hasSearched && courses.length === 0 && !error && (
              <div className="text-center py-5">
                <div className="empty-state bg-white rounded-3 p-5 shadow-sm">
                  <i className="bi bi-search display-1 text-muted"></i>
                  <h4 className="mt-3">No courses found</h4>
                  <p className="text-muted">
                    Try adjusting your search terms or removing some filters.
                  </p>
                </div>
              </div>
            )}

            {/* Initial State */}
            {!hasSearched && (
              <div className="text-center py-5">
                <div className="initial-state bg-white rounded-3 p-5 shadow-sm">
                  <i className="bi bi-mortarboard display-1 text-primary"></i>
                  <h4 className="mt-3">Ready to find your perfect elective?</h4>
                  <p className="text-muted">
                    Describe what you're looking for in natural language. Our AI will find courses that match your interests.
                  </p>
                  <div className="mt-3">
                    <small className="text-muted">
                      <strong>Example searches:</strong><br />
                      "easy psychology course with no prerequisites"<br />
                      "interesting AI and machine learning courses"<br />
                      "writing intensive humanities breadth requirement"
                    </small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
