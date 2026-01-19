import { useState } from 'react'
import { Search, Loader2, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading: boolean
  query: string
  onQueryChange: (query: string) => void
}

const SUGGESTION_TAGS = [
  'Illness and body relation',
  'European history courses',
  'Intro to coding',
]

export function SearchBar({ onSearch, isLoading, query, onQueryChange }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length >= 3) {
      onSearch(query.trim())
    }
  }

  const handleTagClick = (tag: string) => {
    onQueryChange(tag)
  }

  const canSubmit = query.trim().length >= 3 && !isLoading

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Search container */}
      <motion.div
        className="relative flex items-center gap-3 rounded-xl px-4 py-3"
        style={{
          backgroundColor: 'var(--page-surface)',
          border: '1px solid var(--page-border)',
        }}
        animate={{
          borderColor: isFocused ? 'var(--page-primary)' : 'var(--page-border)',
          boxShadow: isFocused
            ? '0 0 0 3px var(--page-primary-subtle)'
            : 'none',
        }}
        transition={{ duration: 0.15 }}
      >
        {/* Search icon */}
        <motion.div
          animate={{ color: isFocused ? 'var(--page-primary)' : 'var(--page-text-subtle)' }}
          transition={{ duration: 0.15 }}
        >
          <Search className="w-[18px] h-[18px]" />
        </motion.div>

        {/* Input */}
        <input
          type="text"
          className="flex-1 text-[15px]"
          style={{
            color: 'var(--page-text)',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
          }}
          placeholder="What kind of course are you looking for?"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading}
          minLength={3}
          maxLength={500}
        />

        {/* Submit button */}
        <motion.button
          className="btn-primary flex items-center gap-2 px-4 py-2"
          type="submit"
          disabled={!canSubmit}
          whileTap={canSubmit ? { scale: 0.98 } : undefined}
          transition={{ duration: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline text-[13px]">Searching</span>
              </motion.div>
            ) : (
              <motion.div
                key="submit"
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                <span className="text-[13px]">Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Suggestion tags */}
      <div
        className="mt-3 flex flex-wrap items-center gap-2 justify-center px-3 py-2 rounded-lg"
        style={{
          backgroundColor: 'var(--page-surface-overlay)',
          border: '1px solid var(--page-border-subtle)',
          boxShadow: 'var(--shadow-xs)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <span
          className="text-[13px]"
          style={{ color: 'var(--page-text)' }}
        >
          Try:
        </span>
        {SUGGESTION_TAGS.map((tag) => (
          <motion.button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="text-[13px] px-2.5 py-1 rounded-md"
            style={{
              color: 'var(--page-text)',
              backgroundColor: 'var(--page-surface-overlay)',
              border: '1px solid var(--page-border-strong)',
              boxShadow: 'var(--shadow-sm)',
              backdropFilter: 'blur(8px)',
            }}
            disabled={isLoading}
            whileHover={{
              backgroundColor: 'var(--page-surface-raised)',
              color: 'var(--page-text)',
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
          >
            {tag}
          </motion.button>
        ))}
      </div>
    </form>
  )
}
