/**
 * Persists World Editor enemy routes (polylines, doc 14). route_id is a
 * client-generated ULID, like world_zones/world_entities, so it survives future
 * server sync. The weighted enemy list and spawn/activation settings live in the
 * `properties` JSON column (Fase A/B), mirroring how pins store their config.
 */
export const id = '008_enemy_routes'

export const sql = `
CREATE TABLE IF NOT EXISTS enemy_routes (
  route_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#ef4444',
  points TEXT NOT NULL DEFAULT '[]',
  properties TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_enemy_routes_deleted_at ON enemy_routes(deleted_at);
`
