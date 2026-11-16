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
   */
  get initials() {
    const nombre = this.displayName
    const [first, last] = nombre ? nombre.split(/\s+/) : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
