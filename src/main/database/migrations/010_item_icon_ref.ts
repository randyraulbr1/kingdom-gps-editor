/**
 * Recorte de icono para objetos: permite que el icono de un objeto sea una
 * PARTE (celda/región) de la imagen, no la imagen entera. Se guarda como JSON
 * { x, y, width, height } relativo a la imagen de `icon_id`. NULL = imagen entera.
 */
export const id = '010_item_icon_ref'

export const sql = `
ALTER TABLE items ADD COLUMN icon_ref TEXT;
`
