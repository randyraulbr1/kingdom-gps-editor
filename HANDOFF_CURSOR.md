# TRASPASO — Continuar Kingdom GPS Editor (para Cursor / ChatGPT / cualquier IA)

> Documento de continuidad para trabajar en paralelo. Si Claude se queda sin créditos,
> Cursor o ChatGPT pueden seguir desde aquí sin perder contexto. **Léelo entero antes de tocar nada.**
> Última actualización: 2026-07-13.

---

## 0. Regla de oro del proyecto

- **Nada se marca como "hecho" si solo hay documentación.** Tiene que haber código, persistencia,
  pruebas, typecheck limpio y build correcto.
- No avanzar al siguiente bloque hasta que el anterior tenga: `typecheck` limpio, `tests` verdes y `build` correcto.
- Cada vez que termines algo: actualizar `SIGUIENTE_PASO.md`, `INFORME_ESTADO_PROYECTO.md` y
  `panel adm/00_ROADMAP.md`; commit claro; push; y publicar versión (build de Windows) para poder probar.
- Ser honesto: si algo está solo documentado o bloqueado por datos externos, decirlo.

---

## 1. Los dos repositorios

### A) Editor (esto es lo que se edita casi siempre)
- **Repo:** `randyraulbr1/kingdom-gps-editor`
- **Rama de trabajo:** `claude/kingdom-gps-editor-setup-7i6utj`
- **Qué es:** app de escritorio (Electron + React + TypeScript + Vite + libSQL/Kysely + Zustand +
  Leaflet + Tailwind + Vitest) para crear y mantener el contenido del juego (mundo, pines, items,
  armas, armaduras, monstruos, iconos, sprites…).
- **Local del usuario (Windows):** `C:\Users\RANDY\Desktop\dfgj\KingdomGPS\editor`
  (se actualiza con `git pull` de la rama; hay `actualizar.bat` y `abrir.bat`).

### B) Juego (la web en vivo)
- **Repo:** `randyraulbr1/github-pages`  (nombre del paquete: `mariel-explorer`)
- **Rama de trabajo:** `claude/web-rpg-gps-game-n3ybow`
- **Desplegado en Render:** `https://mariel-online.onrender.com`  (Service ID `srv-d95e2gcvikkc73dko1p0`)
- **Estructura:** cliente estático (`index.html`, `js/`, `css/`, `online/`) + **servidor Node** en `server/`.
- **Front del juego:** GitHub Pages / `https://tcodm.com`. **API:** el servicio de Render de arriba.

---

## 2. Comandos de verificación (en el repo del EDITOR)

```bash
# instalar (el binario de electron no se puede bajar en algunos entornos):
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci --ignore-scripts

npm run typecheck        # tsc node + web, debe salir limpio
npm test                 # vitest — ahora mismo 176/176 en verde
npx electron-vite build  # main + preload + renderer (NO uses `npm run build`: incluye
                         # electron-builder --win, que solo corre en Windows)
```

- Empaquetar el `.exe` **solo funciona en Windows** → se hace en **GitHub Actions**
  (workflow `.github/workflows/build-windows.yml`, corre en `windows-latest`).
- Disparar build: en GitHub, Actions → "Compilar instalador Windows" → Run workflow
  (rama `claude/kingdom-gps-editor-setup-7i6utj`). Deja el `.exe` como artifact.

### Limitaciones del entorno de Claude (por si Cursor no las tiene)
- No se pueden **empujar tags** desde la sesión de Claude (403, credenciales por rama).
  El **auto-update por Release** necesita un tag `vX.Y.Z` → **lo tiene que crear el usuario**:
  `git tag v0.3.0 && git push origin v0.3.0`  (dispara la Release con instalador + `latest.yml`).
- `curl` directo a `api.github.com` da 403 en la sesión de Claude → usar la API/UI de GitHub.
- Cursor en la PC del usuario normalmente **sí** puede pushear tags y bajar electron; aprovéchalo.

---

## 3. Estado actual (qué ya funciona en el EDITOR)

Todo lo siguiente está en código, con persistencia y pruebas, typecheck/tests/build en verde:

- Infra: proyectos, base de datos (migraciones 001–009 idempotentes), IPC tipado (`window.api`),
  exportadores, undo/redo (CommandBus + `change_log`).
