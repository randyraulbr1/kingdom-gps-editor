# Contratos de interacción de pines del mapa

## Objetivo

Asegurar que cada pin colocado en el Editor de Mundo esté conectado a una acción real del juego y del Panel ADM. Ningún pin debe ser meramente decorativo.

## Regla principal

Cada entidad del mapa debe declarar:

- `entityId`
- `entityType`
- `interactionType`
- `targetId`
- `visibilityRadiusMeters`
- `interactionRadiusMeters`
- `isActive`
- `requiresOnline`
- `requiredLevel`
- `metadata`

Al pulsar un pin, el sistema debe resolver su acción a través de un registro central de interacciones. No se deben programar acciones aisladas dentro de cada marcador.

## Tipos iniciales

### Tienda

Al pulsar:

1. Validar que la tienda esté activa.
2. Validar nivel y distancia si aplica.
3. Abrir panel de tienda.
4. Cargar catálogo mediante `shopId`.
5. Mostrar stock, precio, moneda y requisitos.
6. Permitir comprar solo mediante servicio autorizado.

Si falta catálogo, mostrar error visible en el Panel ADM.

### NPC

Al pulsar:

- Abrir diálogo.
- Mostrar misiones disponibles.
- Mostrar opciones de interacción.
- Abrir comercio si el NPC también es vendedor.

### Enemigo

Al pulsar:

- Mostrar nombre, nivel, vida y estado.
- Permitir iniciar combate si está en distancia de ataque.
- Si está fuera de alcance, mostrar distancia restante.
- Mantener IA simple: visión, persecución, ataque y regreso.

### Cofre

Al pulsar:

- Verificar si ya fue abierto por ese jugador.
- Validar distancia.
- Abrir recompensa mediante servidor.
- Registrar resultado para evitar duplicados.

### Recurso

Al pulsar:

- Verificar herramientas, nivel y cooldown.
- Recolectar mediante servidor.
- Mostrar tiempo de reaparición.

### Misión

Al pulsar:

- Mostrar resumen.
- Ver requisitos.
- Iniciar, continuar o completar según estado.
- Resaltar siguientes pines conectados.

### Ruta enemiga

Al pulsar:

- Mostrar nombre y nivel recomendado.
- Mostrar lista de enemigos configurados.
- Mostrar tiempo mínimo y máximo de aparición.
- Mostrar radio compartido por proximidad.
- Permitir simulación desde el Panel ADM.

## Registro central

Crear un registro conceptual similar a:

```ts
interface MapInteractionHandler {
  type: string
  canOpen(entity: WorldEntity, context: InteractionContext): Promise<boolean>
  open(entity: WorldEntity, context: InteractionContext): Promise<void>
}
```

Ejemplos de handlers:

- `ShopInteractionHandler`
- `NpcInteractionHandler`
- `EnemyInteractionHandler`
- `ChestInteractionHandler`
- `QuestInteractionHandler`
- `ResourceInteractionHandler`

## Vista previa en Panel ADM

El Panel ADM debe tener botón:

`Probar interacción`

Debe permitir:

- Abrir la tienda de prueba.
- Ver el diálogo del NPC.
- Simular entrar en radio de enemigo.
- Simular abrir cofre.
- Ver recompensa sin entregarla.
- Simular inicio de misión.

La simulación no debe modificar producción.

## Validaciones obligatorias

Antes de publicar una entidad:

- Debe tener `interactionType` válido.
- Debe tener `targetId` existente.
- El destino no puede estar eliminado.
- La interacción debe tener handler registrado.
- La distancia debe ser razonable para GPS.
- Debe existir fallback de error.

## Estados visuales en editor

- Verde: interacción válida.
- Amarillo: configuración parcial.
- Rojo: destino faltante o acción rota.
- Gris: desactivado.

## Diagnóstico

Al seleccionar un pin, mostrar:

- Qué abrirá.
- A qué registro apunta.
- Qué API o servicio utilizará.
- Qué requisitos tiene.
- Si puede probarse localmente.
- Si está listo para publicar.

## Fases

### Fase A

- Contrato común de interacción.
- Registro central de handlers.
- Tienda, NPC y enemigo.

### Fase B

- Cofre, recurso y misión.
- Botón `Probar interacción`.
- Validación automática.

### Fase C

- Historial de interacciones.
- Métricas.
- Errores por pin.

## Criterio de finalización

Una entidad del mapa solo se considera terminada cuando:

- aparece,
- se guarda,
- se puede volver a abrir,
- ejecuta su interacción correcta,
- maneja errores,
- puede probarse localmente,
- y tiene validación antes de publicar.
