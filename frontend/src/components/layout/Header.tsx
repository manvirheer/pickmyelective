import { Sun, Moon, LogIn, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <header className="glass-header sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo - minimal, clean */}
        <motion.button
          onClick={onLogoClick}
          className="flex items-center gap-1.5"
          whileHover={{ opacity: 0.7 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.1 }}
        >
          <span
            className="font-semibold text-[15px] tracking-tight"
            style={{ color: 'var(--page-text)' }}
          >
            PickMyElective
          </span>
        </motion.button>

        {/* Right side controls */}
        <div className="flex items-center gap-1">
          {/* Auth controls */}
          <AnimatePresence mode="wait">
            {isAuthenticated ? (
              <motion.div
                key="authenticated"
                className="flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* User indicator */}
                <div
                  className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px]"
                  style={{ color: 'var(--page-text-muted)' }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium"
                    style={{
                      backgroundColor: 'var(--page-primary-subtle)',
                      color: 'var(--page-primary)',
                    }}
                  >
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.email}</span>
                </div>

                {/* Logout button */}
                <motion.button
                  onClick={logout}
                  className="btn-ghost flex items-center gap-1.5 text-[13px]"
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="login"
                onClick={onLoginClick}
                className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-[13px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div
            className="w-px h-4 mx-1"
            style={{ backgroundColor: 'var(--page-border)' }}
          />

          {/* Theme Toggle - minimal */}
          <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-md"
            style={{ color: 'var(--page-text-muted)' }}
            whileHover={{ color: 'var(--page-text)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === 'light' ? (
                <motion.div
                  key="moon"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  <Moon className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.15 }}
                >
                  <Sun className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </header>
  )
}
