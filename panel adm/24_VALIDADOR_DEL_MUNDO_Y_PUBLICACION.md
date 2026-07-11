# 24 — Validador del mundo y publicación segura

## Objetivo

Crear un sistema central que revise todo el contenido del mundo antes de exportarlo o publicarlo. Ningún pin, ruta, zona o referencia rota debe llegar al juego.

## Flujo principal

1. El usuario pulsa **Validar mundo** o **Publicar mundo**.
2. El sistema analiza mapa, entidades, referencias y reglas.
3. Los resultados se agrupan en:
   - Error crítico: bloquea publicación.
   - Advertencia: permite publicar con confirmación.
   - Información: recomendación no bloqueante.
4. Cada resultado debe incluir:
   - Tipo.
   - Entidad afectada.
   - Ubicación o referencia.
   - Motivo.
   - Botón **Ir al elemento**.
   - Botón **Corregir** cuando sea posible.

## Validaciones mínimas del mapa

- Pines sin tipo.
- Pines sin contenido asignado.
- Pines con referencias inexistentes.
- Pines fuera de una zona válida cuando la zona sea obligatoria.
- Pines duplicados en la misma posición y con la misma referencia.
- Tiendas sin catálogo.
- NPC sin diálogo, misión o acción.
- Misiones con pasos rotos o referencias inexistentes.
- Monstruos sin estadísticas mínimas.
- Monstruos sin tabla de loot cuando el loot sea obligatorio.
- Rutas rojas sin enemigos.
- Rutas con menos de dos puntos.
- Rutas con tiempos de aparición inválidos.
- Cofres sin tabla de recompensas.
- Recursos sin recurso asignado.
- Zonas con polígonos inválidos o sin cerrar.
- Zonas sin nombre cuando sea obligatorio.
- Entidades desactivadas usadas por contenido activo.

## Validaciones GPS

- Radio de interacción menor que la tolerancia GPS mínima.
- Distancia de ataque mayor que distancia de persecución.
- Distancia de persecución menor que distancia de visión.
- Radio compartido demasiado pequeño para el tipo de contenido.
- Coordenadas inválidas.
- Pines colocados en puntos claramente inaccesibles cuando pueda detectarse.

## Validaciones de referencias

Cada contenido debe poder responder a **Usado por**.

Antes de publicar, comprobar:

- IDs inexistentes.
- IDs duplicados.
- Relaciones circulares no permitidas.
- Tiendas que usan objetos eliminados.
- NPC que usan diálogos eliminados.
- Misiones que apuntan a pines inexistentes.
- Loot que apunta a objetos inexistentes.
- Rutas que usan monstruos eliminados.

## Resultados visuales

El panel debe mostrar:

- Total de errores críticos.
- Total de advertencias.
- Total de elementos revisados.
- Porcentaje del mundo válido.
- Lista filtrable por módulo y severidad.

Ejemplo:

```text
Validación completada

3 errores críticos
7 advertencias
248 elementos correctos

[Ver errores] [Corregir automáticamente] [Volver al mapa]
```

## Corrección automática

Solo aplicar correcciones seguras y reversibles:

- Asignar icono por defecto.
- Eliminar referencias duplicadas exactas.
- Ajustar radios GPS por debajo del mínimo.
- Cerrar zonas si existe un polígono válido pendiente.
- Marcar como inactivo contenido sin referencia.
- Sustituir valores vacíos por valores por defecto configurados.

Toda corrección automática debe:

- Mostrar vista previa.
- Crear entrada de undo/redo.
- Guardar historial.
- Indicar exactamente qué cambió.

## Publicación segura

La publicación debe ser por etapas:

1. Validar.
2. Generar vista previa de cambios.
3. Crear versión candidata.
4. Exportar archivos.
5. Ejecutar validación final.
6. Publicar.
7. Guardar historial y versión.

No se publica si existen errores críticos.

## Versiones y rollback

Cada publicación debe guardar:

- Número de versión.
- Fecha y hora.
- Usuario.
- Resumen de cambios.
- Resultado de validación.
- Archivos exportados.
- Hash o identificador de versión.

Debe existir botón **Restaurar versión anterior**.

## Rendimiento

El validador debe advertir sobre:

- Exceso de pines en una zona pequeña.
- Demasiados enemigos activos posibles.
- Demasiadas rutas superpuestas.
- Catálogos excesivamente grandes.
- Entidades duplicadas.
- Contenido no usado.

Estas alertas no bloquean por defecto, salvo que superen límites configurados.

## Integración con el mapa

Desde un error debe poderse:

- Centrar el mapa en el elemento.
- Seleccionarlo.
- Abrir su inspector.
- Corregir sin abandonar la validación.

## Pruebas necesarias

- Pin sin referencia bloquea publicación.
- Ruta sin enemigos bloquea publicación.
- Tienda sin catálogo bloquea publicación.
- Advertencia no bloqueante permite continuar con confirmación.
- Corrección automática genera undo/redo.
- Rollback restaura versión anterior.
- Exportación no deja referencias rotas.

## Criterio de completado

El módulo se considera completo cuando:

- Detecta errores de todos los módulos principales.
- Navega desde el error al elemento exacto.
- Bloquea publicación cuando corresponde.
- Genera historial de validación.
- Permite rollback.
- Tiene pruebas automatizadas para los errores críticos principales.
