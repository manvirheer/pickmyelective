import { Search, Loader2, ArrowRight, Sparkles } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading: boolean
  query: string
  onQueryChange: (query: string) => void
}

const SUGGESTION_TAGS = [
  { text: 'Illness and body relation', icon: '🧬' },
  { text: 'European history courses', icon: '🏛️' },
  { text: 'Intro to coding', icon: '💻' },
]

export function SearchBar({ onSearch, isLoading, query, onQueryChange }: SearchBarProps) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length >= 3) {
      onSearch(query.trim())
    }
  }

  const handleTagClick = (tag: string) => {
    onQueryChange(tag)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="search-glow relative">
        {/* Input container with integrated button */}
        <div
          className="flex items-stretch rounded-2xl overflow-hidden"
          style={{
            border: '1px solid var(--page-border)',
            backgroundColor: 'var(--page-surface)',
          }}
        >
          {/* Search icon */}
          <div className="flex items-center pl-4">
            <Search
              className="w-5 h-5"
              style={{ color: 'var(--page-text-muted)' }}
            />
          </div>

          {/* Input */}
          <input
            type="text"
            className="flex-1 px-4 py-4 text-base bg-transparent border-none outline-none transition-all duration-200"
            style={{
              color: 'var(--page-text)',
            }}
            placeholder="Describe your ideal course..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            disabled={isLoading}
            minLength={3}
            maxLength={500}
          />

          {/* Submit button */}
          <button
            className="btn-primary m-1.5 px-5 py-3 font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            type="submit"
            disabled={isLoading || query.trim().length < 3}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="hidden sm:inline">Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span className="hidden sm:inline">Find Courses</span>
                <ArrowRight className="w-4 h-4 sm:hidden" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggestion tags with better styling */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <span
          className="text-[14px] mr-2"
          style={{ color: 'var(--page-text-muted)' }}
        >
          Try:
        </span>
        {SUGGESTION_TAGS.map((tag) => (
          <button
            key={tag.text}
            type="button"
            onClick={() => handleTagClick(tag.text)}
            className="suggestion-tag flex items-center gap-1.5"
            disabled={isLoading}
          >
            <span>{tag.icon}</span>
            <span>{tag.text}</span>
          </button>
        ))}
      </div>
    </form>
  )
}
