import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * El responsable tal y como lo necesita la lista: un nombre con el que
 * identificarlo y unas iniciales con las que representarlo. Nada más.
 *
 * Deliberadamente NO se reutiliza `UserTransformer`, que incluye el email y
 * las fechas de la cuenta: la lista no los usa, y en cuanto el cliente los
 * recibe ya no se pueden recortar sin romperlo. Si algún día hace falta un
 * dato más aquí, se añade aquí — no se cambia por el otro transformer.
 *
 * Un nombre vacío o de solo espacios llega como `null`, igual que una cuenta
 * registrada sin nombre: la interfaz decide «Sin nombre» solo con ese nulo.
 */
export default class TaskAssigneeTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'initials']),
      fullName: this.resource.displayName,
    }
  }
}
