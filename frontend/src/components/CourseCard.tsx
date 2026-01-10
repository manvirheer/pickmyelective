import type { CourseResult } from '../types';

interface CourseCardProps {
  course: CourseResult;
}

export function CourseCard({ course }: CourseCardProps) {
  const relevancePercent = Math.round(course.relevance_score * 100);

  const getRelevanceColor = (score: number) => {
    if (score >= 0.7) return 'bg-success';
    if (score >= 0.5) return 'bg-warning';
    return 'bg-secondary';
  };

  return (
    <div className="course-card card mb-3">
      <div className="card-body">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h5 className="card-title mb-1">
              <span className="fw-bold text-primary">{course.course_code}</span>
              <span className="mx-2">-</span>
              {course.title}
            </h5>
            <div className="d-flex flex-wrap gap-1 mb-2">
              {course.campus.map((c) => (
                <span key={c} className="badge bg-secondary">{c}</span>
              ))}
              {course.wqb.filter(w => w).map((w) => (
                <span key={w} className="badge bg-info text-dark">{w}</span>
              ))}
              <span className="badge bg-dark">{course.units} units</span>
              {course.delivery_methods.filter(d => d).map((d) => (
                <span key={d} className="badge bg-outline-secondary border">{d}</span>
              ))}
            </div>
          </div>
          <div className="text-end">
            <div className="relevance-score">
              <small className="text-muted d-block">Match</small>
              <span className={`badge ${getRelevanceColor(course.relevance_score)} fs-6`}>
                {relevancePercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Match Reason */}
        <div className="match-reason alert alert-light py-2 mb-2">
          <small>
            <i className="bi bi-lightbulb me-1"></i>
            <strong>Why this matches:</strong> {course.match_reason}
          </small>
        </div>

        {/* Description */}
        <p className="card-text text-muted small mb-2">
          {course.description.length > 300
            ? `${course.description.slice(0, 300)}...`
            : course.description}
        </p>

        {/* Footer info */}
        <div className="d-flex justify-content-between align-items-center text-muted small">
          <div>
            {course.has_prerequisites ? (
              <span className="text-warning">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Prerequisites: {course.prerequisites || 'Required'}
              </span>
            ) : (
              <span className="text-success">
                <i className="bi bi-check-circle me-1"></i>
                No prerequisites
              </span>
            )}
          </div>
          {course.instructor && (
            <div>
              <i className="bi bi-person me-1"></i>
              {course.instructor}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
