import type { QueryFilters } from '../types';

interface FilterPanelProps {
  filters: QueryFilters;
  onChange: (filters: QueryFilters) => void;
}

const CAMPUSES = ['Burnaby', 'Surrey', 'Vancouver'];
const WQB_OPTIONS = ['W', 'Q', 'B-Sci', 'B-Soc', 'B-Hum'];
const LEVELS = [100, 200, 300, 400];

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const handleCampusChange = (campus: string, checked: boolean) => {
    const current = filters.campus || [];
    const updated = checked
      ? [...current, campus]
      : current.filter((c) => c !== campus);
    onChange({ ...filters, campus: updated.length > 0 ? updated : undefined });
  };

  const handleWqbChange = (wqb: string, checked: boolean) => {
    const current = filters.wqb || [];
    const updated = checked
      ? [...current, wqb]
      : current.filter((w) => w !== wqb);
    onChange({ ...filters, wqb: updated.length > 0 ? updated : undefined });
  };

  const handleMaxLevelChange = (level: number | undefined) => {
    onChange({ ...filters, max_level: level });
  };

  const handleNoPrereqChange = (checked: boolean) => {
    onChange({ ...filters, no_prerequisites: checked || undefined });
  };

  const clearFilters = () => {
    onChange({});
  };

  const hasActiveFilters =
    (filters.campus && filters.campus.length > 0) ||
    (filters.wqb && filters.wqb.length > 0) ||
    filters.max_level !== undefined ||
    filters.no_prerequisites;

  return (
    <div className="filter-panel card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Filters</h6>
        {hasActiveFilters && (
          <button className="btn btn-sm btn-link text-decoration-none p-0" onClick={clearFilters}>
            Clear all
          </button>
        )}
      </div>
      <div className="card-body">
        {/* Campus Filter */}
        <div className="filter-section mb-3">
          <label className="form-label fw-semibold">Campus</label>
          {CAMPUSES.map((campus) => (
            <div className="form-check" key={campus}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`campus-${campus}`}
                checked={filters.campus?.includes(campus) || false}
                onChange={(e) => handleCampusChange(campus, e.target.checked)}
              />
              <label className="form-check-label" htmlFor={`campus-${campus}`}>
                {campus}
              </label>
            </div>
          ))}
        </div>

        {/* WQB Filter */}
        <div className="filter-section mb-3">
          <label className="form-label fw-semibold">WQB Designation</label>
          {WQB_OPTIONS.map((wqb) => (
            <div className="form-check" key={wqb}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`wqb-${wqb}`}
                checked={filters.wqb?.includes(wqb) || false}
                onChange={(e) => handleWqbChange(wqb, e.target.checked)}
              />
              <label className="form-check-label" htmlFor={`wqb-${wqb}`}>
                {wqb}
              </label>
            </div>
          ))}
        </div>

        {/* Max Level Filter */}
        <div className="filter-section mb-3">
          <label className="form-label fw-semibold">Max Course Level</label>
          <select
            className="form-select form-select-sm"
            value={filters.max_level || ''}
            onChange={(e) =>
              handleMaxLevelChange(e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">Any level</option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level} level and below
              </option>
            ))}
          </select>
        </div>

        {/* No Prerequisites Filter */}
        <div className="filter-section">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="no-prereqs"
              checked={filters.no_prerequisites || false}
              onChange={(e) => handleNoPrereqChange(e.target.checked)}
            />
            <label className="form-check-label fw-semibold" htmlFor="no-prereqs">
              No prerequisites only
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
