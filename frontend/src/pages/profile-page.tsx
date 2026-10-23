import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ApiError, getProfile } from '@/lib/api'
import type { User } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export function ProfilePage() {
  const { token, logout, clearSession } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getProfile(token)
      .then((profile) => {
        if (!cancelled) setUser(profile)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          clearSession()
          navigate('/login', { replace: true })
        } else {
          setError(
            err instanceof ApiError
              ? err.message
              : 'No se pudo cargar el perfil.',
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [token, clearSession, navigate])

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Tu perfil</CardTitle>
          <CardDescription>Datos de tu cuenta en FlowSync.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : user ? (
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
                {user.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {user.fullName ?? 'Sin nombre'}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
