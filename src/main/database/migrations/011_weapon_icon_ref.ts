/** Recorte de icono para armas (región de la imagen). Igual que items.icon_ref. */
export const id = '011_weapon_icon_ref'

export const sql = `
ALTER TABLE weapons ADD COLUMN icon_ref TEXT;
`
