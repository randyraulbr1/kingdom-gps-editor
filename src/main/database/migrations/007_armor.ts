/** Tercer módulo de contenido (Armaduras), repite el patrón de referencia de `weapons`/`items` con campos propios de armadura. */
export const id = '007_armor'

export const sql = `
CREATE TABLE IF NOT EXISTS armor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'chest',
  rarity TEXT NOT NULL DEFAULT 'common',
  icon_id INTEGER REFERENCES icons(id) ON DELETE SET NULL,
  defense REAL NOT NULL DEFAULT 1,
  magic_resist REAL NOT NULL DEFAULT 0,
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

CREATE INDEX IF NOT EXISTS idx_armor_category ON armor(category);
CREATE INDEX IF NOT EXISTS idx_armor_rarity ON armor(rarity);
CREATE INDEX IF NOT EXISTS idx_armor_name ON armor(name);
`
