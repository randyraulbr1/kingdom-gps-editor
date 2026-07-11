/** Persists the World Editor (real-GPS map) entities - worldId is a client-generated ULID, not autoincrement, so it survives future server sync. */
export const id = '004_world_entities'

export const sql = `
CREATE TABLE IF NOT EXISTS world_entities (
  world_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  rotation REAL NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  sync_status TEXT NOT NULL DEFAULT 'local',
  server_version INTEGER NOT NULL DEFAULT 0,
  local_version INTEGER NOT NULL DEFAULT 1,
  properties TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  last_sync_error TEXT,
  sync_attempts INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_world_entities_type ON world_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_world_entities_sync_status ON world_entities(sync_status);
CREATE INDEX IF NOT EXISTS idx_world_entities_lat_lng ON world_entities(lat, lng);
CREATE INDEX IF NOT EXISTS idx_world_entities_deleted_at ON world_entities(deleted_at);
`
