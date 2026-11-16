import { createContext } from 'react'
import type { LoginPayload, SignupPayload, User } from '@/lib/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  user: User | null
  token: string | null
  status: AuthStatus
  /** Motivo por el que se perdió una sesión previa, para poder explicarlo. */
  sessionError: string | null
  login: (payload: LoginPayload) => Promise<void>
  signup: (payload: SignupPayload) => Promise<void>
  logout: () => Promise<void>
  /**
   * Cierra la sesión local porque el servidor ya no reconoce el token (un 401 a
   * mitad de uso) y deja dicho por qué, para que el login lo explique.
   */
  expireSession: (message: string) => void
}

/**
 * Vive en su propio fichero (sin componentes) para no chocar con la regla
 * `react/only-export-components` de oxlint.
 */
export const AuthContext = createContext<AuthContextValue | null>(null)
