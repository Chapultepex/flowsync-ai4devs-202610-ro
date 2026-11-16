import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import {
  HOY,
  cambiarEstado,
  consultar,
  crearTarea,
  listar,
  ponerFecha,
  registrar,
} from './helpers.js'

/**
 * Refuerzo de los tests del requisito «Lo que cada tarea muestra de su
 * responsable» de `openspec/specs/tasks/spec.md`.
 *
 * Los de `responsable.spec.ts` y `responsable_lista.spec.ts` comprueban que
 * `initials` exista o no esté vacía, y que el `assignee` no lleve ciertos campos.
 * Eso pasa también con iniciales equivocadas y con el email en cualquier otro
 * sitio de la respuesta. Aquí se exige el valor exacto y se mira el cuerpo
 * entero de cada respuesta de tareas.
 *
 * Aislamiento con transacción global: la suite functional usa el mismo SQLite
 * que el servidor de desarrollo.
 */

const EMAIL = 'ada@example.com'

/** Texto de la respuesta entera: si el email o la contraseña viajan, están aquí. */
function cuerpoEntero(response: { body(): unknown }) {
  return JSON.stringify(response.body())
}

test.group('Tasks | responsable, comprobaciones estrictas', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // Scenario «Responsable identificable».
  test('las iniciales del responsable son exactamente las de su nombre', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', EMAIL)
    const id = await crearTarea(client, token, 'Preparar informe')

    const response = await consultar(client, token, id)

    response.assertStatus(200)
    assert.strictEqual(response.body().data.assignee.initials, 'AL')
  })

  // Scenario «Responsable sin nombre».
  test('sin nombre, el responsable llega con nombre nulo e iniciales del email', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, null, EMAIL)
    const id = await crearTarea(client, token, 'Preparar informe')

    const response = await consultar(client, token, id)

    response.assertStatus(200)
    assert.isNull(response.body().data.assignee.fullName)
    assert.strictEqual(response.body().data.assignee.initials, 'AE')
  })

  // Scenario «Responsable sin nombre»: una cuenta cuyo nombre está en blanco no
  // tiene nombre. La interfaz muestra «Sin nombre» solo cuando llega nulo.
  for (const enBlanco of ['', '   ']) {
    test(`un nombre en blanco («${enBlanco}») llega a la tarea como nombre nulo`, async ({
      client,
      assert,
    }) => {
      await User.create({ fullName: enBlanco, email: EMAIL, password: 'secreto123' })
      const login = await client
        .post('/api/v1/auth/login')
        .json({ email: EMAIL, password: 'secreto123' })
      const token = login.body().data.token as string
      const id = await crearTarea(client, token, 'Preparar informe')

      const suelta = await consultar(client, token, id)
      const lista = await listar(client, token)

      assert.isNull(suelta.body().data.assignee.fullName)
      assert.isNull(lista.find((t) => t.id === id)?.assignee.fullName)
      assert.strictEqual(suelta.body().data.assignee.initials, 'AE')
    })
  }

  // Scenario «La tarea no filtra datos de cuenta»: ninguna respuesta de tareas
  // lleva el email ni la contraseña en ningún sitio, no solo dentro de `assignee`.
  test('ninguna respuesta de tareas lleva el email ni la contraseña en su cuerpo', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', EMAIL)
    const creada = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Preparar informe' })
    const id = (creada.body().data as unknown as { id: number }).id

    const respuestas = {
      crear: creada,
      suelta: await consultar(client, token, id),
      lista: await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`),
      estado: await cambiarEstado(client, token, id, 'in_progress'),
      fecha: await ponerFecha(client, token, id, '2026-11-30', HOY),
    }

    for (const [nombre, response] of Object.entries(respuestas)) {
      const texto = cuerpoEntero(response)
      assert.notInclude(texto, EMAIL, `${nombre}: el email viaja en la respuesta`)
      assert.notInclude(texto, 'secreto123', `${nombre}: la contraseña viaja en la respuesta`)
      assert.notInclude(texto, 'password', `${nombre}: aparece un campo de contraseña`)
      assert.notInclude(texto, 'token', `${nombre}: aparece un token`)
    }
  })
})