- Módulos de contenido: Iconos, Objetos, Armas, Armaduras, Monstruos (bestiario).
- **Editor de Mundo** (Leaflet): pines, zonas (polígonos), importación de lugares reales (OSM),
  exportación del mundo, más zoom (overzoom z22), escaneo OSM con conteo por tipo.
- Menú contextual estilo PC (copiar/cortar/pegar/duplicar/activar/eliminar/Propiedades + atajos).
- Pines funcionales con su ficha/modal y simulador: **Tienda, NPC (con diálogos como grafo y
  misiones con pasos que apuntan a pines), Monstruo, Cofre/Loot, Recurso**, y **Rutas de enemigos**
  (polilíneas, tabla `enemy_routes`).
- Validador del mundo (bloquea export si hay errores), búsqueda global + capas con contador/bloqueo,
  administrador de referencias y borrado seguro ("usado por", ⚠ referencias rotas).
- **Sprite Sheet / Probador de personaje** (grupo Herramientas): editor de hoja de sprites + arena
  WASD con colisiones/cámara/HUD, export/import JSON, sprite de ejemplo.
- **Probar Juego** (Herramientas): carga la web del juego en un `<webview>` con recargar, limpiar
  caché/datos, DevTools y tamaños PC / Teléfono (Samsung S26U) / Tablet; y "Probar códigos"
  (playground con inventario, barras de vida/hambre/XP, menú de amigos, editar HTML/CSS/JS).
- Barra lateral reorganizada: "Contenido" plegable arriba; Herramientas; Configuración al fondo.
- Auto-actualización: Configuración ▸ Actualizaciones (electron-updater + GitHub Releases).
- **Estado de sincronización por pin** (burbuja en el marcador):
  gris = solo local · azul = subiendo · **verde = ya sale en el juego** · rojo = falló / token.
- **"Subir al mundo"** (clic derecho en un pin) → sube ese pin al servidor del juego (ver §4).
- **Configuración ▸ Servidor** (URL + token, en `userData/server.json`) usado por "Subir al mundo".
- **Configuración ▸ Captura de pantalla**: guarda `captura-N.png` (nombre único) y abre la carpeta.

Versión actual del editor: **0.3.0** (`package.json`).

---

## 4. Contrato REAL de "Subir al mundo" (ya implementado, verificado contra el código del juego)

`window.api.worldEditor.publishEntity(worldId)` → handler `worldEditor:publishEntity`
(`src/main/ipc/handlers/worldEditor.ts`). Hace lo mismo que el propio cliente del juego
(`github-pages/js/online/sync_servidor.js` → `adminUpsert`):

- **POST** `${url}/api/player/world/upsert`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <JWT_admin>`
- **Body:** `{ id, type, x, y, data }`  donde `x = lat`, `y = lng`, `data.pos = [lat, lng]`.
- **Tipos que acepta el servidor** (`server/worldContent.js` → `TYPE_TO_CAMPO`):
  `item | enemy | treasure | shop | mission | chest`.
- **Mapa editor → juego** (en el handler, `GAME_TYPE_BY_ENTITY`):
  `object→item, enemy→enemy, chest→chest, shop→shop, quest→mission, resource→treasure`.
  **NPC / evento / marcador NO existen en el juego** → se marcan en rojo con mensaje claro
  (no se manda un `type` inválido).
- **Errores traducidos:** 401 (sesión/token), 403 (sin permiso admin), 429 (rate limit),
  o el `error` del payload.
- Rutas de lectura pública del juego: `GET /api/world/objects`, `GET /api/world/missions`.

### El TOKEN que hay que poner en Configuración ▸ Servidor
Es el **JWT de admin del juego**. Se obtiene iniciando sesión como admin en el juego; el cliente
lo guarda en `localStorage` con la clave **`mariel_online_token`**. Copiar ese valor y pegarlo en el
editor. (Sin un token con rol admin, el servidor responde 403 → pin rojo "sin permiso de admin".)

---

## 5. TAREA PENDIENTE AHORA MISMO (la que hay que continuar)

**Objetivo del usuario:** quitar el botón/menú de administrador *de dentro del juego* y que toda
esa administración se haga desde este editor (que ya lo hace vía pines + "Subir al mundo").
El usuario eligió: **"quitarlo del todo"** y commitear a la rama del juego `claude/web-rpg-gps-game-n3ybow`.

### ⚠️ AVISO CRÍTICO antes de borrar nada del juego
`github-pages/js/admin/admin.js` (**6760 líneas**) NO es solo el panel de admin: es también
**el motor que carga y dibuja TODO el mundo para todos los jugadores**. Hay **~110 usos** de
`Admin.cargar()`, `Admin.pintarMapaCompleto()`, `Admin.publicado`, `Admin.misionesTodas()`,
`Admin.pos()`, etc. desde `js/mapa`, `js/misiones`, `js/cofres`, `js/enemigos`, `js/principal.js`…

👉 **Si borras `admin.js` entero, el mapa deja de cargar para TODOS los jugadores (rompe el juego).**
NO lo hagas.

### Plan seguro acordado (esto es lo que hay que implementar)
Quitar SOLO la **UI de administrador visible** y el **modo edición dentro del juego**, dejando
intacto el motor de carga/dibujo del mundo:

1. En `index.html`, eliminar estos elementos (IDs) y su markup asociado:
   - `#btn-bloqueo-admin` (línea ~174, "Entrar como administrador")
   - `#btn-admin-confirmar`, `#btn-admin-salir-modo` (~268-269)
   - `#btn-admin` (~302, botón 🛠️ del HUD)
   - `#opcion-admin` (~850, opción "Admin" del menú de opciones)
   - `#ventana-admin` (~874, la ventana completa de administrador: crear misión/tesoro/objeto/
     cofre/enemigo/tienda, organizar pines, combate, sistema…)
