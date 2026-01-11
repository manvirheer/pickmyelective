import { CheckCircle, AlertTriangle, User, Lightbulb } from 'lucide-react'
import type { CourseResult } from '@/types'

interface CourseCardProps {
  course: CourseResult
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="bento-card mb-4">
      {/* Header */}
      <h4 className="font-semibold text-lg mb-2">
        <span
          className="font-bold"
          style={{ color: 'var(--page-primary)' }}
        >
          {course.course_code}
        </span>
        <span
          className="mx-2 font-normal"
          style={{ color: 'var(--page-text-muted)' }}
        >
          -
        </span>
        <span style={{ color: 'var(--page-text)' }}>{course.title}</span>
      </h4>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {course.campus.map((c: string) => (
          <span key={c} className="badge badge-secondary">{c}</span>
        ))}
        {course.wqb.filter((w: string) => w).map((w: string) => (
          <span key={w} className="badge badge-info">{w}</span>
        ))}
        <span className="badge badge-dark">{course.units} units</span>
        {course.delivery_methods.filter((d: string) => d).map((d: string) => (
          <span key={d} className="badge badge-secondary">{d}</span>
        ))}
      </div>

      {/* Match Reason */}
      <div
        className="rounded-lg p-4 mb-4 border-l-4"
        style={{
          background: 'var(--card-match-bg)',
          borderLeftColor: 'var(--card-match-border)',
        }}
      >
        <div className="flex items-start gap-2.5">
          <Lightbulb
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            style={{ color: 'var(--page-primary)' }}
          />
          <p className="text-sm leading-relaxed" style={{ color: 'var(--page-text)' }}>
            <strong>Why this matches:</strong> {course.match_reason}
          </p>
        </div>
      </div>

      {/* Description */}
      <p
        className="text-sm mb-4 leading-relaxed"
        style={{ color: 'var(--page-text-muted)' }}
      >
        {course.description.length > 300
          ? `${course.description.slice(0, 300)}...`
          : course.description}
      </p>

      {/* Footer */}
      <div
        className="flex justify-between items-center pt-4 border-t text-sm"
        style={{ borderColor: 'var(--page-border)' }}
      >
        <div className="flex items-center gap-2">
          {course.has_prerequisites ? (
            <>
              <AlertTriangle className="w-4 h-4" style={{ color: 'var(--page-warning)' }} />
              <span style={{ color: 'var(--page-warning)' }}>
                Prerequisites: {course.prerequisites || 'Required'}
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--page-success)' }} />
              <span style={{ color: 'var(--page-success)' }}>No prerequisites</span>
            </>
          )}
        </div>
        {course.instructor && (
          <div
            className="flex items-center gap-2"
            style={{ color: 'var(--page-text-muted)' }}
          >
            <User className="w-4 h-4" />
            <span>{course.instructor}</span>
          </div>
        )}
      </div>
    </div>
  )
}
