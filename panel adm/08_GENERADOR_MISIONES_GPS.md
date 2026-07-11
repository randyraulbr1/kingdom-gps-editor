# Generador e importador de cadenas de misiones GPS

## Objetivo

Importar archivos TXT, YAML o JSON con cadenas de misiones conectadas y convertirlas en misiones, dependencias, recompensas y pines GPS reales sobre calles o senderos accesibles.

## Vista previa en el mapa

El Panel ADM debe abrir el mapa y mostrar todos los pines de la cadena en orden.

Cada misión debe mostrarse con:

- Número de paso
- Nombre
- Tipo
- Estado de validación
- Radio de activación
- Recompensa

Los pines deben unirse visualmente con una línea siguiendo el orden de la cadena:

`Misión 1 → Misión 2 → Misión 3 → ...`

La línea debe actualizarse en tiempo real cuando se mueva un pin.

## Edición manual

El administrador debe poder:

- Arrastrar cualquier pin
- Editar latitud y longitud
- Cambiar el orden de las misiones
- Insertar una misión entre otras dos
- Eliminar un paso
- Duplicar una misión
- Recalcular la ruta
- Revalidar accesibilidad

Al mover un pin:

1. Actualizar coordenadas.
2. Recalcular el tramo anterior y siguiente.
3. Actualizar distancia total.
4. Validar que siga siendo caminable.
5. Marcar el pin como modificado.

## Colores

- Verde: ubicación válida
- Amarillo: necesita revisión
- Rojo: ubicación inválida o inaccesible
- Azul: pin seleccionado
- Gris: misión desactivada

## Panel lateral

Mostrar:

- Lista ordenada de misiones
- Distancia entre cada pin
- Distancia total
- Tiempo estimado caminando
- Errores
- Advertencias
- Referencias a NPC, objetos, enemigos y recompensas

Al seleccionar una misión en la lista, el mapa debe centrarse en su pin.

## Seguridad geográfica

No usar coordenadas aleatorias.

Cada ubicación debe:

- Estar cerca de una calle, camino o sendero peatonal
- Evitar agua
- Evitar autopistas y vías peligrosas
- Evitar lugares claramente inaccesibles
- Respetar distancia mínima y máxima entre pasos
- Requerir aprobación manual antes de publicar

## Fases

### Fase A
- Importación TXT/YAML/JSON
- Validación de estructura
- Creación de la cadena local

### Fase B
- Mapa
- Pines numerados
- Líneas entre misiones
- Arrastrar y reordenar

### Fase C
- Validación peatonal
- Cálculo de distancias y rutas
- Alertas de accesibilidad

### Fase D
- Guardado SQLite
- Exportación JSON
- Publicación y sincronización con servidor

## Regla principal

Ninguna cadena se publica directamente. Primero se muestra completa sobre el mapa, conectada por líneas, se revisa manualmente y después se aprueba.
