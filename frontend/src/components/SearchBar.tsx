import { Search, Loader2 } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading: boolean
  query: string
  onQueryChange: (query: string) => void
}

const SUGGESTION_TAGS = [
  'I am interested in illness and body relation',
  'Looking for cool history courses related to Europe',
  'Interested in learning some coding for first time',
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
      <div className="flex items-stretch search-glow rounded-lg">
        <input
          type="text"
          className="flex-1 px-4 py-3.5 text-base rounded-l-lg border-y border-l transition-all duration-200 focus:outline-none focus:border-[var(--page-primary)] focus:ring-2 focus:ring-[var(--page-primary)]/10"
          style={{
            backgroundColor: 'var(--page-surface)',
            borderColor: 'var(--page-border)',
            color: 'var(--page-text)',
          }}
          placeholder="Describe your ideal course..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          disabled={isLoading}
          minLength={3}
          maxLength={500}
        />
        <button
          className="px-5 py-3.5 font-medium rounded-r-lg transition-all duration-200 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:brightness-95"
          style={{
            backgroundColor: 'var(--page-primary)',
            color: 'white',
          }}
          type="submit"
          disabled={isLoading || query.trim().length < 3}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Find Courses</span>
            </>
          )}
        </button>
      </div>

      {/* Clickable suggestion tags */}
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTION_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="text-sm px-3 py-1 rounded-full border transition-all duration-200 hover:border-[var(--page-primary)] hover:text-[var(--page-primary)]"
            style={{
              borderColor: 'var(--page-border)',
              color: 'var(--page-text-muted)',
              backgroundColor: 'var(--page-surface)',
            }}
            disabled={isLoading}
          >
            {tag}
          </button>
        ))}
      </div>
    </form>
  )
}