2. Neutralizar el código que **muestra/activa** esa UI y el **modo edición** (sin tocar la carga
   del mundo). Puntos a revisar (todos deben quedar sin romper si los elementos ya no existen):
   - `js/opciones/opciones.js` (~21, ~27): `Admin.solicitarAcceso()` desde el menú de opciones.
   - `js/principal.js` (~247-258): `Admin.estadoBloqueo()`, `mostrarPantallaBloqueoSiCorresponde()`,
     `solicitarAcceso()`, y `pasoSeguro('admin', () => Admin.iniciar())` (que cablea la UI).
   - `js/mapa/mapa.js` (~118,155,205,277): `Admin.modo` y `Admin.manejarClickPunto` (colocar pines
     tocando el mapa) → con la UI fuera, `Admin.modo` nunca se activa; asegúrate de que sigue siendo
     seguro (guardas `typeof Admin !== 'undefined'`).
   - `js/gps/gps.js`, `js/enemigos/enemigos.js`, `js/online/multijugador.js`, `js/cofres/cofres.js`:
     usan `Admin.modo === 'organizar' | 'colocar_cofre'` → quedarán inertes al no poder activarse.
   - `js/nucleo/ui_manager.js` (~145): cierre de `ventana-admin` → quitar o guardar.
3. **Mantener** (NO tocar): `Admin.cargar`, `Admin.pintarMapaCompleto`, `Admin.publicado`,
   `Admin.asegurarMundoMapaCargado`, `Admin.misionesTodas`, `Admin.pos`, `Admin.eliminado`,
   `Admin.refrescarMundoTrasLogin`, `Admin._contarElementosMapa`, `Admin._crudoPublicado`…
   (todo lo de carga/render del mundo).
   - La forma más limpia y segura: dentro de `admin.js`, hacer que `iniciar()` (u la función que
     cablea botones/paneles) **no monte ninguna UI** (que sus `document.getElementById('btn-admin')`
     etc. no revienten si el elemento es null), y dejar solo el motor de datos. Verifica que
     `Admin.iniciar()` no lance si faltan los elementos del DOM.
4. Verificar el juego: abrir el sitio, confirmar que **el mundo (pines, misiones, cofres, enemigos,
   tiendas) sigue cargando y viéndose** para un jugador normal, y que **no aparece** ningún botón ni
   ventana de admin. Correr lo que haya de test/smoke del juego:
   ```bash
   cd server && npm install   # (o npm ci)
   cd .. && npm run test:local  # smoke sin llamadas en vivo (scripts/smoke-v299.sh)
   node scripts/typecheck.js
   ```
5. Commit claro en `claude/web-rpg-gps-game-n3ybow` y push. (Ojo: es el juego en vivo desplegado
   en Render; el deploy puede ser automático al pushear esa rama — avisar al usuario antes si aplica.)

