const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1'

export type User = {
  id: number
  fullName: string | null
  email: string
  initials: string
  createdAt: string
  updatedAt: string | null
}

type AuthPayload = { user: User; token: string }

type BackendError = { field?: string; rule?: string; message?: string }

export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>
  fieldRules: Record<string, string>

  constructor(status: number, message: string, errors: BackendError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = {}
    this.fieldRules = {}
    for (const error of errors) {
      if (!error.field || this.fieldErrors[error.field]) continue
      this.fieldErrors[error.field] = error.message ?? ''
      this.fieldRules[error.field] = error.rule ?? ''
    }
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  token?: string | null
}

async function request<T>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}/${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor.')
  }

  const json = await response.json().catch(() => null)

  if (!response.ok) {
    const errors: BackendError[] = Array.isArray(json?.errors)
      ? json.errors
      : []
    const message =
      errors[0]?.message ?? json?.message ?? 'Ha ocurrido un error inesperado.'
    throw new ApiError(response.status, message, errors)
  }

  return (json && 'data' in json ? json.data : json) as T
}

export type SignupInput = {
  fullName: string | null
  email: string
  password: string
  passwordConfirmation: string
}

export function signup(input: SignupInput) {
  return request<AuthPayload>('auth/signup', { method: 'POST', body: input })
}

export function login(input: { email: string; password: string }) {
  return request<AuthPayload>('auth/login', { method: 'POST', body: input })
}

export function getProfile(token: string) {
  return request<User>('account/profile', { token })
}

export function logout(token: string) {
  return request<{ message: string }>('account/logout', {
    method: 'POST',
    token,
  })
}
