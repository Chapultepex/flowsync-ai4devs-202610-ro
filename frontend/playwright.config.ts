import { defineConfig } from '@playwright/test'

// Usa el Chrome instalado en la máquina (no descarga navegadores).
// Requiere el backend en marcha en http://localhost:3333.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
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
    reuseExistingServer: true,
  },
})
