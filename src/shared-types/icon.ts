export type IconFormat = 'png' | 'jpg' | 'webp'
export type IconSizeVariant = 64 | 128 | 256

export interface IconRecord {
  id: number
  fileName: string
  /** Relative to the project's assets/icons folder */
  relativePath: string
  /** Top-level folder under assets/icons, used as the default category */
  category: string
  hash: string
  width: number
  height: number
  format: IconFormat
  favorite: boolean
  tags: string[]
  duplicateOfId: number | null
  createdAt: string
  updatedAt: string
}

export interface IconImportResult {
  imported: number
  skipped: number
  duplicates: number
  errors: Array<{ file: string; message: string }>
}

export interface IconQuery {
  search?: string
  category?: string
  tags?: string[]
  favoritesOnly?: boolean
  duplicatesOnly?: boolean
  limit?: number
  offset?: number
}

export interface IconResizeRequest {
  iconId: number
  variants: IconSizeVariant[]
  format?: IconFormat
}
