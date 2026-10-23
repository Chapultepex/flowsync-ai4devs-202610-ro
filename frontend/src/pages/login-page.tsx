import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/auth-layout'
import { FormField } from '@/components/form-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const errors: Record<string, string> = {}
    if (!email.trim()) errors.email = 'El email es obligatorio.'
    if (!password) errors.password = 'La contraseña es obligatoria.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      navigate('/profile', { replace: true })
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError('Ha ocurrido un error inesperado.')
      } else if (error.status === 422) {
        const { email: emailError, password: passwordError } = error.fieldErrors
        if (emailError || passwordError)
          setFieldErrors({ email: emailError, password: passwordError })
        else setFormError(error.message)
      } else if (error.status === 400 || error.status === 401) {
        setFormError('Email o contraseña incorrectos.')
      } else {
        setFormError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      description="Entra con tu email y contraseña."
      footer={
        <span>
          ¿No tienes cuenta?{' '}
          <Link to="/signup" className="text-primary underline">
            Regístrate
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <FormField
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enviando…' : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  )
}
