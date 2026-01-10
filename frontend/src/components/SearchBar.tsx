import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <div className="input-group input-group-lg">
        <input
          type="text"
          className="form-control"
          placeholder="Describe your ideal course... (e.g., 'easy psychology course' or 'AI and machine learning')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          minLength={3}
          maxLength={500}
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={isLoading || query.trim().length < 3}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Searching...
            </>
          ) : (
            <>
              <i className="bi bi-search me-2"></i>
              Find Courses
            </>
          )}
        </button>
      </div>
      <small className="text-muted mt-1 d-block">
        Try: "easy bird course", "interesting humanities course", "no prerequisites computer science"
      </small>
    </form>
  );
}
