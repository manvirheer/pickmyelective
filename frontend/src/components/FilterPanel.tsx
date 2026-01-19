import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, CheckCircle, Wifi, SlidersHorizontal, Check } from 'lucide-react'
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
    const isActive = filters.max_level === level
    onChange({ ...filters, max_level: isActive ? undefined : level })
  }

  const handleNoPrereqToggle = () => {
    const isActive = filters.no_prerequisites === true
    onChange({ ...filters, no_prerequisites: isActive ? undefined : true })
  }

  const handleOnlineOnlyToggle = () => {
    const isActive = filters.online_only === true
    onChange({ ...filters, online_only: isActive ? undefined : true })
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
    <motion.div
      className="bento-card-static"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--page-primary-light)' }}
            whileHover={{ scale: 1.05, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--page-primary)' }} />
          </motion.div>
          <h3
            className="font-semibold text-base"
            style={{ color: 'var(--page-text)' }}
          >
            Filters
          </h3>
        </div>
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              className="p-2 rounded-lg"
              style={{ color: 'var(--page-text-muted)' }}
              onClick={clearFilters}
              title="Reset filters"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{
                backgroundColor: 'var(--page-error-light)',
                color: 'var(--page-error)',
                rotate: -180,
              }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Campus */}
      <FilterSection title="Campus">
        <div className="pill-group">
          {CAMPUSES.map((campus, i) => (
            <TogglePill
              key={campus}
              label={campus}
              active={filters.campus?.includes(campus) || false}
              onClick={() => handleCampusToggle(campus)}
              delay={i * 0.03}
            />
          ))}
        </div>
      </FilterSection>

      {/* Course Level */}
      <FilterSection title="Course Level">
        <div className="pill-group">
          {LEVELS.map(({ value, label }, i) => (
            <TogglePill
              key={value}
              label={label}
              active={filters.max_level === value}
              onClick={() => handleLevelToggle(value)}
              delay={i * 0.03}
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
          {WQB_OPTIONS.map(({ value, label }, i) => (
            <TogglePill
              key={value}
              label={label}
              active={filters.wqb?.includes(value) || false}
              onClick={() => handleWqbToggle(value)}
              delay={i * 0.03}
            />
          ))}
        </div>
      </FilterSection>

      {/* Options Section */}
      <FilterSection title="Quick Filters" isLast>
        <div className="space-y-2">
          <QuickFilterButton
            active={filters.no_prerequisites || false}
            onClick={handleNoPrereqToggle}
            icon={<CheckCircle className="w-4 h-4" />}
            label="No prerequisites"
          />
          <QuickFilterButton
            active={filters.online_only || false}
            onClick={handleOnlineOnlyToggle}
            icon={<Wifi className="w-4 h-4" />}
            label="Online only"
          />
        </div>
      </FilterSection>
    </motion.div>
  )
}

// Helper components
function FilterSection({ title, children, isLast = false }: { title: string; children: React.ReactNode; isLast?: boolean }) {
  return (
    <motion.div
      className={isLast ? '' : 'mb-5 pb-5 border-b'}
      style={{ borderColor: 'var(--page-border)' }}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <label
        className="block font-semibold text-[15px] mb-3"
        style={{ color: 'var(--page-text)' }}
      >
        {title}
      </label>
      {children}
    </motion.div>
  )
}

function TogglePill({
  label,
  active,
  onClick,
  delay = 0,
}: {
  label: string
  active: boolean
  onClick: () => void
  delay?: number
}) {
  return (
    <motion.button
      className={`toggle-pill ${active ? 'active' : ''}`}
      onClick={onClick}
      type="button"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 400, damping: 25 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      layout
    >
      <AnimatePresence mode="wait">
        {active && (
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.15 }}
            className="mr-1"
          >
            <Check className="w-3 h-3 inline-block" />
          </motion.span>
        )}
      </AnimatePresence>
      {label}
    </motion.button>
  )
}

function QuickFilterButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <motion.button
      className={`toggle-pill highlight w-full justify-start gap-2 ${active ? 'active' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      layout
    >
      <motion.span
        animate={{ rotate: active ? 360 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {icon}
      </motion.span>
      <span>{label}</span>
      <AnimatePresence>
        {active && (
          <motion.span
            className="ml-auto"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Check className="w-4 h-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
