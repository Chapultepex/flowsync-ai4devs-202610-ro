import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`.
 *
 * Aislamiento con transacción global, igual que en `auth/signup.spec.ts`: la
 * suite functional usa el mismo SQLite que el servidor de desarrollo.
 */
test.group('Tasks | responsable de la tarea', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('la tarea muestra el nombre y las iniciales del responsable', async ({ client, assert }) => {
    const signup = await client.post('/api/v1/auth/signup').json({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secreto123',
      passwordConfirmation: 'secreto123',
    })
    const token = signup.body().data.token

    const created = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Preparar informe' })
    created.assertStatus(201)

    const id = created.body().data.id
    const response = await client
      .get(`/api/v1/tasks/${id}?today=2026-11-10`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const { assignee } = response.body().data
    assert.equal(assignee.fullName, 'Ada Lovelace')
    assert.equal(assignee.initials, 'AL')
  })

  test('la tarea no incluye el email ni otros datos de la cuenta', async ({ client, assert }) => {
    const signup = await client.post('/api/v1/auth/signup').json({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secreto123',
      passwordConfirmation: 'secreto123',
    })
    const token = signup.body().data.token

    const created = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Preparar informe' })
    const id = created.body().data.id

    const single = await client
      .get(`/api/v1/tasks/${id}?today=2026-11-10`)
      .header('Authorization', `Bearer ${token}`)
    single.assertStatus(200)
    const singleAssignee = single.body().data.assignee
    assert.notProperty(singleAssignee, 'email')
    assert.notProperty(singleAssignee, 'createdAt')
    assert.notProperty(singleAssignee, 'updatedAt')

    const list = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)
    list.assertStatus(200)
    const listAssignee = list.body().data[0].assignee
    assert.notProperty(listAssignee, 'email')
    assert.notProperty(listAssignee, 'createdAt')
    assert.notProperty(listAssignee, 'updatedAt')
  })

  test('un responsable sin nombre devuelve nombre nulo e iniciales', async ({ client, assert }) => {
    const signup = await client.post('/api/v1/auth/signup').json({
      fullName: null,
      email: 'sin-nombre@example.com',
      password: 'secreto123',
      passwordConfirmation: 'secreto123',
    })
    const token = signup.body().data.token

    const created = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Preparar informe' })
    const id = created.body().data.id

    const response = await client
      .get(`/api/v1/tasks/${id}?today=2026-11-10`)
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    const { assignee } = response.body().data
    assert.isNull(assignee.fullName)
    assert.property(assignee, 'initials')
    assert.isDefined(assignee.initials)
  })
})
