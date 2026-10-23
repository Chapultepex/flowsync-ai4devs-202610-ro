import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const API_URL = process.env.VITE_API_URL ?? 'http://localhost:3333/api/v1'
const password = 'secret123'

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

async function signup(page: Page, email: string) {
  await page.goto('/signup')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Confirmar contraseña').fill(password)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
}

test('sin sesión, /profile redirige a /login', async ({ page }) => {
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login$/)
})

test('enlaces entre login y registro', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Regístrate' }).click()
  await expect(page).toHaveURL(/\/signup$/)
  await page.getByRole('link', { name: 'Inicia sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
})

test('el registro valida la contraseña en el cliente', async ({ page }) => {
  const apiRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().startsWith(API_URL)) apiRequests.push(request.url())
  })

  await page.goto('/signup')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.getByText('El email es obligatorio.')).toBeVisible()
  await expect(
    page.getByText('La contraseña debe tener entre 8 y 32 caracteres.'),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/signup$/)
  expect(apiRequests).toEqual([])
})

test('registro, perfil, logout y login', async ({ page }) => {
  const email = uniqueEmail()

  await signup(page, email)
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByText(email, { exact: true })).toBeVisible()
  const token = await page.evaluate(() =>
    localStorage.getItem('flowsync.token'),
  )
  expect(token).toMatch(/^oat_/)

  await page.goto('/login')
  await expect(page).toHaveURL(/\/profile$/)

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(
    await page.evaluate(() => localStorage.getItem('flowsync.token')),
  ).toBeNull()
  // El token también queda revocado en el servidor.
  const profile = await page.request.get(`${API_URL}/account/profile`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  expect(profile.status()).toBe(401)

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByText(email, { exact: true })).toBeVisible()
})

test('credenciales inválidas muestran un mensaje claro', async ({ page }) => {
  const email = uniqueEmail()
  await signup(page, email)
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill('wrongpass1')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText('Email o contraseña incorrectos.')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('un email ya registrado muestra un mensaje claro', async ({ page }) => {
  const email = uniqueEmail()
  await signup(page, email)
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await signup(page, email)
  await expect(page.getByText('Este email ya está registrado.')).toBeVisible()
  await expect(page).toHaveURL(/\/signup$/)
})
