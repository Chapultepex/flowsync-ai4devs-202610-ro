const API_URL = process.env.VITE_API_URL ?? 'http://localhost:3333/api/v1'

// Falla rápido y con un mensaje claro si el backend no está en marcha,
// en lugar de dejar que cada test agote su timeout.
export default async function globalSetup() {
  try {
    await fetch(`${API_URL}/account/profile`)
  } catch {
    throw new Error(
      `No se pudo conectar con el backend en ${API_URL}. Arráncalo con "cd backend && npm run dev".`,
    )
  }
}
