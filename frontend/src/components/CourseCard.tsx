import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, User, Lightbulb, BookOpen, ChevronDown } from 'lucide-react'
import type { CourseResult } from '@/types'

interface CourseCardProps {
  course: CourseResult
  index?: number
}

// Variant for staggered list animation
export const courseCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
    },
  }),
}

export function CourseCard({ course, index = 0 }: CourseCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const shouldTruncate = course.description.length > 300

  return (
    <motion.div
      className="bento-card mb-4"
      variants={courseCardVariants}
      custom={index}
      whileHover={{
        y: -4,
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        borderColor: 'var(--page-border-strong)',
      }}
      transition={{ duration: 0.2 }}
      layout
    >
      {/* Header with course code and title */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, var(--page-primary) 0%, var(--page-accent) 100%)',
              }}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </motion.div>
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
        <motion.div
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{
            background: 'linear-gradient(135deg, var(--page-primary) 0%, var(--page-accent) 100%)',
            color: 'white',
          }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {course.units} units
        </motion.div>
      </div>

      {/* Badges row with stagger */}
      <motion.div
        className="flex flex-wrap gap-2 mb-4"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.03 } },
        }}
      >
        {course.campus.map((c: string) => (
          <motion.span
            key={c}
            className="badge badge-secondary"
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              visible: { opacity: 1, scale: 1 },
            }}
          >
            {c}
          </motion.span>
        ))}
        {course.wqb.filter((w: string) => w).map((w: string) => (
          <motion.span
            key={w}
            className="badge badge-info"
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              visible: { opacity: 1, scale: 1 },
            }}
          >
            {w}
          </motion.span>
        ))}
        {course.delivery_methods.filter((d: string) => d).map((d: string) => (
          <motion.span
            key={d}
            className="badge badge-secondary"
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              visible: { opacity: 1, scale: 1 },
            }}
          >
            {d}
          </motion.span>
        ))}
      </motion.div>

      {/* Match Reason - highlight box */}
      <motion.div
        className="match-reason-box mb-4"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <motion.div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--page-primary-light)' }}
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{
              duration: 0.5,
              delay: 0.5,
              ease: 'easeInOut',
            }}
          >
            <Lightbulb
              className="w-4 h-4"
              style={{ color: 'var(--page-primary)' }}
            />
          </motion.div>
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
      </motion.div>

      {/* Description with expand/collapse animation */}
      <div className="mb-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={isDescriptionExpanded ? 'full' : 'truncated'}
            className="text-[15px] leading-[1.7]"
            style={{ color: 'var(--page-text-muted)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {isDescriptionExpanded || !shouldTruncate
              ? course.description
              : `${course.description.slice(0, 300)}...`}
          </motion.p>
        </AnimatePresence>
        {shouldTruncate && (
          <motion.button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="mt-2 text-sm font-medium flex items-center gap-1"
            style={{ color: 'var(--page-primary)' }}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {isDescriptionExpanded ? 'Show less' : 'Read more'}
            <motion.span
              animate={{ rotate: isDescriptionExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          </motion.button>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex flex-wrap justify-between items-center pt-4 gap-3 border-t text-[14px] leading-relaxed"
        style={{ borderColor: 'var(--page-border)' }}
      >
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: course.has_prerequisites
              ? 'var(--page-warning-light)'
              : 'var(--page-success-light)',
          }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
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
        </motion.div>

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
    </motion.div>
  )
}
