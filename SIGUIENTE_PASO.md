# SIGUIENTE PASO — Punto de retorno de Kingdom GPS Editor

> Documento de continuidad. Léelo primero al retomar el proyecto (en el PC o
> desde el móvil). Mantenerlo actualizado al final de cada sesión.
> Última actualización: 2026-07-10.

## Qué es esto

Editor de escritorio (herramienta interna, **no es el juego**) para crear y
mantener el contenido del MMORPG **Kingdom GPS** y exportarlo.
Stack: Electron + React + TypeScript + Vite + libSQL/Kysely + Zustand +
dockview + Leaflet + Tailwind + Vitest.

## Dónde está todo

- **Código (en el PC):** `C:\Users\RANDY\Desktop\dfgj\KingdomGPS\editor`
- **Repositorio:** https://github.com/randyraulbr1/kingdom-gps-editor (rama `main`)
- **Documentación oficial (fuente de verdad):** carpeta [`panel adm/`](panel%20adm/README.md)
  dentro del repo. El repo `tcodm-web` quedó **obsoleto para documentación**.
- **Roadmap sincronizado con el código:** [`panel adm/00_ROADMAP.md`](panel%20adm/00_ROADMAP.md)
- **Estado detallado:** [`INFORME_ESTADO_PROYECTO.md`](INFORME_ESTADO_PROYECTO.md)

> Nota: la carpeta `C:\Users\RANDY\Desktop\MiProyectoKGPS` NO es el código: es un
> *proyecto de datos* (una base SQLite) que genera la propia app.

## Qué está hecho (resumen)

- ✅ Infraestructura: proyectos, BD con migraciones, IPC tipado, undo/redo,
  exportadores, biblioteca de iconos.
- ✅ Módulo **Objetos** (patrón de referencia).
- ✅ **Framework de contenido genérico** (`src/renderer/src/shared/content/`):
  ContentGrid/List/Table, toolbar, store y panel reutilizables.
- ✅ Módulo **Armas** montado sobre ese framework (migración `006_weapons`).
- ✅ **Editor de Mundo**: mapa GPS (Leaflet, varios estilos, vista recordada),
  entidades, menú contextual estilo PC, **zonas** (polígonos: crear/renombrar/
  color/eliminar), **importar lugares reales de OpenStreetMap** dentro de una
  zona, **exportar mundo a `export/world.json`**, indicador de estado de sync.

## Qué sigue (elige uno al retomar)

1. **Completar Armas** — añadir undo/redo y exportación JSON (Objetos ya los
   tiene), y **migrar Objetos al framework** de contenido para unificar.
2. **Producir más módulos en serie** — Armaduras, Herramientas, Recursos,
   Comida, NPC, Monstruos… (ahora es barato: repetir el patrón de Armas).
3. **Fase 4 — Gestor de Sistemas** (doc 04): Monaco Editor, versiones
   candidatas, diff, rollback. La fase más grande.
4. **Otras fases documentadas**: Vista del juego (doc 03), Generador de misiones
   GPS (doc 08), Zonas por jugador (doc 12), Seguridad/Tops (docs 09/13, requieren
   servidor).

Recomendación por defecto: **opción 1 o 2** (avance de producto de bajo riesgo).

## Cómo continuar el trabajo

### Flujo de git (cualquier dispositivo)
Los cambios se commitean y se suben al repo:
```bash
git add -A
git commit -m "mensaje claro"
git push
```
El remoto (`origin`) y las credenciales ya están configurados en el PC.

### Verificar antes de dar algo por hecho (en el PC)
```bash
cd KingdomGPS/editor
npm run typecheck   # tsc main + renderer
npm test            # vitest
npm run build       # genera dist/kingdomgps-editor Setup 0.1.0.exe
```
El instalador se copia al Escritorio como `KingdomGPS-Editor-Setup.exe`.

### Límites conocidos del entorno
- **Solo el PC (Windows) puede compilar el `.exe` y ejecutar la app.** Desde el
  móvil se puede planificar, editar y subir código, pero no compilar/ejecutar.
- En el entorno del agente, `npm run dev` no arranca porque `ELECTRON_RUN_AS_NODE`
  está definida (Electron corre como Node plano). Workaround: `unset
  ELECTRON_RUN_AS_NODE` (o `Remove-Item Env:ELECTRON_RUN_AS_NODE`) antes.

## Reglas del proyecto

- La documentación nueva se crea en `panel adm/` (fuente única de verdad).
- Al implementar o cambiar algo, actualizar el roadmap y/o el informe en el
  mismo cambio (código y documentación sincronizados).
- Ver la guía de calidad: [`panel adm/11_GUIA_DE_INTEGRACION_Y_CALIDAD.md`](panel%20adm/11_GUIA_DE_INTEGRACION_Y_CALIDAD.md).

## Deuda técnica anotada

- Objetos aún usa sus propios componentes (no migrado al framework todavía).
- Armas no tiene undo/redo ni export JSON aún.
- Bundle del renderer sin code-splitting (~2.4 MB); revisar antes de sumar
  muchos módulos.
- `npm audit`: vulnerabilidades en dependencias de build (revisar antes de un
  release público). Instalador sin firmar.
