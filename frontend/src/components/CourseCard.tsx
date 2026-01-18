import { useState } from 'react'
import { CheckCircle, AlertTriangle, User, Lightbulb, BookOpen } from 'lucide-react'
import type { CourseResult } from '@/types'

interface CourseCardProps {
  course: CourseResult
  index?: number
}

export function CourseCard({ course, index = 0 }: CourseCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const shouldTruncate = course.description.length > 300

  return (
    <div
      className="bento-card mb-4 course-card-enter"
      style={{ '--card-index': index } as React.CSSProperties}
    >
      {/* Header with course code and title */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, var(--page-primary) 0%, var(--page-accent) 100%)',
              }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span
                className="font-bold text-lg"
                style={{ color: 'var(--page-primary)' }}
              >
                {course.course_code}
              </span>
              <span
                className="ml-2 text-lg font-medium"
                style={{ color: 'var(--page-text)' }}
              >
                {course.title}
              </span>
            </div>
          </div>
        </div>

        {/* Units badge in corner */}
        <div
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{
            background: 'linear-gradient(135deg, var(--page-primary) 0%, var(--page-accent) 100%)',
            color: 'white',
          }}
        >
          {course.units} units
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {course.campus.map((c: string) => (
          <span key={c} className="badge badge-secondary">{c}</span>
        ))}
        {course.wqb.filter((w: string) => w).map((w: string) => (
          <span key={w} className="badge badge-info">{w}</span>
        ))}
        {course.delivery_methods.filter((d: string) => d).map((d: string) => (
          <span key={d} className="badge badge-secondary">{d}</span>
        ))}
      </div>

      {/* Match Reason - highlight box */}
      <div className="match-reason-box mb-4">
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--page-primary-light)' }}
          >
            <Lightbulb
              className="w-4 h-4"
              style={{ color: 'var(--page-primary)' }}
            />
          </div>
          <div className="flex-1">
            <p
              className="text-[13px] font-medium uppercase tracking-wide mb-1.5"
              style={{ color: 'var(--page-text-muted)' }}
            >
              Why this matches
            </p>
            <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--page-text)' }}>
              {course.match_reason}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p
          className="text-[15px] leading-[1.7]"
          style={{ color: 'var(--page-text-muted)' }}
        >
          {isDescriptionExpanded || !shouldTruncate
            ? course.description
            : `${course.description.slice(0, 300)}...`}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="mt-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--page-primary)' }}
          >
            {isDescriptionExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex flex-wrap justify-between items-center pt-4 gap-3 border-t text-[14px] leading-relaxed"
        style={{ borderColor: 'var(--page-border)' }}
      >
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: course.has_prerequisites
              ? 'var(--page-warning-light)'
              : 'var(--page-success-light)',
          }}
        >
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

        <div className="flex items-center gap-4">
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
    </div>
  )
}
