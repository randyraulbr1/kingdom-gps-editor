# Ideas y feedback de jugadores

## Objetivo

Permitir que los jugadores envíen ideas, sugerencias y reportes desde el juego, con una opción global para activar o desactivar esta función desde el Panel ADM.

## Control desde el Panel ADM

El administrador debe poder:

- Activar o desactivar el envío de ideas
- Activar o desactivar comentarios anónimos
- Definir categorías permitidas
- Limitar cantidad de envíos por jugador y por día
- Mostrar un mensaje personalizado cuando la función esté desactivada
- Habilitar solo para versiones específicas del juego
- Habilitar solo para jugadores seleccionados o beta testers

## Formulario del jugador

Campos recomendados:

- Título
- Categoría
- Descripción
- Qué problema resuelve
- Cómo imagina que debería funcionar
- Captura opcional
- Misión, objeto, enemigo o sistema relacionado
- Posición GPS aproximada solo si es relevante

Categorías:

- Idea nueva
- Mejora
- Error
- Balance
- Misión
- GPS
- Inventario
- Enemigos
- Chat y amigos
- Accesibilidad
- Otro

## Registro de sugerencias

Cada envío debe guardar:

- feedbackId
- playerId o anónimo
- título
- categoría
- contenido
- versión del juego
- fecha y hora
- dispositivo
- sistema relacionado
- estado
- prioridad
- etiquetas
- notas internas

Estados:

- new
- reviewing
- accepted
- planned
- in_progress
- implemented
- rejected
- duplicate
- archived

## Bandeja de revisión

El Panel ADM debe mostrar:

- Nuevas
- Más repetidas
- Más votadas
- Aceptadas
- En desarrollo
- Implementadas
- Rechazadas
- Duplicadas

Opciones:

- Buscar
- Filtrar
- Etiquetar
- Fusionar duplicados
- Añadir nota interna
- Convertir en tarea del roadmap
- Asignar a una fase
- Marcar como implementada
- Responder al jugador

## Votación opcional

El administrador puede activar una sección pública donde los jugadores voten ideas.

Controles:

- Permitir o bloquear votación
- Máximo de votos por jugador
- Ocultar autores
- Cerrar votación
- Evitar votos duplicados

La popularidad no debe sustituir la revisión técnica.

## Archivo exportable

Añadir botón:

`Exportar feedback`

Formatos:

- JSON completo
- CSV
- Markdown
- ZIP con capturas y adjuntos

El archivo debe incluir filtros aplicados, fechas y estados.

Este archivo podrá subirse a ChatGPT para:

- Resumir ideas
- Agrupar temas repetidos
- Detectar prioridades
- Convertir sugerencias en fases del roadmap
- Redactar respuestas

## Archivo vivo del proyecto

Además de guardarse en base de datos, el Panel ADM puede generar periódicamente:

`panel adm/feedback/FEEDBACK_JUGADORES.md`

Con secciones:

- Nuevas ideas
- Más repetidas
- Aprobadas
- Planificadas
- Implementadas
- Rechazadas

## Moderación

- Filtro de spam
- Límite de longitud
- Bloqueo por abuso
- Reporte de contenido ofensivo
- No permitir HTML ni scripts
- Escapar todo contenido mostrado

## Privacidad

- No incluir contraseñas, tokens ni datos sensibles
- Permitir anonimizar playerId al exportar
- Retener solo la información necesaria

## Fases

### Fase A
- Formulario del jugador
- Activar/desactivar desde el panel
- Guardado en base de datos

### Fase B
- Bandeja de revisión
- Filtros
- Estados
- Etiquetas

### Fase C
- Exportación de archivos
- Detección de duplicados
- Conversión a roadmap

### Fase D
- Votación opcional
- Respuestas a jugadores
- Estadísticas de temas

## Regla principal

Ninguna sugerencia modifica el juego automáticamente. Primero debe revisarse, aprobarse y asignarse a una fase del roadmap.
