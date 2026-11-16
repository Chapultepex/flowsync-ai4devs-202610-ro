import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { contar, listar, registrar, type TareaCreada } from './helpers.js'

/**
 * Requisitos «Creación de una tarea con solo el título», «Ninguna tarea sin
 * título» y «Aviso ante un título demasiado largo» de
 * `openspec/specs/tasks/spec.md`.
 *
 * Aislamiento con transacción global: la suite functional usa el mismo SQLite
 * que el servidor de desarrollo. Como esa base puede traer tareas, «no se crea
 * ninguna tarea» se comprueba comparando la lista antes y después.
 */

/** `data` de la respuesta de crear, estrechado: el registro tipado lo da como unión con la lista. */
const tarea = (response: { body(): { data: unknown } }) => response.body().data as TareaCreada

async function crear(client: Parameters<typeof registrar>[0], token: string, title: string) {
  return client.post('/api/v1/tasks').header('Authorization', `Bearer ${token}`).json({ title })
}

test.group('Tasks | crear una tarea', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // Scenarios «Alta con el título como único dato» y «La tarea nace pendiente».
  test('con solo el título se crea con 201, pendiente y con todos sus campos', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')

    const response = await crear(client, token, 'Revisar el informe')

    response.assertStatus(201)
    const creada = tarea(response)
    assert.equal(creada.title, 'Revisar el informe')
    assert.equal(creada.status, 'pending')
    assert.properties(creada, ['id', 'title', 'status', 'assignee', 'createdAt', 'updatedAt'])
  })

  // Scenario «La tarea nace a nombre de quien la crea».
  test('la tarea nace a nombre de quien la crea', async ({ client, assert }) => {
    const ada = await registrar(client, 'Ada Lovelace', 'ada@example.com')
    const grace = await registrar(client, 'Grace Hopper', 'grace@example.com')

    const deAda = await crear(client, ada, 'Preparar informe')
    const deGrace = await crear(client, grace, 'Revisar el compilador')

    assert.equal(tarea(deAda).assignee.fullName, 'Ada Lovelace')
    assert.equal(tarea(deGrace).assignee.fullName, 'Grace Hopper')
  })

  // Scenario «Título ausente o vacío».
  test('un título vacío se rechaza con 422 sobre title y no crea ninguna tarea', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')
    const antes = await contar(client, token)

    const response = await crear(client, token, '')

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'title' }] })
    assert.equal(await contar(client, token), antes)
  })

  // Scenario «Título de solo espacios».
  test('un título de solo espacios se rechaza igual que uno vacío', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')
    const antes = await contar(client, token)

    const response = await crear(client, token, '   ')

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'title' }] })
    assert.equal(await contar(client, token), antes)
  })

  // Scenario «Espacios en los extremos».
  test('los espacios de los extremos del título se ignoran', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')

    const response = await crear(client, token, '  Revisar el informe  ')

    response.assertStatus(201)
    assert.equal(tarea(response).title, 'Revisar el informe')
  })

  // Scenario «Título en el límite».
  test('un título de exactamente 200 caracteres se crea íntegro', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')
    const titulo = 'a'.repeat(200)

    const response = await crear(client, token, titulo)

    response.assertStatus(201)
    assert.equal(tarea(response).title, titulo)
  })

  // Scenario «Título que se pasa de largo».
  test('un título de 201 caracteres se rechaza y no se guarda recortado', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', 'ada@example.com')
    const antes = await contar(client, token)

    const response = await crear(client, token, 'a'.repeat(201))

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'title' }] })
    const despues = await listar(client, token)
    assert.equal(despues.length, antes)
    assert.isFalse(despues.some((t) => t.title.startsWith('a'.repeat(200))))
  })
})
