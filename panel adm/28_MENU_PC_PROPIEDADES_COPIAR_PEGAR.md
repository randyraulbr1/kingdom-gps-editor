# 28 — Menú contextual estilo PC: Propiedades, copiar y pegar

## Objetivo

El Editor del Mundo debe comportarse como una aplicación de escritorio conocida. Al hacer clic derecho sobre cualquier elemento del mapa debe aparecer un menú contextual claro, ordenado y consistente.

La opción **Propiedades** debe aparecer en la parte inferior del menú, como ocurre en muchos exploradores de archivos de PC.

También deben existir las acciones **Copiar**, **Pegar**, **Duplicar**, **Cortar** y **Eliminar**, respetando el tipo de elemento seleccionado.

---

## Menú contextual base

Cuando el usuario hace clic derecho sobre una entidad del mapa, el menú debe incluir, cuando corresponda:

1. Abrir / Probar interacción
2. Editar
3. Copiar
4. Cortar
5. Pegar
6. Duplicar
7. Mover
8. Desactivar / Activar
9. Eliminar
10. Propiedades

**Propiedades** debe aparecer siempre al final, separado visualmente del resto.

---

## Copiar

La opción **Copiar** guarda en un portapapeles interno del editor:

- tipo de entidad;
- referencia al contenido asignado;
- icono;
- configuración GPS;
- valores de interacción;
- etiquetas;
- estado activo/inactivo;
- referencias válidas;
- configuración específica del tipo.

No debe copiar:

- ID interno original;
- historial;
- fecha de creación;
- coordenadas exactas, salvo que se elija “pegar en la misma posición”;
- datos de ejecución temporal.

---

## Pegar

Al hacer clic derecho sobre un punto vacío del mapa, si existe contenido compatible en el portapapeles, debe aparecer **Pegar aquí**.

El nuevo elemento debe:

- recibir un ID nuevo;
- conservar su configuración;
- colocarse en las coordenadas del clic derecho;
- mantener referencias válidas a tiendas, NPC, misiones, monstruos, loot o recursos;
- entrar en undo/redo;
- quedar seleccionado al crearse;
- abrir automáticamente Propiedades si la opción está activada.

---

## Pegar especial

Debe existir un submenú **Pegar especial** con opciones:

- Pegar aquí.
- Pegar conservando desplazamiento.
- Pegar solo apariencia.
- Pegar solo configuración GPS.
- Pegar solo referencias.
- Pegar múltiples copias.
- Pegar dentro de la zona seleccionada.
- Pegar sobre varios elementos seleccionados.

---

## Duplicar

**Duplicar** crea una copia inmediata a pocos metros de distancia visual para evitar que quede exactamente debajo del original.

Debe permitir:

- duplicar una entidad;
- duplicar varios elementos seleccionados;
- duplicar una ruta;
- duplicar una zona;
- duplicar un grupo completo;
- conservar las referencias o reemplazarlas durante el proceso.

Atajo recomendado:

- `Ctrl + D` para duplicar.

---

## Cortar

**Cortar** debe marcar visualmente el elemento como pendiente de mover.

Al pegar:

- se conserva el mismo ID;
- cambia la posición;
- se actualizan sus coordenadas;
- no se crea una copia;
- la operación entra en undo/redo.

Atajos:

- `Ctrl + X` cortar.
- `Ctrl + C` copiar.
- `Ctrl + V` pegar.

---

## Propiedades

Al pulsar **Propiedades** debe abrirse el panel lateral unificado y mostrar la entidad seleccionada.

Debe funcionar para:

- pines;
- tiendas;
- NPC;
- misiones;
- monstruos;
- rutas;
- zonas;
- cofres;
- recursos;
- eventos;
- grupos de entidades.

Cuando se abre Propiedades desde clic derecho:

1. se selecciona el elemento;
2. se centra visualmente si está fuera de vista;
3. se abre el inspector lateral;
4. se muestra la pestaña General;
5. el usuario puede cambiar de pestaña a Configuración, Interacciones, Referencias, Historial o Pruebas.

---

## Compatibilidad por tipo

No todas las opciones deben mostrarse para todo.

Ejemplos:

### Tienda

- Abrir tienda.
- Probar interacción.
- Copiar.
- Duplicar.
- Cambiar catálogo.
- Mover.
- Eliminar.
- Propiedades.

### NPC

- Abrir diálogo.
- Probar misión.
- Copiar.
- Duplicar.
- Asignar diálogo.
- Asignar misión.
- Mover.
- Eliminar.
- Propiedades.

### Ruta

- Editar puntos.
- Probar spawn.
- Copiar configuración.
- Duplicar ruta.
- Invertir dirección.
- Eliminar.
- Propiedades.

### Zona

- Editar vértices.
- Importar lugares.
- Copiar configuración.
- Duplicar zona.
- Crear contenido dentro.
- Eliminar.
- Propiedades.

---

## Selección múltiple

Si hay varios elementos seleccionados y se hace clic derecho sobre uno de ellos, el menú debe reconocer la selección múltiple.

Opciones:

- Copiar selección.
- Cortar selección.
- Duplicar selección.
- Eliminar selección.
- Cambiar capa.
- Cambiar estado.
- Abrir propiedades múltiples.

El inspector debe mostrar solo los campos comunes y no sobrescribir valores diferentes sin confirmación.

---

## Portapapeles interno

El editor debe mantener un portapapeles propio, independiente del sistema operativo.

Debe guardar:

- tipo de contenido;
- cantidad de elementos;
- fecha de copia;
- compatibilidad;
- resumen de referencias;
- vista previa.

Debe existir una pequeña notificación:

> 3 elementos copiados.

Y al pegar:

> 3 elementos pegados correctamente.

---

## Seguridad

Antes de pegar o duplicar se deben validar:

- referencias existentes;
- coordenadas válidas;
- capa desbloqueada;
- permisos de edición;
- límites de densidad;
- zonas prohibidas;
- elementos duplicados accidentales.

Si una referencia ya no existe, el nuevo elemento debe crearse como incompleto y quedar marcado para corrección, nunca fallar silenciosamente.

---

## Posicionamiento del menú

El menú contextual debe:

- reemplazar al menú anterior;
- reposicionarse si toca el borde derecho;
- abrir hacia arriba si no cabe debajo;
- no quedar debajo del inspector;
- no quedar oculto por el mapa;
- permitir scroll si es muy largo;
- cerrarse con clic fuera o Escape.

---

## Atajos

- `Ctrl + C`: copiar.
- `Ctrl + X`: cortar.
- `Ctrl + V`: pegar.
- `Ctrl + D`: duplicar.
- `Delete`: eliminar.
- `Alt + Enter`: abrir Propiedades.
- `Escape`: cerrar menú o cancelar operación.

---

## Criterios de aceptación

- Propiedades aparece siempre al final del menú contextual.
- Copiar y pegar funcionan con pines, rutas, zonas y selección múltiple.
- Pegar crea IDs nuevos salvo en Cortar.
- Pegar usa la posición del clic derecho.
- El menú nunca queda cortado por los bordes.
- Un nuevo clic derecho actualiza la posición y reemplaza el menú previo.
- Todas las acciones participan en undo/redo.
- Las referencias se validan antes de completar la operación.
- El usuario recibe confirmación visual.
