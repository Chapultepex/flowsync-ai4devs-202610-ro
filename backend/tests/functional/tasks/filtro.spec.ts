import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Task from '#models/task'
import { crearTarea, emailUnico, estadoOk, listar, pedirLista, registrar } from './helpers.js'

const ADA = emailUnico('ada')

/**
 * Requisitos «Acotar la lista por estado», «Un filtro válido sin resultados es
 * una lista vacía legítima» y «Un estado que no existe se rechaza, no se
 * responde vacío» de `openspec/specs/tasks/spec.md`.
 *
 * La suite functional comparte SQLite con el servidor de desarrollo, así que
 * los tests no dan por hecho que la base esté vacía: miran los ids que crean y
 * comprueban que todo lo devuelto cumple el filtro. Los que necesitan una lista
 * vacía vacían la tabla DENTRO de la transacción global, que se deshace sola.
 */

async function tresTareas(client: Parameters<typeof registrar>[0], token: string) {
  const pendiente = await crearTarea(client, token, 'Pendiente')
  const enCurso = await crearTarea(client, token, 'En curso')
  const hecha = await crearTarea(client, token, 'Hecha')
  await estadoOk(client, token, enCurso, 'in_progress')
  await estadoOk(client, token, hecha, 'done')
  return { pendiente, enCurso, hecha }
}

test.group('Tasks | filtro de la lista', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // Scenario «Estado inventado».
  test('un estado inventado se rechaza con 422 sobre status y no es una lista', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    await tresTareas(client, token)

    const response = await pedirLista(client, token, '?status=archivado')

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'status' }] })
    assert.notProperty(response.body(), 'data')
  })

  // Scenario «El error no se confunde con la ausencia».
  test('un estado inventado y un estado válido sin tareas se distinguen', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    await Task.query().delete()
    await crearTarea(client, token, 'Pendiente')

    const inventado = await pedirLista(client, token, '?status=archivado')
    const sinResultados = await pedirLista(client, token, '?status=in_progress')

    inventado.assertStatus(422)
    sinResultados.assertStatus(200)
    assert.deepEqual(sinResultados.body().data, [])
  })

  // Scenario «El estado inventado no pasa a existir».
  test('pedir un estado inventado no cambia ninguna tarea', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const { pendiente, enCurso, hecha } = await tresTareas(client, token)

    await pedirLista(client, token, '?status=archivado')

    const abiertas = await listar(client, token)
    const hechas = await listar(client, token, '?status=done')
    assert.equal(abiertas.find((t) => t.id === pendiente)?.status, 'pending')
    assert.equal(abiertas.find((t) => t.id === enCurso)?.status, 'in_progress')
    assert.equal(hechas.find((t) => t.id === hecha)?.status, 'done')
  })

  // Scenarios «Filtrar por un estado concreto» y «Lo hecho sigue siendo
  // consultable»: un estado devuelve solo el suyo.
  for (const estado of ['pending', 'in_progress', 'done'] as const) {
    test(`?status=${estado} devuelve únicamente las tareas de ese estado`, async ({
      client,
      assert,
    }) => {
      const token = await registrar(client, 'Ada Lovelace', ADA)
      const ids = await tresTareas(client, token)
      const suyo = { pending: ids.pendiente, in_progress: ids.enCurso, done: ids.hecha }[estado]

      const lista = await listar(client, token, `?status=${estado}`)

      assert.isTrue(lista.every((t) => t.status === estado))
      assert.include(
        lista.map((t) => t.id),
        suyo
      )
      for (const [otroEstado, id] of Object.entries(ids)) {
        if (id !== suyo)
          assert.notInclude(
            lista.map((t) => t.id),
            id,
            otroEstado
          )
      }
    })
  }

  // Scenario «Sin filtro no es «todas»» del requisito «Una sola lista compartida
  // del espacio».
  test('sin filtro llegan las pendientes y en curso, y ninguna hecha', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const { pendiente, enCurso, hecha } = await tresTareas(client, token)

    const lista = await listar(client, token)
    const ids = lista.map((t) => t.id)

    assert.include(ids, pendiente)
    assert.include(ids, enCurso)
    assert.notInclude(ids, hecha)
  })

  // Scenario «Nadie tiene nada en curso».
  test('un estado válido sin tareas responde 200 con una lista vacía', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    await Task.query().delete()
    await crearTarea(client, token, 'Pendiente')

    const response = await pedirLista(client, token, '?status=in_progress')

    response.assertStatus(200)
    assert.deepEqual(response.body().data, [])
  })

  // Scenario «El espacio entero está vacío».
  test('un espacio sin tareas responde 200 con una lista vacía, acotada o no', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    await Task.query().delete()

    const sinAcotar = await pedirLista(client, token)
    const acotada = await pedirLista(client, token, '?status=done')

    sinAcotar.assertStatus(200)
    acotada.assertStatus(200)
    assert.deepEqual(sinAcotar.body().data, [])
    assert.deepEqual(acotada.body().data, [])
  })

  // Scenario «Un solo estado por petición»: «pedir otro sustituye al anterior
  // en lugar de sumarse». El orden de sustitución (el último gana) lo fija el
  // requisito de la historia; si se decidiera otro, este test cambia con él.
  test('con dos status en la misma petición, el último sustituye al anterior', async ({
    client,
    assert,
  }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const { pendiente, hecha } = await tresTareas(client, token)

    const response = await pedirLista(client, token, '?status=pending&status=done')

    response.assertStatus(200)
    const lista = response.body().data as Array<{ id: number; status: string }>
    assert.isTrue(lista.every((t) => t.status === 'done'))
    assert.include(
      lista.map((t) => t.id),
      hecha
    )
    assert.notInclude(
      lista.map((t) => t.id),
      pendiente
    )
  })

  // Scenario «Un solo estado por petición», con el parámetro escrito como
  // lista (`status[]=...`), que es otra forma de repetirlo. Los casos con un
  // valor vacío al final (`status=pending&status=`) no se prueban: la spec no
  // dice si un valor vacío cuenta como «otro estado» o como ausencia.
  test('con status[] repetido, el último sustituye al anterior', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const { pendiente, hecha } = await tresTareas(client, token)

    const response = await pedirLista(client, token, '?status[]=pending&status[]=done')

    response.assertStatus(200)
    const lista = response.body().data as Array<{ id: number; status: string }>
    assert.isTrue(lista.every((t) => t.status === 'done'))
    assert.include(
      lista.map((t) => t.id),
      hecha
    )
    assert.notInclude(
      lista.map((t) => t.id),
      pendiente
    )
  })

  // Scenario «Acotar no cambia nada».
  test('acotar la lista no cambia el estado de ninguna tarea', async ({ client, assert }) => {
    const token = await registrar(client, 'Ada Lovelace', ADA)
    const { pendiente, enCurso, hecha } = await tresTareas(client, token)

    for (const estado of ['pending', 'in_progress', 'done']) {
      await pedirLista(client, token, `?status=${estado}`)
    }

    const abiertas = await listar(client, token)
    const hechas = await listar(client, token, '?status=done')
    assert.equal(abiertas.find((t) => t.id === pendiente)?.status, 'pending')
    assert.equal(abiertas.find((t) => t.id === enCurso)?.status, 'in_progress')
    assert.equal(hechas.find((t) => t.id === hecha)?.status, 'done')
  })
})
