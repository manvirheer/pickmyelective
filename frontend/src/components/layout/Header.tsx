import { Sun, Moon, LogIn, LogOut, Sparkles } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'

interface HeaderProps {
  onLoginClick?: () => void
  onLogoClick?: () => void
}

export function Header({ onLoginClick, onLogoClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="glass-header sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="group flex items-center gap-2 font-bold text-xl tracking-tight transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="relative">
            <Sparkles
              className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12"
              style={{ color: 'var(--page-primary)' }}
            />
          </div>
          <span className="text-gradient">Pick</span>
          <span style={{ color: 'var(--page-text)' }}>My</span>
          <span className="text-gradient">Elective</span>
        </button>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Auth controls */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200"
                style={{
                  backgroundColor: 'var(--page-surface-hover)',
                  color: 'var(--page-text-muted)',
                  border: '1px solid var(--page-border)',
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                  style={{
                    background: 'linear-gradient(135deg, var(--page-primary) 0%, var(--page-accent) 100%)',
                    color: 'white',
                  }}
                >
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[150px] truncate">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200"
                style={{
                  border: '1px solid var(--page-border)',
                  color: 'var(--page-text-muted)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--page-error)'
                  e.currentTarget.style.color = 'var(--page-error)'
                  e.currentTarget.style.backgroundColor = 'var(--page-error-light)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--page-border)'
                  e.currentTarget.style.color = 'var(--page-text-muted)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              border: '1px solid var(--page-border)',
              backgroundColor: 'var(--page-surface)',
              color: 'var(--page-text)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--page-primary)'
              e.currentTarget.style.backgroundColor = 'var(--page-primary-light)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--page-border)'
              e.currentTarget.style.backgroundColor = 'var(--page-surface)'
            }}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
