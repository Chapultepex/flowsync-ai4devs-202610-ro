import { defineConfig } from '@playwright/test'

const isCI = !!process.env.CI

// Usa el Chrome instalado en la máquina (no descarga navegadores).
// Requiere el backend en marcha en http://localhost:3333.
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    trace: 'retain-on-failure',
    // SLOWMO=500 npm run test:e2e:headed para seguir los pasos a ojo.
    launchOptions: { slowMo: Number(process.env.SLOWMO ?? 0) },
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !isCI,
  },
})
