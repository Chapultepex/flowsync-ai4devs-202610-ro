import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/auth-layout'
import { FormField } from '@/components/form-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Values = {
  fullName: string
  email: string
  password: string
  passwordConfirmation: string
}

// Replica las reglas de backend/app/validators/user.ts.
function validate(values: Values) {
  const errors: Record<string, string> = {}
  if (!values.email) errors.email = 'El email es obligatorio.'
  else if (!EMAIL_PATTERN.test(values.email) || values.email.length > 254)
    errors.email = 'Introduce un email válido.'
  if (values.password.length < 8 || values.password.length > 32)
    errors.password = 'La contraseña debe tener entre 8 y 32 caracteres.'
  if (values.passwordConfirmation !== values.password)
    errors.passwordConfirmation = 'Las contraseñas no coinciden.'
  return errors
}

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState<Values>({
    fullName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof Values) {
    return (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const normalized = { ...values, email: values.email.trim() }
    const errors = validate(normalized)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      await signup({
        fullName: normalized.fullName.trim() || null,
        email: normalized.email,
        password: normalized.password,
        passwordConfirmation: normalized.passwordConfirmation,
      })
      navigate('/profile', { replace: true })
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError('Ha ocurrido un error inesperado.')
      } else if (error.status === 422) {
        const next: Record<string, string> = {}
        for (const field of Object.keys(values)) {
          if (error.fieldErrors[field]) next[field] = error.fieldErrors[field]
        }
        if (error.fieldRules.email === 'database.unique')
          next.email = 'Este email ya está registrado.'
        if (Object.keys(next).length > 0) setFieldErrors(next)
        else setFormError(error.message)
      } else {
        setFormError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      description="Regístrate con tu email y una contraseña."
      footer={
        <span>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary underline">
            Inicia sesión
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
          id="fullName"
          label="Nombre (opcional)"
          autoComplete="name"
          value={values.fullName}
          onChange={update('fullName')}
          error={fieldErrors.fullName}
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={update('email')}
          error={fieldErrors.email}
        />
        <FormField
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          required
          value={values.password}
          onChange={update('password')}
          error={fieldErrors.password}
        />
        <FormField
          id="passwordConfirmation"
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          required
          value={values.passwordConfirmation}
          onChange={update('passwordConfirmation')}
          error={fieldErrors.passwordConfirmation}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enviando…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthLayout>
  )
}
