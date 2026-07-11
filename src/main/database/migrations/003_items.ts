/** First content-module migration - fixes the reference schema pattern that Fase 3+ modules will repeat. */
export const id = '003_items'

export const sql = `
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  icon_id INTEGER REFERENCES icons(id) ON DELETE SET NULL,
  value INTEGER NOT NULL DEFAULT 0,
  weight REAL NOT NULL DEFAULT 0,
  stack_size INTEGER NOT NULL DEFAULT 1,
  durability INTEGER,
  health_restore INTEGER,
  food_restore INTEGER,
  mana_restore INTEGER,
  required_level INTEGER NOT NULL DEFAULT 1,
  required_profession TEXT,
  weapon_type TEXT,
  armor_type TEXT,
  bonuses TEXT NOT NULL DEFAULT '[]',
  scripts TEXT NOT NULL DEFAULT '[]',
  flags TEXT NOT NULL DEFAULT '[]',
  checks TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_rarity ON items(rarity);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
`