### (Opcional / fase siguiente en el EDITOR)
Lo único de la admin del juego que el editor **todavía no** cubre es la **config global** vía
`POST /api/player/world/config` (precios, combate, mantenimiento, baneados, mensajes, stock…) y la
gestión de cuentas. Si se quiere "pasar TODO al panel adm de aquí", habría que añadir en el editor
una sección "Servidor/Mundo global" que llame a `world/config`, `sync-mundo`, `admin-historial`,
`limpiar-cuentas`, `restaurar-cuenta`, etc. (ver rutas admin en `server/routes/playerRoutes.js`).
Todas requieren el mismo JWT admin. Esto es ampliación, no bloquea lo de quitar el botón.

---

## 6. Cosas bloqueadas por datos/decisiones del usuario (no se pueden cerrar solas)

1. **Que el pin se ponga VERDE de verdad:** hace falta que el usuario pegue en Configuración ▸
   Servidor la **URL** (`https://mariel-online.onrender.com`) y un **token JWT de admin** válido
   (localStorage `mariel_online_token` tras loguearse como admin). El código ya está listo.
2. **Auto-update que descargue solo:** requiere una **Release** publicada → el usuario debe crear el
   tag `vX.Y.Z` (Claude no puede pushear tags). Ver §2.
3. Empaquetar `.exe`: solo en Windows / GitHub Actions.

---

## 7. Mapa rápido de archivos clave

### Editor (`kingdom-gps-editor`)
- IPC main: `src/main/ipc/handlers/*.ts` (worldEditor, monsters, updates, systemExtras…).
  - `systemExtras.ts` → `capture:window`, `server:get/set`, y `readServerConfig()`.
  - `worldEditor.ts` → `worldEditor:publishEntity` (§4) + CRUD del mundo.
- Repos main: `src/main/**/**Repository.ts` (snake_case↔camelCase, Kysely).
- Preload/contrato: `src/preload/index.ts` + `src/shared-types/api.ts` (`window.api`).
- Tipos compartidos: `src/shared-types/*.ts` (world, system, monster, updates…).
- Renderer mundo: `src/renderer/src/modules/worldEditor/` (WorldMapPanel, MapContextMenu,
  components/*Modal.tsx, content/*.ts con la lógica pura + tests).
- Settings UI: `src/renderer/src/modules/settings/components/SettingsPanel.tsx`
  (Actualizaciones, Captura de pantalla, Servidor).
- Sidebar/registro de módulos: `src/renderer/src/app/layout/Sidebar.tsx`,
  `src/shared-types/module.ts`, `.../modules/registry.ts`.
- Build/CI: `electron-builder.yml`, `.github/workflows/build-windows.yml`, `package.json`.

### Juego (`github-pages`)
- Servidor: `server/server.js` (monta rutas), `server/routes/*.js`
  (`playerRoutes.js` tiene las rutas admin: `world/upsert`, `world/delete`, `world/config`,
  `sync-mundo`, `admin-historial`…), `server/worldContent.js` (tipos, upsert), `server/auth.js`
  (JWT: `authMiddleware`, `gameAdminMiddleware`, roles), `server/db.js`.
- Cliente: `index.html` (UI, incluye la admin a quitar), `js/admin/admin.js` (⚠ motor de mundo +
  panel admin), `js/online/sync_servidor.js` (cliente HTTP del servidor, muestra el contrato real),
  `js/mapa/`, `js/misiones/`, `js/principal.js`.
- Deploy: `render.yaml` (rootDir `server`, `npm start`). Front en GitHub Pages / `CNAME` = tcodm.com.

---

## 8. Cómo seguir (resumen accionable)

1. Confirmar con el usuario el "plan seguro" de §5 (quitar UI admin del juego, mantener motor).
2. Implementarlo en `github-pages` rama `claude/web-rpg-gps-game-n3ybow`, verificar que el mundo
   sigue cargando para jugadores, commit + push.
3. Volver al editor si se quiere la fase opcional (config global en el panel).
4. Tras cada bloque: actualizar los 3 docs, commit, push, y disparar build de Windows.
5. Recordarle al usuario: pegar URL+token del servidor para probar "Subir al mundo" en verde, y
   crear el tag de versión para el auto-update.
