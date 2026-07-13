# Contrato del mundo (Editor ⇄ Servidor ⇄ Juego)

> Formato versionado del contenido que el **Kingdom GPS Editor** (panel adm oficial)
> sube al servidor del juego y que el juego renderiza. Versión actual: **schemaVersion 1**.

## Autenticación (automática)

El editor guarda **una vez** en Configuración ▸ Servidor: `url`, `adminUser`, `adminPass`.
Internamente inicia sesión (`POST /api/login`), cachea el JWT y lo reutiliza; si caduca (401)
vuelve a iniciar sesión solo. **El usuario nunca pega un token.**

## Endpoint de subida

```
POST {url}/api/player/world/upsert
Authorization: Bearer <JWT admin>   (lo pone el editor automáticamente)
Content-Type: application/json

{ "id": "<id estable>", "type": "<tipo juego>", "x": <lat>, "y": <lng>, "data": { … } }
```

- El servidor hace **upsert por `id`** (no duplica; conserva el mismo id), guarda el blob,
  refresca el mundo publicado y **emite por socket** (`world:updateObject`) → el juego lo
  ve sin recargar. Borrar/retirar: `POST /api/player/world/delete { id }`.
- Tipos válidos: `item | enemy | treasure | shop | mission | chest`.
- Mapa editor→juego: `object→item, enemy→enemy, chest→chest, shop→shop, quest→mission,
  resource→treasure`. (NPC/evento/marcador aún no tienen tipo en el juego → se informan en rojo.)

## Blob `data` común (todos los tipos)

| campo           | tipo         | notas |
|-----------------|--------------|-------|
| `id`            | string       | mismo id estable |
| `schemaVersion` | number       | 1 |
| `nombre`        | string       | nombre visible |
| `pos`           | `[lat, lng]` | posición GPS |
| `activo`        | boolean      | false = no se muestra en el juego |

## TIENDA (`type: "shop"`) — contrato completo v1

```json
{
  "id": "shop_abc",
  "schemaVersion": 1,
  "nombre": "Tienda del puerto",
  "icono": "🏪",
  "categoria": "general",
  "pos": [22.988, -82.754],
  "radio": 30,
  "activo": true,
  "horario": null,
  "vende": [
    { "id": "sardina", "precio": 10, "stock": 5 },
    { "id": "agua", "precio": 3, "infinito": true }
  ]
}
```

- **`vende`** es lo que hace la tienda funcional. Cada entrada: `id` (id del item del juego,
  p. ej. `sardina`, `cana_de_pescar`), `precio` (número) y **o** `stock` (número) **o**
  `infinito: true`. En el editor: catálogo → si la fila tiene `itemId` se usa; si no, se
  genera un slug del nombre. `stock = -1` en el editor ⇒ `infinito: true`.
- **`radio`**: metros de interacción propios de la tienda (el juego los respeta; si falta usa
  `CONFIG.distanciaInteraccion`).
- **`activo`**: `false` (estado pausado/cerrado o pin desactivado) ⇒ el juego oculta el marcador.
- **`icono`**: emoji del marcador (por defecto 🏪).
- **`horario`**: reservado (aún no lo aplica el juego).

### Cómo lo dibuja el juego (`js/tiendas/tiendas.js`)
- `_cargarAdmin()` crea/actualiza el marcador con `icono`, posición y `radio`; oculta los
  `activo === false`; borra el marcador si la tienda deja de existir o se desactiva.
- Tocar el pin (dentro del radio) abre `ventana-tienda` con `vende` (comprar) y la mochila (vender).

## Dónde vive el código

- Editor (constructor de payload, con pruebas): `src/main/server/worldPayload.ts` (+ `.test.ts`).
- Editor (auth automática): `src/main/server/gameServer.ts`.
- Editor (subida): `src/main/ipc/handlers/worldEditor.ts` → `worldEditor:publishEntity`.
- Servidor: `server/routes/playerRoutes.js` (`/world/upsert`, `/world/delete`),
  `server/worldContent.js` (`adminUpsertContent`).
- Juego: `js/tiendas/tiendas.js`, `js/online/contenido_mundo.js`, `js/online/sync_servidor.js`.

## Estado por tipo

| Tipo    | Contrato v1 | Render en juego |
|---------|-------------|-----------------|
| Tienda  | ✅ completo  | ✅ (icono, radio, activo, vende) |
| NPC     | ⏳ pendiente | — (sin tipo en el juego todavía) |
| Cofre   | ⏳ genérico  | parcial |
| Recurso | ⏳ genérico  | parcial |
| Enemigo | ⏳ genérico  | parcial |
| Ruta    | ⏳ pendiente | — |

Orden de trabajo pactado: Tienda → NPC → Cofre → Recurso → Enemigo → Ruta.
