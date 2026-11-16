import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { HOY, crearTarea, registrar } from './helpers.js'

/**
 * Requisito «Consulta de una tarea suelta» de `openspec/specs/tasks/spec.md`:
 * un identificador que no corresponde a ninguna tarea responde `404`.
 *
 * El id llega a la ruta como texto y SQLite lo compara con una columna entera,
 * así que `5e0` o `05` pueden acabar siendo la tarea 5. Los tests parten de una
 * tarea real y piden variantes de su mismo número que no son su identificador.
 *
 * Aislamiento con transacción global: la suite functional usa el mismo SQLite
 * que el servidor de desarrollo.
 */
test.group('Tasks | identificador de la tarea', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // Scenario «Tarea que no existe».
  test('un identificador que no es un número responde 404', async ({ client }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')

    const response = await client
      .get(`/api/v1/tasks/abc?today=${HOY}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })

  // Scenario «Tarea que no existe».
  test('un identificador numérico sin tarea responde 404', async ({ client }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')

    const response = await client
      .get(`/api/v1/tasks/99999999?today=${HOY}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })

  // Scenario «Tarea que no existe»: el mismo número escrito en notación
  // científica no es el identificador de la tarea.
  test('el id de una tarea en notación científica no la abre', async ({ client }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')
    const id = await crearTarea(client, token, 'Preparar informe')

    const response = await client
      .get(`/api/v1/tasks/${id}e0?today=${HOY}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })

  // Scenario «Tarea que no existe»: el mismo número con ceros delante tampoco.
  test('el id de una tarea con ceros delante no la abre', async ({ client }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')
    const id = await crearTarea(client, token, 'Preparar informe')

    const response = await client
      .get(`/api/v1/tasks/0${id}?today=${HOY}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })

  // Scenario «Tarea inexistente», al cambiar el estado con un id mal formado.
  test('cambiar el estado con un id que no es un número responde 404', async ({ client }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')

    const response = await client
      .patch('/api/v1/tasks/abc/status')
      .header('Authorization', `Bearer ${token}`)
      .json({ status: 'done' })

    response.assertStatus(404)
  })

  // Scenario «Falta el día de referencia».
  test('consultar una tarea sin `today` responde 422 sobre ese parámetro', async ({ client }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')
    const id = await crearTarea(client, token, 'Preparar informe')

    const response = await client
      .get(`/api/v1/tasks/${id}`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'today' }] })
  })
})
