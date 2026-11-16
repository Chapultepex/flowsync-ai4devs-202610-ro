import { ApiProperty, ApiPropertyOptional } from '@foadonis/openapi/decorators'
import { TASK_STATUSES } from '#models/task'

/**
 * Esquemas del documento OpenAPI que se repiten entre operaciones. Cada clase
 * se publica una vez en `components.schemas` bajo el nombre de la clase, y las
 * respuestas la referencian con `$ref`.
 *
 * Solo describen lo que la API ya hace: reflejan los transformers de
 * `app/transformers/` y los validadores de `app/validators/task.ts`. Los tipos
 * van explícitos en cada propiedad y no se infieren por reflexión.
 *
 * El documento es OpenAPI 3.0, de ahí `nullable: true` y no `type: [..., 'null']`.
 */

const STATUS_VALUES = [...TASK_STATUSES]

/** El responsable tal y como lo ve la lista: nombre e iniciales, sin email. */
export class TaskAssignee {
  @ApiProperty({ type: 'integer' })
  declare id: number

  @ApiProperty({
    schema: { type: 'string', nullable: true },
    description: 'Nulo si la cuenta se registró sin nombre.',
  })
  declare fullName: string | null

  @ApiProperty({ type: 'string' })
  declare initials: string
}

/** La tarea de la lista y de las respuestas de crear y cambiar el estado. No lleva vencimiento. */
export class TaskSummary {
  @ApiProperty({ type: 'integer' })
  declare id: number

  @ApiProperty({ type: 'string' })
  declare title: string

  @ApiProperty({ enum: STATUS_VALUES })
  declare status: string

  @ApiProperty({ schema: { type: 'string', format: 'date-time', nullable: true } })
  declare createdAt: string | null

  @ApiProperty({ schema: { type: 'string', format: 'date-time', nullable: true } })
  declare updatedAt: string | null

  @ApiProperty({ type: TaskAssignee })
  declare assignee: TaskAssignee
}

/** La tarea suelta: añade la fecha de vencimiento y la condición de vencida. */
export class TaskDetail extends TaskSummary {
  @ApiProperty({
    schema: { type: 'string', format: 'date', nullable: true },
    description: 'Un día del calendario, AAAA-MM-DD. Nulo si la tarea no tiene fecha.',
  })
  declare dueDate: string | null

  @ApiProperty({
    type: 'boolean',
    description:
      'Verdadero si hay fecha, es anterior al día de referencia `today` y la tarea no está hecha.',
  })
  declare isOverdue: boolean
}

/** Envoltorio `{ data }` de `serialize()` con una tarea de la lista. */
export class TaskResponse {
  @ApiProperty({ type: TaskSummary })
  declare data: TaskSummary
}

/** Envoltorio `{ data }` con la lista de tareas, entera y sin paginar. */
export class TaskListResponse {
  @ApiProperty({ type: [TaskSummary] })
  declare data: TaskSummary[]
}

/** Envoltorio `{ data }` con una tarea y su vencimiento. */
export class TaskDetailResponse {
  @ApiProperty({ type: TaskDetail })
  declare data: TaskDetail
}

/** Cada error del formato `{ errors: [...] }`. `field` y `rule` solo vienen en los 422. */
export class ErrorItem {
  @ApiProperty({ type: 'string' })
  declare message: string

  @ApiPropertyOptional({ type: 'string', description: 'Campo que se rechaza (solo en 422).' })
  declare field?: string

  @ApiPropertyOptional({ type: 'string', description: 'Regla de validación incumplida.' })
  declare rule?: string
}

export class ErrorResponse {
  @ApiProperty({ type: [ErrorItem] })
  declare errors: ErrorItem[]
}

/** Cuerpo de `POST /api/v1/tasks`. Cualquier otro campo se ignora. */
export class CreateTaskBody {
  @ApiProperty({
    type: 'string',
    minLength: 1,
    maxLength: 200,
    description: 'Se recortan los espacios de los extremos antes de validar.',
  })
  declare title: string
}

/** Cuerpo de `PATCH /api/v1/tasks/:id/status`. */
export class UpdateTaskStatusBody {
  @ApiProperty({ enum: STATUS_VALUES })
  declare status: string
}

/** Cuerpo de `PUT /api/v1/tasks/:id/due-date`. */
export class SetTaskDueDateBody {
  @ApiProperty({
    schema: { type: 'string', format: 'date', nullable: true },
    description: 'AAAA-MM-DD, o null para quitar la fecha.',
  })
  declare dueDate: string | null

  @ApiProperty({
    schema: { type: 'string', format: 'date' },
    description: 'Día de referencia de quien pide, AAAA-MM-DD. Obligatorio.',
  })
  declare today: string
}
