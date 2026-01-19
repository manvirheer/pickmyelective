/**
 * Motion Utilities - Reusable animation components and variants
 * Based on the UI Redesign Principles for premium modern experience
 */

import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

/**
 * Staggered container for lists - children animate in sequence
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
}

/**
 * Item variant for staggered lists - fade up effect
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
    },
  },
}

/**
 * Fade in variant for simple appearance animations
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
}

/**
 * Scale fade variant for modals and overlays
 */
export const scaleFade: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
}

/**
 * Slide up variant for bottom sheets and panels
 */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: 0.15 },
  },
}

// =============================================================================
// SPRING PRESETS
// =============================================================================

export const springPresets = {
  /** Snappy, responsive feel */
  snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
  /** Gentle, smooth movement */
  gentle: { type: 'spring' as const, stiffness: 300, damping: 25 },
  /** Quick bounce for buttons */
  bounce: { type: 'spring' as const, stiffness: 400, damping: 17 },
}

// =============================================================================
// MOTION COMPONENTS
// =============================================================================

interface StaggerListProps {
  children: ReactNode
  className?: string
}

/**
 * Container that staggers its children's entrance animations
 */
export function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

/**
 * Item within a StaggerList - auto-animates with parent
 */
export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}

// Re-export framer-motion essentials for convenience
export { motion, AnimatePresence } from 'framer-motion'
export type { Variants } from 'framer-motion'
