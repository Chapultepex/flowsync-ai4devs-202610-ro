import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Bordes del requisito «Iniciales de la cuenta» de `openspec/specs/auth/spec.md`
 * que `initials.spec.ts` no toca: nombres con espacios de más, con espacios solo,
 * o de una sola letra.
 *
 * La spec fija tres scenarios («Nombre de dos palabras», «Nombre de una sola
 * palabra», «Cuenta sin nombre») y no dice nada de espacios. Se leen en el
 * sentido que ya tienen: las palabras son los trozos separados por espacios, sea
 * cuantos sea, y un nombre sin palabras es una cuenta sin nombre, cuyas iniciales
 * salen del email (`ada@example.com` → `AE`, como en `initials.spec.ts`).
 *
 * Aislamiento con transacción global: la suite functional usa el mismo SQLite
 * que el servidor de desarrollo.
 */
test.group('Auth | iniciales, casos límite', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const casos: Array<[string, string, string]> = [
    // Scenario «Nombre de dos palabras».
    ['dos espacios entre las palabras no cambian las iniciales', 'Ada  Lovelace', 'AL'],
    // Scenario «Nombre de una sola palabra».
    ['un espacio al principio no deja las iniciales vacías', ' Ada', 'AD'],
    // Scenario «Nombre de una sola palabra», con una sola letra disponible.
    ['un nombre de una sola letra da esa letra', 'A', 'A'],
    // Scenario «Cuenta sin nombre».
    ['un nombre de solo espacios se trata como sin nombre', '   ', 'AE'],
    // Scenario «Cuenta sin nombre».
    ['un nombre vacío se trata como sin nombre', '', 'AE'],
  ]

  for (const [titulo, fullName, esperadas] of casos) {
    test(titulo, async ({ client, assert }) => {
      await User.create({ fullName, email: 'ada@example.com', password: 'secreto123' })

      const response = await client
        .post('/api/v1/auth/login')
        .json({ email: 'ada@example.com', password: 'secreto123' })

      response.assertStatus(200)
      assert.equal(response.body().data.user.initials, esperadas)
    })
  }
})
