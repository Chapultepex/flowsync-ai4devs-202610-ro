import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * La cuenta tal y como la ve su dueña. El nombre sale por `displayName` y no en
 * bruto: un nombre vacío o de solo espacios es no tener nombre, igual que en el
 * responsable de una tarea (`TaskAssigneeTransformer`). Si no, la misma cuenta
 * sería «Sin nombre» en la lista y un texto en blanco en su perfil.
 */
export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'email', 'createdAt', 'updatedAt', 'initials']),
      fullName: this.resource.displayName,
    }
  }
}
