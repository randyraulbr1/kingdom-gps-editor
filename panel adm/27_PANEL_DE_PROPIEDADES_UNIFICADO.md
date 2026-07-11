# 27. Panel de propiedades unificado

## Objetivo

Crear un único inspector lateral para editar cualquier elemento del mapa sin abrir ventanas diferentes. El panel cambia automáticamente según el tipo de elemento seleccionado y mantiene una estructura consistente.

## Estructura común

Todas las entidades usan las mismas pestañas principales:

1. General
2. Configuración
3. Interacciones
4. Referencias
5. Historial
6. Pruebas

El orden debe permanecer igual para que el usuario no tenga que aprender un inspector distinto para cada módulo.

## Comportamiento general

- Al seleccionar un elemento, el inspector muestra sus propiedades.
- Al seleccionar otro elemento, el contenido cambia inmediatamente.
- Si no hay selección, el panel muestra ayuda contextual o propiedades del mundo.
- Los cambios simples se reflejan en tiempo real en el mapa.
- Las acciones costosas o críticas requieren guardar o confirmar.
- Todo cambio debe entrar en undo/redo.
- El panel debe indicar claramente si existen cambios sin guardar.
- Debe permitir fijar el inspector para evitar que cambie por accidente.

## Propiedades por tipo

### Tienda

- Nombre
- Tipo
- Icono
- Catálogo asignado
- Radio de interacción GPS
- Horario
- Estado activo/inactivo
- Restricciones
- Vista previa
- Botón Probar tienda

### NPC

- Nombre
- Icono o modelo
- Diálogo asignado
- Misión asignada
- Tienda opcional
- Radio de interacción
- Condiciones
- Estado
- Vista previa
- Botón Probar interacción

### Enemigo

- Enemigo asignado
- Nivel
- Vida
- Daño
- Defensa
- Velocidad
- Distancia visible
- Radio de visión
- Distancia de persecución
- Distancia de ataque
- Distancia de regreso
- Loot
- Ruta asignada
- Estado activo/inactivo
- Botón Simular combate

### Ruta enemiga

- Nombre
- Color
- Longitud
- Número de puntos
- Lista de enemigos
- Nivel o rango de nivel
- Cantidad mínima y máxima
- Tiempo mínimo y máximo de aparición
- Radio compartido entre jugadores
- Cooldown
- Estado
- Botón Simular spawn

### Zona

- Nombre
- Color
- Área
- Número de vértices
- Cantidad de pines
- Tiendas
- NPC
- Enemigos
- Recursos
- Eventos
- Importación desde OpenStreetMap
- Estado
- Botón Validar zona

### Cofre

- Tabla de recompensas
- Radio de interacción
- Uso único o repetible
- Tiempo de reaparición
- Modo personal o compartido
- Estado
- Botón Probar apertura

### Recurso

- Recurso asignado
- Cantidad mínima y máxima
- Radio de interacción
- Herramienta requerida
- Nivel requerido
- Tiempo de recolección
- Tiempo de respawn
- Modo personal o compartido
- Estado
- Botón Probar recolección

### Pin genérico

- Tipo de pin
- Contenido asignado
- Nombre visible
- Icono
- Posición
- Zona
- Radio de interacción
- Estado
- Etiquetas
- Notas internas

## Edición múltiple

Si se seleccionan varios elementos del mismo tipo:

- Mostrar solo propiedades comunes.
- Marcar como `Mixto` los valores diferentes.
- Permitir cambiar una propiedad para todos.
- Mostrar cuántos elementos serán afectados.
- Confirmar cambios destructivos o masivos.

Ejemplos:

- Cambiar nivel de 20 enemigos.
- Cambiar radio de interacción de 15 tiendas.
- Desactivar 30 recursos.
- Reasignar una tabla de loot a varios cofres.

## Vista previa en tiempo real

El mapa debe actualizar inmediatamente:

- Color de zonas y rutas.
- Iconos de pines.
- Radios de visión, persecución, ataque e interacción.
- Estado activo/inactivo.
- Posición y nombre visible.

Para evitar problemas de rendimiento, las previsualizaciones pesadas deben usar debounce y no guardar en base de datos en cada pulsación.

## Validaciones dentro del inspector

Cada campo debe mostrar errores cerca del control:

- Referencia inexistente.
- Valor fuera de rango.
- Distancias incoherentes.
- Entidad sin contenido asignado.
- Tienda sin catálogo.
- NPC sin acción.
- Enemigo sin nivel o loot.
- Ruta sin puntos suficientes.

No se debe depender únicamente del validador global; el inspector debe ayudar a corregir errores en el momento.

## Referencias

La pestaña Referencias mostrará:

- Usado por.
- Depende de.
- Referencias rotas.
- Botón reemplazar referencia.
- Botón ir al elemento relacionado.

## Historial

La pestaña Historial mostrará:

- Fecha del cambio.
- Usuario o IA que lo realizó.
- Propiedad modificada.
- Valor anterior y nuevo.
- Commit o versión relacionada cuando exista.

## Pruebas

Cada tipo puede ofrecer acciones de prueba:

- Probar tienda.
- Probar diálogo.
- Simular misión.
- Simular combate.
- Simular spawn.
- Probar cofre.
- Probar recurso.
- Validar zona.

Las pruebas no deben modificar datos de producción ni entregar recompensas reales.

## Reglas de implementación

- Un único componente base de inspector.
- Secciones registradas por tipo de entidad.
- Formularios tipados.
- Validación reutilizable.
- Cambios integrados con CommandBus o sistema equivalente.
- Referencias por ID estable, nunca por copia de datos.
- Soporte para selección única y múltiple.
- Estado del inspector persistente por proyecto.

## Criterios de aceptación

- Seleccionar cualquier entidad abre su inspector correcto.
- El panel nunca muestra propiedades de una selección anterior.
- Los radios y colores se actualizan en tiempo real.
- La edición múltiple funciona sin sobrescribir campos no modificados.
- Undo/redo revierte cambios del inspector.
- Las referencias rotas se muestran claramente.
- Las pruebas se pueden ejecutar sin afectar datos reales.
- El inspector mantiene el mismo orden de pestañas en todos los tipos.
