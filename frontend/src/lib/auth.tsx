import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import * as api from '@/lib/api'

const TOKEN_KEY = 'flowsync.token'

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Sin storage la sesión vive solo en memoria.
  }
}

type AuthContextValue = {
  token: string | null
  login: (input: { email: string; password: string }) => Promise<void>
  signup: (input: api.SignupInput) => Promise<void>
  logout: () => Promise<void>
  clearSession: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(readToken)

  const saveToken = useCallback((value: string | null) => {
    writeToken(value)
    setToken(value)
  }, [])

  const login = useCallback<AuthContextValue['login']>(
    async (input) => saveToken((await api.login(input)).token),
    [saveToken],
  )

  const signup = useCallback<AuthContextValue['signup']>(
    async (input) => saveToken((await api.signup(input)).token),
    [saveToken],
  )

  const clearSession = useCallback(() => saveToken(null), [saveToken])

  const logout = useCallback(async () => {
    if (token) await api.logout(token).catch(() => undefined)
    clearSession()
  }, [token, clearSession])

  return (
    <AuthContext.Provider
      value={{ token, login, signup, logout, clearSession }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
