import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { QueryLimitProvider } from '@/context/QueryLimitContext'
import './globals.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <QueryLimitProvider>
          <App />
        </QueryLimitProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
