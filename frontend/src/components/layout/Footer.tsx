import { Heart, ExternalLink } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className="relative z-10 border-t"
      style={{
        backgroundColor: 'var(--page-surface)',
        borderColor: 'var(--page-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left side - Branding */}
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--page-text-muted)' }}>
              © {currentYear}
            </span>
            <span className="text-sm font-medium text-gradient">PickMyElective</span>
          </div>

          {/* Center - Made with love */}
          <div
            className="flex items-center gap-1.5 text-sm"
            style={{ color: 'var(--page-text-muted)' }}
          >
            <span>Made with</span>
            <Heart
              className="w-4 h-4 fill-current"
              style={{ color: 'var(--page-error)' }}
            />
            <span>for SFU students</span>
          </div>

          {/* Right side - Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.sfu.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm transition-colors duration-200"
              style={{ color: 'var(--page-text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--page-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--page-text-muted)'
              }}
            >
              <span>SFU</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
