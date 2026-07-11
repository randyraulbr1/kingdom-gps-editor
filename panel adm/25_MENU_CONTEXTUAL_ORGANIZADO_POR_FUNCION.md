# Menú contextual del mapa organizado por función

## Objetivo

El clic derecho del Editor del Mundo debe abrir un menú contextual claro, ordenado y dependiente del lugar donde se hizo clic. No debe mostrar una lista larga y desordenada de acciones. Las opciones deben agruparse por función y contexto.

## Comportamiento general

- Cada clic derecho cierra cualquier menú contextual anterior y abre uno nuevo en la posición actual.
- El menú siempre debe quedar completamente visible dentro de la ventana.
- Si se abre cerca del borde derecho, debe desplazarse hacia la izquierda.
- Si se abre cerca del borde inferior, debe desplazarse hacia arriba.
- Nunca debe quedar cortado, oculto detrás de paneles ni fuera del área visible.
- Debe cerrarse al hacer clic fuera, pulsar Escape, cambiar de herramienta o empezar otra acción.
- El clic derecho no debe mover el mapa ni crear entidades accidentalmente.
- Las opciones deshabilitadas deben explicar por qué no están disponibles.

## Menú al hacer clic en espacio vacío

### Crear contenido

- Crear pin
- Crear NPC
- Crear tienda
- Crear enemigo
- Crear cofre
- Crear recurso
- Crear misión

### Crear estructuras del mapa

- Iniciar zona
- Iniciar ruta normal
- Iniciar ruta de enemigos
- Crear punto de misión

### Importar desde OpenStreetMap

- Buscar farmacias
- Buscar hospitales
- Buscar gasolineras
- Buscar supermercados
- Buscar tiendas
- Buscar otra categoría

### Herramientas

- Pegar entidad copiada
- Centrar mapa aquí
- Medir distancia desde aquí
- Añadir marcador temporal

## Menú al hacer clic sobre un pin

### Abrir

- Abrir interacción
- Probar interacción
- Abrir inspector

### Editar

- Mover
- Duplicar
- Cambiar tipo
- Cambiar icono
- Asignar contenido
- Desvincular contenido

### Relaciones

- Ver usado por
- Ver misión relacionada
- Ver ruta relacionada
- Ver tienda, NPC, diálogo, enemigo o loot asignado

### Estado

- Activar o desactivar
- Publicar o despublicar
- Ver errores

### Eliminar

- Eliminar pin
- Eliminar pin y contenido solo si no tiene otras referencias

## Menú al hacer clic dentro de una zona

### Zona

- Abrir inspector de zona
- Cambiar nombre
- Cambiar color
- Editar puntos
- Duplicar zona
- Finalizar edición

### Crear dentro de la zona

- Crear varios pines
- Importar lugares reales
- Crear tiendas desde OpenStreetMap
- Crear NPC
- Crear recursos
- Crear cofres
- Crear enemigos

### Validación

- Comprobar accesibilidad
- Buscar puntos fuera de carretera
- Ver entidades de la zona
- Simular jugador dentro de la zona

### Eliminar

- Vaciar contenido de la zona
- Eliminar zona sin borrar entidades
- Eliminar zona y entidades

## Menú al hacer clic sobre una ruta

### Ruta

- Abrir inspector
- Editar puntos
- Añadir punto
- Eliminar punto
- Cambiar color
- Cambiar tipo
- Invertir dirección

### Ruta de enemigos

- Asignar lista de enemigos
- Configurar niveles
- Configurar tiempo mínimo y máximo de aparición
- Configurar radio compartido
- Configurar visión, persecución y ataque
- Probar spawn
- Simular jugador

### Relaciones

- Ver misiones conectadas
- Ver enemigos conectados
- Ver recompensas conectadas

### Eliminar

- Eliminar ruta
- Eliminar ruta y spawns asociados

## Menú al hacer clic sobre un enemigo

- Probar detección
- Probar persecución
- Probar ataque
- Abrir enemigo asignado
- Cambiar nivel
- Cambiar radios GPS
- Cambiar loot
- Mover
- Duplicar
- Desactivar
- Eliminar

## Menú al hacer clic sobre una tienda

- Abrir tienda
- Probar compra
- Abrir catálogo
- Asignar otra tienda
- Crear y asignar tienda
- Ver usado por
- Mover
- Duplicar
- Desactivar
- Eliminar

## Menú al hacer clic sobre un NPC

- Abrir diálogo
- Probar interacción
- Asignar diálogo
- Asignar misión
- Asignar tienda
- Crear y asignar contenido
- Ver usado por
- Mover
- Duplicar
- Desactivar
- Eliminar

## Menú al hacer clic sobre un cofre o recurso

### Cofre

- Abrir prueba
- Asignar tabla de recompensas
- Configurar uso único o repetible
- Configurar respawn
- Ver usado por

### Recurso

- Probar recolección
- Asignar recurso
- Configurar cantidad
- Configurar herramienta requerida
- Configurar respawn
- Ver usado por

## Diseño visual

- Usar encabezados de sección.
- Usar separadores entre grupos.
- Mostrar iconos coherentes.
- No mostrar más de siete u ocho opciones principales sin submenús.
- Usar submenús para categorías extensas.
- Mostrar atajos de teclado cuando existan.
- Mantener la acción destructiva "Eliminar" separada y al final.
- Mostrar confirmación para acciones destructivas.

## Reglas técnicas

1. El menú debe renderizarse en un portal por encima del mapa y paneles.
2. Debe medir su tamaño real antes de fijar la posición final.
3. Debe recalcular posición en cambios de tamaño de ventana.
4. Debe tener un único estado global; nunca pueden quedar dos menús abiertos.
5. Un nuevo clic derecho debe actualizar coordenadas y contexto aunque el menú ya esté abierto.
6. Debe impedir propagación al mapa y al navegador.
7. Debe ser navegable con teclado y accesible.
8. Debe funcionar igual con mouse y trackpad.

## Pruebas mínimas

- Abrir en cada esquina y confirmar que no se corta.
- Abrir en el centro y luego inmediatamente en otro punto.
- Abrir sobre pin, zona, ruta y espacio vacío.
- Hacer clic fuera y comprobar que cierra.
- Pulsar Escape.
- Cambiar de herramienta con el menú abierto.
- Probar con panel lateral abierto y cerrado.
- Probar en ventanas pequeñas y grandes.
- Confirmar que nunca quedan dos menús superpuestos.

## Criterio de terminado

El menú contextual se considera completo cuando siempre abre en el lugar correcto, nunca queda oculto, cambia sus opciones según el elemento seleccionado y organiza todas las acciones por función sin mostrar listas confusas.