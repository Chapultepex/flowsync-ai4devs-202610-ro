import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import {
  HOY,
  consultar,
  crearTarea,
  emailUnico,
  estadoOk,
  fechaOk,
  ponerFecha,
  registrar,
} from './helpers.js'

const ADA = emailUnico('ada')

/**
 * Requisitos «Cuándo una tarea está vencida» y «Fijar, cambiar y retirar la
 * fecha de vencimiento» de `openspec/specs/tasks/spec.md`.
 *
 * Una tarea está vencida si, y solo si, tiene fecha, esa fecha es anterior al
 * día de referencia (`today`) y su estado no es `done`. Los tests de «hecha» son
 * los que fallan mientras `isOverdueOn` ignore el estado.
 *
 * Aislamiento con transacción global: la suite functional usa el mismo SQLite
 * que el servidor de desarrollo.
 */

const PASADA = '2026-01-01'
const AYER = '2026-11-14'
const FUTURA = '2026-12-31'

test.group('Tasks | vencimiento', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // Scenario «Fecha del día anterior».
  test('una tarea no hecha con la fecha del día anterior llega vencida', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')
    await fechaOk(client, token, id, AYER)

    const response = await consultar(client, token, id)

    response.assertStatus(200)
    assert.isTrue(response.body().data.isOverdue)
    assert.equal(response.body().data.dueDate, AYER)
  })

  // Scenario «Vencer hoy todavía no es estar vencida».
  test('vencer exactamente el día de referencia no es estar vencida', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')
    await fechaOk(client, token, id, HOY)

    const response = await consultar(client, token, id)

    response.assertStatus(200)
    assert.isFalse(response.body().data.isOverdue)
  })

  // Scenario «Una tarea hecha con la fecha pasada», vía consulta de la tarea.
  test('una tarea hecha con la fecha pasada no llega vencida al consultarla', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')
    await fechaOk(client, token, id, PASADA)
    await estadoOk(client, token, id, 'done')

    const response = await consultar(client, token, id)

    response.assertStatus(200)
    assert.isFalse(response.body().data.isOverdue)
    assert.equal(response.body().data.dueDate, PASADA)
  })

  // Scenario «Una tarea hecha con la fecha pasada», vía respuesta del PUT.
  test('fijar una fecha pasada a una tarea hecha no la devuelve vencida', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')
    await estadoOk(client, token, id, 'done')

    const response = await ponerFecha(client, token, id, PASADA)

    response.assertStatus(200)
    assert.isFalse(response.body().data.isOverdue)
    assert.equal(response.body().data.dueDate, PASADA)
  })

  // Scenario «Darla por hecha la deja de vencer».
  test('dar por hecha una tarea vencida la deja de vencer sin tocar su fecha', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')
    await fechaOk(client, token, id, PASADA)

    const antes = await consultar(client, token, id)
    assert.isTrue(antes.body().data.isOverdue)

    await estadoOk(client, token, id, 'done')
    const despues = await consultar(client, token, id)

    despues.assertStatus(200)
    assert.isFalse(despues.body().data.isOverdue)
    assert.equal(despues.body().data.dueDate, PASADA)
  })

  // Scenario «Aplazar resuelve el vencimiento».
  test('aplazar una tarea vencida la deja de mostrar vencida en la misma respuesta', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')
    await fechaOk(client, token, id, PASADA)

    const response = await ponerFecha(client, token, id, FUTURA)

    response.assertStatus(200)
    assert.isFalse(response.body().data.isOverdue)
    assert.equal(response.body().data.dueDate, FUTURA)
  })

  // Scenario «Quitar la fecha».
  test('quitar la fecha deja la tarea sin fecha y sin vencer', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const id = await crearTarea(client, token, 'Preparar informe')
    await fechaOk(client, token, id, PASADA)

    const response = await ponerFecha(client, token, id, null)

    response.assertStatus(200)
    assert.isNull(response.body().data.dueDate)
    assert.isFalse(response.body().data.isOverdue)
  })

  // Scenario «Una fecha que no existe se rechaza». `2026-02-31` pasa cualquier
  // patrón AAAA-MM-DD y no existe; las otras dos tienen la forma equivocada.
  for (const mala of ['2026-02-31', '30/09/2026', '2026-2-3']) {
    test(`la fecha «${mala}» se rechaza y la tarea conserva la que tenía`, async ({
      client,
      assert,
    }) => {
      const token = await registrar(client, 'Ada Lovelace', ADA)
      const id = await crearTarea(client, token, 'Preparar informe')
      await fechaOk(client, token, id, '2026-09-30')

      const response = await ponerFecha(client, token, id, mala)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'dueDate' }] })

      const despues = await consultar(client, token, id)
      assert.equal(despues.body().data.dueDate, '2026-09-30')
    })
  }

  // Scenario «Tarea inexistente», al fijar la fecha.
  test('fijar la fecha de una tarea que no existe responde 404', async ({ client }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)

    const response = await ponerFecha(client, token, 99999999, '2026-09-30')

    response.assertStatus(404)
  })
})
