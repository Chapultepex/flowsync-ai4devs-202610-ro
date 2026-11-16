import User from '#models/user'
import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import { emailUnico } from '../tasks/helpers.js'

const ADA = emailUnico('ada')

/**
 * Una cuenta cuyo nombre es solo espacios no tiene nombre, igual que una
 * registrada con `null`. Es la decisión que ya aplica el responsable de una tarea
 * (`tasks/responsable_estricto.spec.ts`); aquí se exige lo mismo a las respuestas
 * de auth, para que la misma cuenta no sea «Sin nombre» en la lista y un texto en
 * blanco en su perfil.
 *
 * Se registra por la API y no con `User.create`: así el test vale tanto si el
 * nombre se normaliza al guardarlo como si se normaliza al leerlo.
 *
 * Aislamiento con transacción global: la suite functional usa el mismo SQLite
 * que el servidor de desarrollo.
 */
test.group('Auth | cuenta con el nombre en blanco', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const registrarEnBlanco = (client: ApiClient) =>
    client.post('/api/v1/auth/signup').json({
      fullName: '   ',
      email: ADA,
      password: 'secreto123',
      passwordConfirmation: 'secreto123',
    })

  // Scenario «Cuenta sin nombre», en la respuesta del registro.
  test('registrarse con un nombre en blanco devuelve el nombre nulo', async ({
    client,
    assert,
  }) => {
    const response = await registrarEnBlanco(client)

    response.assertStatus(200)
    assert.isNull(response.body().data.user.fullName)
  })

  // Scenario «Cuenta sin nombre», en la respuesta del login.
  test('iniciar sesión con una cuenta de nombre en blanco devuelve el nombre nulo', async ({
    client,
    assert,
  }) => {
    const registro = await registrarEnBlanco(client)
    registro.assertStatus(200)

    const response = await client
      .post('/api/v1/auth/login')
      .json({ email: ADA, password: 'secreto123' })

    response.assertStatus(200)
    assert.isNull(response.body().data.user.fullName)
  })

  // Scenario «Perfil de una cuenta sin nombre», en la respuesta del perfil.
  test('el perfil de una cuenta de nombre en blanco devuelve el nombre nulo', async ({
    client,
    assert,
  }) => {
    const registro = await registrarEnBlanco(client)
    registro.assertStatus(200)

    const response = await client
      .get('/api/v1/account/profile')
      .header('Authorization', `Bearer ${registro.body().data.token}`)

    response.assertStatus(200)
    assert.isNull(response.body().data.fullName)
  })

  // La API no deja guardar un nombre en blanco (el cuerpo de la petición ya
  // convierte las cadenas vacías en nulo), pero una cuenta que ya lo tiene
  // guardado, venga de donde venga, debe contestar igual: sin nombre.
  test('una cuenta con el nombre en blanco ya guardado inicia sesión con el nombre nulo', async ({
    client,
    assert,
  }) => {
    await User.create({ fullName: '   ', email: ADA, password: 'secreto123' })

    const response = await client
      .post('/api/v1/auth/login')
      .json({ email: ADA, password: 'secreto123' })

    response.assertStatus(200)
    assert.isNull(response.body().data.user.fullName)
  })

  // Scenario «Perfil de una cuenta sin nombre», con el nombre ya guardado en blanco.
  test('el perfil de una cuenta con el nombre en blanco ya guardado devuelve el nombre nulo', async ({
    client,
    assert,
  }) => {
    const user = await User.create({ fullName: '   ', email: ADA, password: 'secreto123' })
    const token = await User.accessTokens.create(user)

    const response = await client
      .get('/api/v1/account/profile')
      .header('Authorization', `Bearer ${token.value!.release()}`)

    response.assertStatus(200)
    assert.isNull(response.body().data.fullName)
  })
})
