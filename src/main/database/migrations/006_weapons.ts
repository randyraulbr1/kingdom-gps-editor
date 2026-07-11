/** Segundo módulo de contenido (Armas), repite el patrón de referencia de `items` con campos propios de arma. */
export const id = '006_weapons'

export const sql = `
CREATE TABLE IF NOT EXISTS weapons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'sword',
  rarity TEXT NOT NULL DEFAULT 'common',
  icon_id INTEGER REFERENCES icons(id) ON DELETE SET NULL,
  damage REAL NOT NULL DEFAULT 1,
  attack_speed REAL NOT NULL DEFAULT 1,
  range REAL NOT NULL DEFAULT 1,
  crit_chance REAL NOT NULL DEFAULT 0,
  value INTEGER NOT NULL DEFAULT 0,
  weight REAL NOT NULL DEFAULT 0,
  required_level INTEGER NOT NULL DEFAULT 1,
  required_profession TEXT,
  bonuses TEXT NOT NULL DEFAULT '[]',
  scripts TEXT NOT NULL DEFAULT '[]',
  flags TEXT NOT NULL DEFAULT '[]',
  checks TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weapons_category ON weapons(category);
CREATE INDEX IF NOT EXISTS idx_weapons_rarity ON weapons(rarity);
CREATE INDEX IF NOT EXISTS idx_weapons_name ON weapons(name);
`
