import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import {
  cambiarEstado,
  consultar,
  crearTarea,
  emailUnico,
  estadoOk,
  listar,
  registrar,
} from './helpers.js'

const ADA = emailUnico('ada')
const GRACE = emailUnico('grace')

/**
 * Requisitos «Tres estados fijos» y «Cambio de estado de cualquier tarea» de
 * `openspec/specs/tasks/spec.md`.
 *
 * Aislamiento con transacción global: la suite functional usa el mismo SQLite
 * que el servidor de desarrollo.
 */
test.group('Tasks | cambio de estado', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // Scenario «Cambio de estado correcto».
  test('pasar una tarea pendiente a en curso responde 200 y la lista la devuelve así', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')

    const response = await cambiarEstado(client, token, id, 'in_progress')

    response.assertStatus(200)
    assert.equal(response.body().data.status, 'in_progress')
    const lista = await listar(client, token)
    assert.equal(lista.find((t) => t.id === id)?.status, 'in_progress')
  })

  // Scenario «Cambiar una tarea de otra persona».
  test('cualquier cuenta con sesión puede cambiar el estado de una tarea ajena', async ({
    client,
    assert,
  }) => {
    const ada = await registrar(client, 'Ada Lovelace', ADA)
    const grace = await registrar(client, 'Grace Hopper', GRACE)
    const id = await crearTarea(client, ada, 'Preparar informe')

    const response = await cambiarEstado(client, grace, id, 'in_progress')

    response.assertStatus(200)
    assert.equal(response.body().data.status, 'in_progress')
  })

  // Scenario «Vuelta atrás desde hecho».
  test('una tarea hecha puede volver a pendiente', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')
    await estadoOk(client, token, id, 'done')

    const response = await cambiarEstado(client, token, id, 'pending')

    response.assertStatus(200)
    assert.equal(response.body().data.status, 'pending')
  })

  // Scenario «Cambiar el estado no toca nada más».
  test('cambiar el estado no cambia el título ni el responsable', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')

    const response = await cambiarEstado(client, token, id, 'done')

    response.assertStatus(200)
    assert.equal(response.body().data.title, 'Preparar informe')
    assert.equal(response.body().data.assignee.fullName, 'Ada Lovelace')
  })

  // Scenario «Un estado que no existe».
  test('un estado inventado responde 422 y la tarea conserva el que tenía', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')

    const response = await cambiarEstado(client, token, id, 'archivado')

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'status' }] })
    const tarea = await consultar(client, token, id)
    assert.equal(tarea.body().data.status, 'pending')
  })

  // Scenario «Tarea inexistente».
  test('cambiar el estado de una tarea que no existe responde 404', async ({ client }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)

    const response = await cambiarEstado(client, token, 99999999, 'done')

    response.assertStatus(404)
  })
})
