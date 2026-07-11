# Biblioteca y generador de iconos

## Biblioteca

Los iconos del juego deben ser archivos reales separados:

- PNG con fondo transparente
- Tamaños maestro 512x512 y derivados 256, 128 y 64
- Carpetas por categorías
- Nombres seguros y consistentes
- Sin emojis ni imágenes incrustadas en código

Funciones previstas:

- Buscar y filtrar
- Etiquetas y favoritos
- Vista previa grande
- Arrastrar y soltar
- Importar carpetas
- Detectar duplicados
- Convertir PNG/JPG/WEBP
- Redimensionar y optimizar

## Generación con Recraft

Modelo recomendado para lotes: Recraft V4.1 ráster.

El token solo debe existir en `.env` y usarse desde el proceso main de Electron.

## Cola de generación

Tabla `icon_generation_jobs` con entidad, prompt, estado, intentos, ruta, error y fechas.

Estados:

- pending
- generating
- review
- approved
- rejected
- failed

La cola debe poder iniciar, pausar, reanudar, cancelar, reintentar y recuperarse al reiniciar.

## Flujo

1. Seleccionar objetos sin icono.
2. Estimar coste.
3. Generar con concurrencia 2 por defecto, máximo 5.
4. Descargar a `assets/icons/{categoria}/`.
5. Revisar, aprobar o regenerar.
6. Actualizar automáticamente la ruta del objeto.
7. Exportar en `items.json`.

## Prompt base

Professional fantasy RPG inventory icon of {name}. Category: {category}. Description: {description}. Single isolated object, centered composition. Hand-painted semi-realistic fantasy style. Detailed textures, clean dramatic lighting, strong readability at 64x64. Transparent background. No text, watermark, border, frame or additional objects. Consistent Kingdom GPS visual identity.
