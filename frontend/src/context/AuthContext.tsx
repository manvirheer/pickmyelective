import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  requestOtp,
  verifyOtp as verifyOtpApi,
  logout as logoutApi,
  getToken,
  getStoredEmail,
  isAuthenticated as checkAuth,
  type LoginResponse,
  type VerifyOtpResponse,
} from '@/services/auth'

interface User {
  email: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string) => Promise<LoginResponse>
  verifyOtp: (email: string, otp: string) => Promise<VerifyOtpResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false, message: '', email: '' }),
  verifyOtp: async () => ({ token: '', email: '', expiresIn: 0, success: false }),
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = getToken()
    const email = getStoredEmail()
    if (token && email) {
      setUser({ email })
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string): Promise<LoginResponse> => {
    return requestOtp(email)
  }, [])

  const verifyOtp = useCallback(async (email: string, otp: string): Promise<VerifyOtpResponse> => {
    const response = await verifyOtpApi(email, otp)
    if (response.success) {
      setUser({ email: response.email })
    }
    return response
  }, [])

  const logout = useCallback(() => {
    logoutApi()
    setUser(null)
  }, [])

  const isAuthenticated = checkAuth() && user !== null

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
