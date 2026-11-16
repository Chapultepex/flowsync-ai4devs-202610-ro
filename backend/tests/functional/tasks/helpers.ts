import type { ApiClient } from '@japa/api-client'

/**
 * Apoyo común de los tests functional de `tasks`. No es una suite (no acaba en
 * `.spec.ts`): solo agrupa los pasos que todos repiten.
 *
 * El cliente tipado de Japa busca la ruta en el registro por su URL y no por su
 * método, y `/api/v1/tasks` es a la vez `index` (lista) y `store` (una tarea):
 * `data` llega tipado como la unión de ambas. Por eso aquí se estrecha con
 * `as unknown as ...`, igual que en `responsable_lista.spec.ts`. Las rutas con
 * un id en la URL no encajan con ningún patrón del registro y llegan sin tipar.
 */

export type TareaDeLista = {
  id: number
  title: string
  status: string
  assignee: Record<string, unknown>
}

/** La tarea tal y como la devuelve crear: la forma de la lista, con el responsable. */
export type TareaCreada = TareaDeLista & { createdAt: string | null; updatedAt: string | null } & {
  assignee: { fullName: string | null; initials: string }
}

export const HOY = '2026-11-15'

export async function registrar(client: ApiClient, fullName: string | null, email: string) {
  const signup = await client.post('/api/v1/auth/signup').json({
    fullName,
    email,
    password: 'secreto123',
    passwordConfirmation: 'secreto123',
  })
  signup.assertStatus(200)
  return signup.body().data.token as string
}

export async function crearTarea(client: ApiClient, token: string, title: string) {
  const created = await client
    .post('/api/v1/tasks')
    .header('Authorization', `Bearer ${token}`)
    .json({ title })
  created.assertStatus(201)
  return (created.body().data as unknown as { id: number }).id
}

export function cambiarEstado(client: ApiClient, token: string, id: number, status: string) {
  return client
    .patch(`/api/v1/tasks/${id}/status`)
    .header('Authorization', `Bearer ${token}`)
    .json({ status })
}

export function ponerFecha(
  client: ApiClient,
  token: string,
  id: number,
  dueDate: string | null,
  today: string = HOY
) {
  return client
    .put(`/api/v1/tasks/${id}/due-date`)
    .header('Authorization', `Bearer ${token}`)
    .json({ dueDate, today })
}

export function consultar(client: ApiClient, token: string, id: number, today: string = HOY) {
  return client.get(`/api/v1/tasks/${id}?today=${today}`).header('Authorization', `Bearer ${token}`)
}

/** Pide la lista, acotada o no, sin dar por hecho que responda 200. */
export function pedirLista(client: ApiClient, token: string, query: string = '') {
  return client.get(`/api/v1/tasks${query}`).header('Authorization', `Bearer ${token}`)
}

/** Pide la lista y la devuelve ya con `data` estrechado. */
export async function listar(client: ApiClient, token: string, query: string = '') {
  const response = await pedirLista(client, token, query)
  response.assertStatus(200)
  return response.body().data as TareaDeLista[]
}

/** Cambia el estado dando por hecho que sale bien: es preparación, no lo que se prueba. */
export async function estadoOk(client: ApiClient, token: string, id: number, status: string) {
  const response = await cambiarEstado(client, token, id, status)
  response.assertStatus(200)
}

/** Fija la fecha dando por hecho que sale bien: es preparación, no lo que se prueba. */
export async function fechaOk(
  client: ApiClient,
  token: string,
  id: number,
  dueDate: string | null,
  today: string = HOY
) {
  const response = await ponerFecha(client, token, id, dueDate, today)
  response.assertStatus(200)
}

/** Cuántas tareas llegan en la lista por defecto. */
export async function contar(client: ApiClient, token: string, query: string = '') {
  const lista = await listar(client, token, query)
  return lista.length
}
