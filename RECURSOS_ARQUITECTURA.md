# Administrador de Recursos del Juego (estilo RPG Maker, modular)

> Arquitectura y plan por fases. La idea central: **separar la base de datos lógica
> de los recursos visuales**. La base de datos guarda **referencias** a imágenes
> (no copia las imágenes dentro de cada fila). El servidor envía **IDs y estados**,
> no imágenes; el cliente descarga **paquetes de recursos** una sola vez y los
> verifica por hash.

## Principio server-authoritative

- Ningún **daño, rareza, dinero o estadística** depende de archivos locales. El
  servidor es la única fuente de verdad de la lógica del juego.
- Los archivos locales (imágenes, sprites, audio) son **solo presentación**.

## Modelo de referencia (no imágenes embebidas)

Un objeto/enemigo/etc. **referencia** un recurso, nunca lo incrusta:

```json
{ "sheetId": "items_sheet_01", "x": 96, "y": 160, "width": 32, "height": 32 }
```

o una imagen individual de la biblioteca:

```json
{ "iconId": 1234 }
```

La fila del objeto guarda **solo** esa referencia. La imagen vive en la Biblioteca
de Iconos / Sprite Sheets y se entrega vía paquetes.

## Módulos

1. **Base de datos de objetos** — cada objeto elige su icono desde: imagen
   individual, sprite sheet, celda de una cuadrícula o selección manual. Guarda la
   referencia (arriba), no la imagen.
2. **Biblioteca de iconos** — importar PNG/WebP/JPG y sprite sheets; definir tamaño
   de celda; dividir automáticamente; seleccionar celdas; etiquetas; búsqueda;
   filtros; vista previa; "usado por" (qué contenidos usan cada recurso).
3. **Biblioteca de sprite sheets** — hojas con su cuadrícula, celdas nombradas,
   y referencias reutilizables.
4. **Administrador de enemigos** — icono, retrato, sprite sheet, animaciones,
   sonidos, efectos, escalado, punto de origen, hitbox. Animaciones: idle, walk,
   run, attack, hurt, death, skill, crouch, slide; 4 u 8 direcciones, varios frames.
5. **Editor de animaciones** — seleccionar regiones; cuadrícula opcional; asignar
   acción y dirección; ordenar frames; FPS; loop; puntos de anclaje; vista previa;
   prueba en mapa.
6. **Generador de paquetes de recursos** — paquetes separados: `base`, `items`,
   `enemies`, `maps`, `ui`, `audio`.
7. **Manifiesto y verificación de integridad** — manifiesto de recursos, SHA-256
   por archivo, versión de paquete, verificación de integridad, descarga automática
   si un archivo falta o cambió.

## Paquetes de recursos

- El cliente descarga cada paquete **una sola vez** y lo guarda localmente.
- El servidor solo envía **IDs y estados**, no imágenes completas.
- **Actualizaciones diferenciales**: si solo cambia `enemies`, no se vuelven a
  descargar `items`, `ui` ni `maps`.

### Manifiesto (formato propuesto)

```json
{
  "packageVersion": 12,
  "packages": {
    "items":   { "version": 5, "files": [{ "path": "items_sheet_01.png", "sha256": "…", "bytes": 20480 }] },
    "enemies": { "version": 3, "files": [{ "path": "goblin.png", "sha256": "…", "bytes": 10240 }] }
  }
}
```

El cliente compara su manifiesto local con el del servidor y descarga solo los
paquetes cuya `version`/`sha256` cambió.

## Interfaz (menú lateral)

```
Contenido
  - Mundo         (Editor de Mundo, Mapas, Eventos)
  - Personajes    (NPC, Monstruos, Animales, Mascotas)
  - Objetos       (General, Armas, Armaduras, Herramientas, Recursos, Comida, Cultivos, Construcciones, Loot)
  - Misiones      (Misiones, Diálogos)
  - Fabricación   (Fabricación, Recetas, Profesiones)
  - Economía

Recursos
  - Iconos
  - Sprite Sheets
  - Animaciones   (próximamente)
  - Sonidos       (próximamente)
  - Música        (próximamente)
  - Paquetes      (próximamente)

Herramientas      (Probar Juego, Jugadores, Utilidades)
Sistema           (Configuración)
```

Los **subtipos van dentro de cada módulo/carpeta**, no todos sueltos en la barra.

## Estado / fases

- **Fase 1 (hecha):** este documento + reorganización del menú lateral a la
  estructura Contenido/Recursos con subtipos anidados.
- **Fase 2:** modelo de referencia de icono en objetos (`{iconId}` o
  `{sheetId,x,y,width,height}`), selector desde la Biblioteca de Iconos, y "usado por".
- **Fase 3:** Biblioteca de sprite sheets con cuadrícula + celdas nombradas.
- **Fase 4:** generador de paquetes + manifiesto + SHA-256 + verificación.
- **Fase 5:** cliente del juego: descarga de paquetes, caché local, verificación,
  render de objetos/enemigos por referencia (imagen, no emoji; imagen por defecto
  si falta). Actualizaciones diferenciales.
- **Fase 6:** administrador de enemigos + editor de animaciones completos.

## Regla del proyecto

Cada fase se cierra solo con: código, pruebas, typecheck, build, documentación y
commit. Nada se marca hecho si es solo documentación.
