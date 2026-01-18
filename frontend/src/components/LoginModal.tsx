import { useState } from 'react'
import { X, Mail, KeyRound, Loader2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'email' | 'otp'

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
        handleClose()
        onSuccess?.()
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
    onClose()
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtp('')
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className="modal-close-btn">
          <X className="w-5 h-5" />
        </button>

        {/* Header with gradient icon */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--page-primary) 0%, var(--page-accent) 100%)' }}
          >
            {step === 'email' ? (
              <Sparkles className="w-8 h-8 text-white" />
            ) : (
              <KeyRound className="w-8 h-8 text-white" />
            )}
          </div>
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
        </div>

        {error && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: 'var(--page-error-light)',
              border: '1px solid var(--page-error)',
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--page-error)' }} />
            <span className="text-sm" style={{ color: 'var(--page-error)' }}>{error}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit}>
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
                <input
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
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--page-primary)'
                    e.currentTarget.style.boxShadow = '0 0 0 4px var(--page-primary-light)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--page-border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  disabled={isLoading}
                  required
                />
              </div>
              <p
                className="mt-2.5 text-[13px] flex items-center gap-1.5"
                style={{ color: 'var(--page-text-muted)' }}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--page-success)' }} />
                Only @sfu.ca emails are allowed
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="btn-primary w-full py-4 font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending code...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
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
                <input
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
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--page-primary)'
                    e.currentTarget.style.boxShadow = '0 0 0 4px var(--page-primary-light)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--page-border)'
                    e.currentTarget.style.boxShadow = 'none'
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

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="btn-primary w-full py-4 font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBackToEmail}
              className="w-full mt-4 py-3 text-sm font-medium rounded-xl transition-all duration-200"
              style={{ color: 'var(--page-text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--page-surface-hover)'
                e.currentTarget.style.color = 'var(--page-text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--page-text-muted)'
              }}
              disabled={isLoading}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
