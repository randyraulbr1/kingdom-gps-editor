/** Módulo de contenido Monstruos (bestiario), repite el patrón de `weapons`/`armor` con campos propios de monstruo. */
export const id = '009_monsters'

export const sql = `
CREATE TABLE IF NOT EXISTS monsters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'beast',
  rarity TEXT NOT NULL DEFAULT 'common',
  icon_id INTEGER REFERENCES icons(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 1,
  hp REAL NOT NULL DEFAULT 100,
  damage REAL NOT NULL DEFAULT 10,
  defense REAL NOT NULL DEFAULT 0,
  speed REAL NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 20,
  coin_reward INTEGER NOT NULL DEFAULT 5,
  scripts TEXT NOT NULL DEFAULT '[]',
  flags TEXT NOT NULL DEFAULT '[]',
  checks TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_monsters_category ON monsters(category);
CREATE INDEX IF NOT EXISTS idx_monsters_rarity ON monsters(rarity);
CREATE INDEX IF NOT EXISTS idx_monsters_name ON monsters(name);
`
