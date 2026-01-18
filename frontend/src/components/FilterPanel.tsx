import { RotateCcw, CheckCircle, Wifi, SlidersHorizontal } from 'lucide-react'
import type { QueryFilters } from '@/types'

interface FilterPanelProps {
  filters: QueryFilters
  onChange: (filters: QueryFilters) => void
}

const CAMPUSES = ['Burnaby', 'Surrey', 'Vancouver']
const WQB_OPTIONS = [
  { value: 'W', label: 'W' },
  { value: 'Q', label: 'Q' },
  { value: 'B-Sci', label: 'B-Sci' },
  { value: 'B-Soc', label: 'B-Soc' },
  { value: 'B-Hum', label: 'B-Hum' },
]
const LEVELS = [
  { value: 100, label: '1XX' },
  { value: 200, label: '2XX' },
  { value: 300, label: '3XX' },
]

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const handleCampusToggle = (campus: string) => {
    const current = filters.campus || []
    const isActive = current.includes(campus)
    const updated = isActive
      ? current.filter((c: string) => c !== campus)
      : [...current, campus]
    onChange({ ...filters, campus: updated.length > 0 ? updated : undefined })
  }

  const handleWqbToggle = (wqb: string) => {
    const current = filters.wqb || []
    const isActive = current.includes(wqb)
    const updated = isActive
      ? current.filter((w: string) => w !== wqb)
      : [...current, wqb]
    onChange({ ...filters, wqb: updated.length > 0 ? updated : undefined })
  }

  const handleLevelToggle = (level: number) => {
    // Toggle: if already selected, deselect; otherwise select
    const isActive = filters.max_level === level
    onChange({ ...filters, max_level: isActive ? undefined : level })
  }

  const handleNoPrereqToggle = () => {
    onChange({ ...filters, no_prerequisites: !filters.no_prerequisites || undefined })
  }

  const handleOnlineOnlyToggle = () => {
    onChange({ ...filters, online_only: !filters.online_only || undefined })
  }

  const clearFilters = () => {
    onChange({})
  }

  const hasActiveFilters =
    (filters.campus && filters.campus.length > 0) ||
    (filters.wqb && filters.wqb.length > 0) ||
    filters.max_level !== undefined ||
    filters.no_prerequisites ||
    filters.online_only

  return (
    <div className="bento-card-static">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--page-primary-light)' }}
          >
            <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--page-primary)' }} />
          </div>
          <h3
            className="font-semibold text-base"
            style={{ color: 'var(--page-text)' }}
          >
            Filters
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: 'var(--page-text-muted)' }}
            onClick={clearFilters}
            title="Reset filters"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--page-error-light)'
              e.currentTarget.style.color = 'var(--page-error)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--page-text-muted)'
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Campus */}
      <FilterSection title="Campus">
        <div className="pill-group">
          {CAMPUSES.map((campus) => (
            <TogglePill
              key={campus}
              label={campus}
              active={filters.campus?.includes(campus) || false}
              onClick={() => handleCampusToggle(campus)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Course Level */}
      <FilterSection title="Course Level">
        <div className="pill-group">
          {LEVELS.map(({ value, label }) => (
            <TogglePill
              key={value}
              label={label}
              active={filters.max_level === value}
              onClick={() => handleLevelToggle(value)}
            />
          ))}
        </div>
        <p
          className="text-[13px] mt-2.5 leading-relaxed"
          style={{ color: 'var(--page-text-muted)' }}
        >
          Select max course level
        </p>
      </FilterSection>

      {/* WQB Designations */}
      <FilterSection title="Designations">
        <div className="pill-group">
          {WQB_OPTIONS.map(({ value, label }) => (
            <TogglePill
              key={value}
              label={label}
              active={filters.wqb?.includes(value) || false}
              onClick={() => handleWqbToggle(value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Options Section */}
      <FilterSection title="Quick Filters" isLast>
        <div className="space-y-2">
          <button
            className={`toggle-pill highlight w-full justify-start gap-2 ${filters.no_prerequisites ? 'active' : ''}`}
            onClick={handleNoPrereqToggle}
          >
            <CheckCircle className="w-4 h-4" />
            <span>No prerequisites</span>
          </button>
          <button
            className={`toggle-pill highlight w-full justify-start gap-2 ${filters.online_only ? 'active' : ''}`}
            onClick={handleOnlineOnlyToggle}
          >
            <Wifi className="w-4 h-4" />
            <span>Online only</span>
          </button>
        </div>
      </FilterSection>
    </div>
  )
}

// Helper components
function FilterSection({ title, children, isLast = false }: { title: string; children: React.ReactNode; isLast?: boolean }) {
  return (
    <div className={isLast ? '' : 'mb-5 pb-5 border-b'} style={{ borderColor: 'var(--page-border)' }}>
      <label
        className="block font-semibold text-[15px] mb-3"
        style={{ color: 'var(--page-text)' }}
      >
        {title}
      </label>
      {children}
    </div>
  )
}

function TogglePill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`toggle-pill ${active ? 'active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
