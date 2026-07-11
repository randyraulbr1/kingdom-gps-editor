/**
 * Migrations are plain TS modules (not .sql files) so the same source works
 * unmodified under electron-vite (main bundle), electron-vite (preload/renderer
 * never import these), and vitest - no raw-file-loader wiring needed anywhere.
 */
export const id = '001_init'

export const sql = `
CREATE TABLE IF NOT EXISTS change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  module_id TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  before TEXT,
  after TEXT,
  undone INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_change_log_timestamp ON change_log(timestamp);
`
