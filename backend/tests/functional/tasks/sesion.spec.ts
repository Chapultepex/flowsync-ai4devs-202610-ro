import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Task from '#models/task'
import { HOY, crearTarea, registrar } from './helpers.js'

/**
 * Requisito «Las tareas exigen sesión» de `openspec/specs/tasks/spec.md`: sin un
 * token de acceso válido, `401` y la operación no se ejecuta.
 *
 * Aislamiento con transacción global: la suite functional usa el mismo SQLite
 * que el servidor de desarrollo.
 */
test.group('Tasks | exigen sesión', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // Scenario «Listar sin haber entrado».
  test('listar sin cabecera de autorización responde 401 y no devuelve tareas', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/api/v1/tasks')

    response.assertStatus(401)
    assert.notProperty(response.body(), 'data')
  })

  // Scenario «Acotar sin haber entrado».
  test('acotar la lista por estado sin sesión responde 401', async ({ client, assert }) => {
    const response = await client.get('/api/v1/tasks?status=done')

    response.assertStatus(401)
    assert.notProperty(response.body(), 'data')
  })

  // Scenario «Consultar sin haber entrado».
  test('consultar una tarea suelta sin sesión responde 401 y no devuelve la tarea', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')
    const id = await crearTarea(client, token, 'Preparar informe')

    const response = await client.get(`/api/v1/tasks/${id}?today=${HOY}`)

    response.assertStatus(401)
    assert.notProperty(response.body(), 'data')
  })

  // Scenario «Escribir sin haber entrado», al crear.
  test('crear una tarea sin sesión responde 401 y no crea nada', async ({ client, assert }) => {
    const titulo = 'Tarea que nadie debería poder crear sin sesión'

    const response = await client.post('/api/v1/tasks').json({ title: titulo })

    response.assertStatus(401)
    assert.isNull(await Task.findBy('title', titulo))
  })

  // Scenario «Escribir sin haber entrado», al cambiar el estado.
  test('cambiar el estado sin sesión responde 401 y no cambia nada', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')
    const id = await crearTarea(client, token, 'Preparar informe')

    const response = await client.patch(`/api/v1/tasks/${id}/status`).json({ status: 'done' })

    response.assertStatus(401)
    const tarea = await Task.findOrFail(id)
    assert.equal(tarea.status, 'pending')
  })

  // Scenario «Escribir sin haber entrado», al fijar la fecha.
  test('fijar la fecha sin sesión responde 401 y no cambia nada', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')
    const id = await crearTarea(client, token, 'Preparar informe')

    const response = await client
      .put(`/api/v1/tasks/${id}/due-date`)
      .json({ dueDate: '2026-09-30', today: HOY })

    response.assertStatus(401)
    const tarea = await Task.findOrFail(id)
    assert.isNull(tarea.dueDate)
  })

  // Scenario «Token inventado», aplicado a las tareas: un token que no existe
  // no abre nada.
  test('un token inventado no abre las rutas de tareas', async ({ client }) => {
    const response = await client
      .get('/api/v1/tasks')
      .header('Authorization', 'Bearer oat_1.esto-no-es-un-token')

    response.assertStatus(401)
  })
})
