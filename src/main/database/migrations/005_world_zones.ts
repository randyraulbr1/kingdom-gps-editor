/** Persists World Editor zones (polygons). zone_id is a client-generated ULID, like world_entities, so it survives future server sync (doc 12). */
export const id = '005_world_zones'

export const sql = `
CREATE TABLE IF NOT EXISTS world_zones (
  zone_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#1E90FF',
  points TEXT NOT NULL DEFAULT '[]',
  properties TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_world_zones_deleted_at ON world_zones(deleted_at);
`
