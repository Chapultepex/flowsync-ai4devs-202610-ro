import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient } from '@japa/api-client'
import { emailUnico } from './helpers.js'

const ADA = emailUnico('ada')
const GRACE = emailUnico('grace')
const SIN_NOMBRE = emailUnico('sin-nombre')

/**
 * Requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`, en la otra mitad del contrato: la lista y
 * los datos de acceso.
 *
 * `responsable.spec.ts` comprueba la tarea suelta. El scenario «La tarea no
 * filtra datos de cuenta» habla de «cualquier tarea, suelta o dentro de la
 * lista», y los otros dos también valen para la lista, que es donde el
 * responsable se lee en la práctica. Aquí se cubre lo que allí no se toca, con
 * un test por scenario y vía.
 *
 * Aislamiento con transacción global, igual que en `auth/signup.spec.ts`: la
 * suite functional usa el mismo SQLite que el servidor de desarrollo.
 */

/** Campos de cuenta que no pueden viajar junto a una tarea. */
const DATOS_DE_CUENTA = [
  'email',
  'password',
  'token',
  'rememberMeToken',
  'createdAt',
  'updatedAt',
] as const

async function registrar(client: ApiClient, fullName: string | null, email: string) {
  const signup = await client.post('/api/v1/auth/signup').json({
    fullName,
    email,
    password: 'secreto123',
    passwordConfirmation: 'secreto123',
  })
  signup.assertStatus(200)
  return signup.body().data.token as string
}

async function crearTarea(client: ApiClient, token: string, title: string) {
  const created = await client
    .post('/api/v1/tasks')
    .header('Authorization', `Bearer ${token}`)
    .json({ title })
  created.assertStatus(201)
  // El registro tipado de Tuyau devuelve la unión de `show` y `index` para `data`.
  return (created.body().data as unknown as { id: number }).id
}

async function listar(client: ApiClient, token: string) {
  const list = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)
  list.assertStatus(200)
  return list.body().data as Array<{ id: number; assignee: Record<string, unknown> }>
}

test.group('Tasks | responsable de la tarea en la lista', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // Scenario «Responsable identificable», vía lista.
  test('la lista muestra el nombre y las iniciales del responsable', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')

    const lista = await listar(client, token)
    const tarea = lista.find((t) => t.id === id)

    assert.isDefined(tarea)
    assert.equal(tarea!.assignee.fullName, 'Ada Lovelace')
    assert.equal(tarea!.assignee.initials, 'AL')
  })

  // «Esos datos bastan para saber quién la lleva»: cada fila lleva a su dueño,
  // también cuando la tarea es de otra persona.
  test('cada tarea de la lista lleva a su propio responsable', async ({ client, assert }) => {
    const ada = await registrar(client, 'Ada Lovelace', ADA)
    const grace = await registrar(client, 'Grace Hopper', GRACE)
    const deAda = await crearTarea(client, ada, 'Preparar informe')
    const deGrace = await crearTarea(client, grace, 'Revisar el compilador')

    const lista = await listar(client, ada)

    assert.equal(lista.find((t) => t.id === deAda)!.assignee.fullName, 'Ada Lovelace')
    assert.equal(lista.find((t) => t.id === deAda)!.assignee.initials, 'AL')
    assert.equal(lista.find((t) => t.id === deGrace)!.assignee.fullName, 'Grace Hopper')
    assert.equal(lista.find((t) => t.id === deGrace)!.assignee.initials, 'GH')
  })

  // Scenario «La tarea no filtra datos de cuenta», vía tarea suelta.
  test('la tarea suelta no incluye ningún dato de acceso de la cuenta', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')

    const response = await client
      .get(`/api/v1/tasks/${id}?today=2026-11-10`)
      .header('Authorization', `Bearer ${token}`)
    response.assertStatus(200)

    for (const campo of DATOS_DE_CUENTA) {
      assert.notProperty(response.body().data.assignee, campo)
    }
  })

  // Scenario «La tarea no filtra datos de cuenta», vía lista.
  test('la lista no incluye ningún dato de acceso de la cuenta', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    await crearTarea(client, token, 'Preparar informe')

    const lista = await listar(client, token)

    assert.isNotEmpty(lista)
    for (const tarea of lista) {
      for (const campo of DATOS_DE_CUENTA) {
        assert.notProperty(tarea.assignee, campo)
      }
    }
  })

  // Scenario «Responsable sin nombre», vía lista.
  test('un responsable sin nombre llega a la lista con nombre nulo e iniciales', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, null, SIN_NOMBRE)
    const id = await crearTarea(client, token, 'Preparar informe')

    const lista = await listar(client, token)
    const tarea = lista.find((t) => t.id === id)

    assert.isDefined(tarea)
    assert.isNull(tarea!.assignee.fullName)
    assert.isString(tarea!.assignee.initials)
    assert.isAbove((tarea!.assignee.initials as string).length, 0)
  })
})
