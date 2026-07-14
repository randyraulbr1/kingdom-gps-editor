/** Recorte de icono para armaduras (región de la imagen). */
export const id = '012_armor_icon_ref'

export const sql = `
ALTER TABLE armor ADD COLUMN icon_ref TEXT;
`
