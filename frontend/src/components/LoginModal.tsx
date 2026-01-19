import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, KeyRound, Loader2, AlertCircle, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'email' | 'otp'

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
}

const contentVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.15 },
  },
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const { login, verifyOtp } = useAuth()

  const validateEmail = (email: string): boolean => {
    return email.endsWith('@sfu.ca')
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError('Please use your @sfu.ca email address')
      return
    }

    setIsLoading(true)
    try {
      const response = await login(email)
      if (response.success) {
        setStep('otp')
      } else {
        setError(response.message || 'Failed to send OTP')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setIsLoading(true)
    try {
      const response = await verifyOtp(email, otp)
      if (response.success) {
        setShowSuccess(true)
        setTimeout(() => {
          handleClose()
          onSuccess?.()
        }, 1000)
      } else {
        setError('Invalid or expired code')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep('email')
    setEmail('')
    setOtp('')
    setError('')
    setShowSuccess(false)
    onClose()
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtp('')
    setError('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          onClick={handleClose}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.button
              onClick={handleClose}
              className="modal-close-btn"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Success overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-lg z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ backgroundColor: 'var(--page-surface)' }}
                >
                  <motion.div
                    className="text-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <motion.div
                      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: 'var(--page-success-light)' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <CheckCircle className="w-8 h-8" style={{ color: 'var(--page-success)' }} />
                    </motion.div>
                    <p className="font-semibold" style={{ color: 'var(--page-text)' }}>
                      Welcome back!
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header with gradient icon */}
            <div className="text-center mb-8">
              <motion.div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--page-primary) 0%, var(--page-accent) 100%)' }}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <AnimatePresence mode="wait">
                  {step === 'email' ? (
                    <motion.div
                      key="sparkles"
                      initial={{ opacity: 0, rotate: -180 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="key"
                      initial={{ opacity: 0, rotate: -180 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <KeyRound className="w-8 h-8 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ color: 'var(--page-text)' }}
                  >
                    {step === 'email' ? 'Welcome Back' : 'Check Your Email'}
                  </h2>
                  <p style={{ color: 'var(--page-text-muted)' }}>
                    {step === 'email'
                      ? 'Sign in with your SFU email'
                      : `We sent a code to ${email}`}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  className="mb-6 p-4 rounded-xl flex items-center gap-3"
                  style={{
                    backgroundColor: 'var(--page-error-light)',
                    border: '1px solid var(--page-error)',
                  }}
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    initial={{ rotate: -180 }}
                    animate={{ rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--page-error)' }} />
                  </motion.div>
                  <span className="text-sm" style={{ color: 'var(--page-error)' }}>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {step === 'email' ? (
                <motion.form
                  key="email-form"
                  onSubmit={handleEmailSubmit}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="mb-6">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--page-text)' }}
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                        style={{ color: 'var(--page-text-muted)' }}
                      />
                      <motion.input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@sfu.ca"
                        className="w-full pl-12 pr-4 py-4 rounded-xl border transition-all duration-200 focus:outline-none"
                        style={{
                          backgroundColor: 'var(--page-surface)',
                          borderColor: 'var(--page-border)',
                          color: 'var(--page-text)',
                        }}
                        whileFocus={{
                          borderColor: 'var(--page-primary)',
                          boxShadow: '0 0 0 4px var(--page-primary-light)',
                        }}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <p
                      className="mt-2.5 text-[13px] flex items-center gap-1.5"
                      style={{ color: 'var(--page-text-muted)' }}
                    >
                      <motion.span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: 'var(--page-success)' }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      Only @sfu.ca emails are allowed
                    </p>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || !email}
                    className="btn-primary w-full py-4 font-medium flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.span
                          key="loading"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending code...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="submit"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Continue
                          <ArrowRight className="w-5 h-5" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp-form"
                  onSubmit={handleOtpSubmit}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="mb-6">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--page-text)' }}
                    >
                      Verification code
                    </label>
                    <div className="relative">
                      <KeyRound
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                        style={{ color: 'var(--page-text-muted)' }}
                      />
                      <motion.input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full pl-12 pr-4 py-4 rounded-xl border transition-all duration-200 focus:outline-none text-center text-2xl tracking-[0.5em] font-mono"
                        style={{
                          backgroundColor: 'var(--page-surface)',
                          borderColor: 'var(--page-border)',
                          color: 'var(--page-text)',
                        }}
                        whileFocus={{
                          borderColor: 'var(--page-primary)',
                          boxShadow: '0 0 0 4px var(--page-primary-light)',
                        }}
                        disabled={isLoading}
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                    <p
                      className="mt-2.5 text-[13px]"
                      style={{ color: 'var(--page-text-muted)' }}
                    >
                      The code expires in 10 minutes
                    </p>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="btn-primary w-full py-4 font-medium flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.span
                          key="loading"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="submit"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Verify & Sign In
                          <ArrowRight className="w-5 h-5" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleBackToEmail}
                    className="w-full mt-4 py-3 text-sm font-medium rounded-xl"
                    style={{ color: 'var(--page-text-muted)' }}
                    whileHover={{
                      backgroundColor: 'var(--page-surface-hover)',
                      color: 'var(--page-text)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    disabled={isLoading}
                  >
                    Use a different email
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
