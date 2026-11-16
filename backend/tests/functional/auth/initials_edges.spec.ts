import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { emailUnico } from '../tasks/helpers.js'

const ADA = emailUnico('ada')

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
    // Scenario «Nombre de dos palabras», con un tabulador como separador.
    ['un tabulador entre las palabras separa igual que un espacio', 'Ada\tLovelace', 'AL'],
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
      await User.create({ fullName, email: ADA, password: 'secreto123' })

      const response = await client
        .post('/api/v1/auth/login')
        .json({ email: ADA, password: 'secreto123' })

      response.assertStatus(200)
      assert.equal(response.body().data.user.initials, esperadas)
    })
  }

  // Scenarios «Nombre de dos palabras» y «Nombre de una sola palabra», con un
  // emoji: un emoji ocupa dos unidades UTF-16, y tomar «el primer carácter» de
  // una palabra que empieza por él deja medio par suelto. Lo que sale por la API
  // tiene que seguir siendo texto válido y no estar vacío; qué letras deben dar
  // es otra pregunta que la spec no responde, y aquí no se decide.
  const conEmoji: Array<[string, string]> = [
    ['un nombre que empieza por un emoji da unas iniciales bien formadas', '😀 Ana'],
    ['un nombre que acaba en un emoji da unas iniciales bien formadas', 'Ana 😀'],
    ['un nombre de una sola palabra con emoji da unas iniciales bien formadas', 'A😀'],
  ]

  for (const [titulo, fullName] of conEmoji) {
    test(titulo, async ({ client, assert }) => {
      await User.create({ fullName, email: ADA, password: 'secreto123' })

      const response = await client
        .post('/api/v1/auth/login')
        .json({ email: ADA, password: 'secreto123' })

      response.assertStatus(200)
      const initials = response.body().data.user.initials as string
      assert.isAbove(initials.length, 0)
      assert.isTrue(initials.isWellFormed(), `iniciales mal formadas: ${JSON.stringify(initials)}`)
    })
  }
})
