# Verificación · HALR

Requisito: «Lo que cada tarea muestra de su responsable» (`openspec/specs/tasks/spec.md`).

**Scenarios del requisito: 3 · Cubiertos al empezar: 0 · Cubiertos al terminar: 2**

## Parte A · Matriz de trazabilidad

| Scenario | Qué prueba lo cubre | Estado | Si «No lo sé», qué faltó |
|---|---|---|---|
| Una tarea cuyo responsable se llama «Ada Lovelace» trae en `assignee` su nombre y sus iniciales | `responsable.spec.ts` › «la tarea muestra el nombre y las iniciales del responsable»; `responsable_lista.spec.ts` › «la lista muestra el nombre y las iniciales del responsable» | Cubierto | |
| Ninguna tarea, suelta o en la lista, trae en `assignee` el email ni otros datos de acceso | `responsable_lista.spec.ts` › «la tarea suelta no incluye ningún dato de acceso de la cuenta» y «la lista no incluye ningún dato de acceso de la cuenta»; `responsable_estricto.spec.ts` › «ninguna respuesta de tareas lleva el email ni la contraseña en su cuerpo» | No lo sé | La spec no enumera qué es «dato de acceso» (¿el `id`?) y los tests usan una lista negra: un campo nuevo no listado pasaría |
| Un responsable registrado sin nombre trae el nombre nulo y sigue trayendo sus iniciales | `responsable_estricto.spec.ts` › «sin nombre, el responsable llega con nombre nulo e iniciales del email» | Cubierto | |

## Parte B · Las tres líneas

1. **Antes de mirar creía cubiertos 3 de 3; estaban cubiertos 0.**
2. 2. **Responsable identificable:** no supe si era hueco de test o de spec, porque la spec no fija qué iniciales salen de «Ada Lovelace».
   3. 3. **Lo decidí yo:** que un responsable sin nombre lleve como iniciales las de su email («AE»); el scenario solo dice que «sus iniciales siguen llegando».
      4. 
