export const id = '002_icon_library'

export const sql = `
CREATE TABLE IF NOT EXISTS icons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  relative_path TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  hash TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  format TEXT NOT NULL,
  favorite INTEGER NOT NULL DEFAULT 0,
  duplicate_of_id INTEGER REFERENCES icons(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_icons_category ON icons(category);
CREATE INDEX IF NOT EXISTS idx_icons_hash ON icons(hash);
CREATE INDEX IF NOT EXISTS idx_icons_favorite ON icons(favorite);

CREATE TABLE IF NOT EXISTS icon_tags (
  icon_id INTEGER NOT NULL REFERENCES icons(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (icon_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_icon_tags_tag ON icon_tags(tag);
`
