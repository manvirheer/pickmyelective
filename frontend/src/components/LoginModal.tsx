import { useState } from 'react'
import { X, Mail, KeyRound, Loader2, AlertCircle } from 'lucide-react'
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

        <div className="text-center mb-6">
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: 'var(--page-text)' }}
          >
            {step === 'email' ? 'Sign in to PickMyElective' : 'Enter verification code'}
          </h2>
          <p style={{ color: 'var(--page-text-muted)' }}>
            {step === 'email'
              ? 'Use your SFU email to get started'
              : `We sent a code to ${email}`}
          </p>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit}>
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--page-text)' }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: 'var(--page-text-muted)' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@sfu.ca"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:border-[var(--page-primary)] focus:ring-2 focus:ring-[var(--page-primary)]/10"
                  style={{
                    backgroundColor: 'var(--page-surface)',
                    borderColor: 'var(--page-border)',
                    color: 'var(--page-text)',
                  }}
                  disabled={isLoading}
                  required
                />
              </div>
              <p
                className="mt-1 text-xs"
                style={{ color: 'var(--page-text-muted)' }}
              >
                Only @sfu.ca emails are allowed
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
              style={{
                backgroundColor: 'var(--page-primary)',
                color: 'white',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending code...
                </>
              ) : (
                'Send verification code'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--page-text)' }}
              >
                Verification code
              </label>
              <div className="relative">
                <KeyRound
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: 'var(--page-text-muted)' }}
                />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:border-[var(--page-primary)] focus:ring-2 focus:ring-[var(--page-primary)]/10 text-center text-lg tracking-widest font-mono"
                  style={{
                    backgroundColor: 'var(--page-surface)',
                    borderColor: 'var(--page-border)',
                    color: 'var(--page-text)',
                  }}
                  disabled={isLoading}
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>
              <p
                className="mt-1 text-xs"
                style={{ color: 'var(--page-text-muted)' }}
              >
                The code expires in 10 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
              style={{
                backgroundColor: 'var(--page-primary)',
                color: 'white',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify and sign in'
              )}
            </button>

            <button
              type="button"
              onClick={handleBackToEmail}
              className="w-full mt-3 py-2 text-sm transition-colors hover:underline"
              style={{ color: 'var(--page-text-muted)' }}
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
