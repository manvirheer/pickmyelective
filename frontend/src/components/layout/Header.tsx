import { Sun, Moon, LogIn, LogOut, User } from 'lucide-react'
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
    <header
      className="sticky top-0 z-50 border-b transition-colors duration-300"
      style={{
        backgroundColor: 'var(--page-bg)',
        borderColor: 'var(--page-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
        >
          <span style={{ color: 'var(--page-primary)' }}>Pick</span>
          <span style={{ color: 'var(--page-text)' }}>My</span>
          <span style={{ color: 'var(--page-primary)' }}>Elective</span>
        </button>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Auth controls */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--page-surface)',
                  color: 'var(--page-text-muted)',
                }}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all duration-200 hover:border-red-500 hover:text-red-500"
                style={{
                  borderColor: 'var(--page-border)',
                  color: 'var(--page-text-muted)',
                }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-110"
              style={{
                backgroundColor: 'var(--page-primary)',
                color: 'white',
              }}
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              borderColor: 'var(--page-border)',
              backgroundColor: 'var(--page-surface)',
              color: 'var(--page-text)',
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
