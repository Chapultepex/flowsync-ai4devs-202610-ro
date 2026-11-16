import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  /**
   * El nombre de la cuenta sin espacios de los extremos, o `null` si no tiene:
   * un nombre vacío o de solo espacios es no tener nombre, igual que `null`.
   */
  get displayName(): string | null {
    const nombre = this.fullName?.trim()
    return nombre || null
  }

  /**
   * Las palabras del nombre son los trozos separados por espacios, sean cuantos
   * sean; una cuenta sin nombre toma las iniciales de su email.
   *
   * Se cuentan caracteres y no unidades UTF-16: `charAt` y `slice` parten un
   * emoji por la mitad y dejan una cadena que ni siquiera es texto válido.
   */
  get initials() {
    const nombre = this.displayName
    const [first, last] = nombre ? nombre.split(/\s+/) : this.email.split('@')
    const primeros = (texto: string, cuantos: number) =>
      Array.from(texto).slice(0, cuantos).join('')

    if (first && last) {
      return `${primeros(first, 1)}${primeros(last, 1)}`.toUpperCase()
    }
    return primeros(first, 2).toUpperCase()
  }
}
