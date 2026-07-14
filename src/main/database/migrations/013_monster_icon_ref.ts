/** Recorte de icono para monstruos (región de la imagen). */
export const id = '013_monster_icon_ref'

export const sql = `
ALTER TABLE monsters ADD COLUMN icon_ref TEXT;
`
