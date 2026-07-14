import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'
import type { IconLibraryRepository } from './iconLibraryRepository'
import type { IconImportResult, IconFormat, IconRecord, IconResizeRequest } from '@shared-types/icon'

const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

function extensionToFormat(ext: string): IconFormat {
  if (ext === '.jpg' || ext === '.jpeg') return 'jpg'
  if (ext === '.webp') return 'webp'
  return 'png'
}

async function hashFile(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath)
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

async function walk(dir: string): Promise<string[]> {
  let entries: import('node:fs').Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(full)))
    } else if (SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(full)
    }
  }
  return files
}

/**
 * Filesystem + image-processing side of the icon library. The repository
 * only knows about rows in SQLite; this service owns everything that touches
 * assets/icons on disk (scanning, hashing for dedupe, sharp conversions).
 */
export class IconLibraryService {
  constructor(
    private repository: IconLibraryRepository,
    private assetsIconsDir: string
  ) {}

  /** Recursively imports every PNG/JPG/WEBP under sourceDir into assets/icons, indexing + hash-deduping as it goes. */
  async importFolder(sourceDir: string): Promise<IconImportResult> {
    const result: IconImportResult = { imported: 0, skipped: 0, duplicates: 0, errors: [] }
    const files = await walk(sourceDir)
    const isInPlaceRescan = path.resolve(sourceDir) === path.resolve(this.assetsIconsDir)

    for (const filePath of files) {
      try {
        const relativeFromSource = path.relative(sourceDir, filePath)
        const category = relativeFromSource.split(path.sep)[0] || 'general'
        const destRelative = relativeFromSource.split(path.sep).join('/')
        const destAbsolute = path.join(this.assetsIconsDir, destRelative)

        const existing = await this.repository.findByRelativePath(destRelative)
        if (existing) {
          result.skipped++
          continue
        }

        if (!isInPlaceRescan) {
          await fs.mkdir(path.dirname(destAbsolute), { recursive: true })
          await fs.copyFile(filePath, destAbsolute)
        }

        const hash = await hashFile(destAbsolute)
        const metadata = await sharp(destAbsolute).metadata()
        const duplicate = await this.repository.findByHash(hash)

        await this.repository.create({
          fileName: path.basename(destAbsolute),
          relativePath: destRelative,
          category,
          hash,
          width: metadata.width ?? 0,
          height: metadata.height ?? 0,
          format: extensionToFormat(path.extname(destAbsolute).toLowerCase()),
          duplicateOfId: duplicate?.id ?? null
        })

        if (duplicate) result.duplicates++
        result.imported++
      } catch (error) {
        result.errors.push({ file: filePath, message: (error as Error).message })
      }
    }

    return result
  }

  /** Importa archivos de imagen sueltos (PNG/JPG/WEBP) a assets/icons/<category>. */
  async importFiles(filePaths: string[], category = 'general'): Promise<IconImportResult> {
    const result: IconImportResult = { imported: 0, skipped: 0, duplicates: 0, errors: [] }
    const cat = (category || 'general').trim() || 'general'
    for (const filePath of filePaths) {
      try {
        const ext = path.extname(filePath).toLowerCase()
        if (!SUPPORTED_EXTENSIONS.has(ext)) {
          result.errors.push({ file: filePath, message: 'Formato no soportado (usa PNG, JPG o WebP)' })
          continue
        }
        const destRelative = [cat, path.basename(filePath)].join('/')
        const destAbsolute = path.join(this.assetsIconsDir, cat, path.basename(filePath))

        if (await this.repository.findByRelativePath(destRelative)) {
          result.skipped++
          continue
        }
        await fs.mkdir(path.dirname(destAbsolute), { recursive: true })
        await fs.copyFile(filePath, destAbsolute)

        const hash = await hashFile(destAbsolute)
        const metadata = await sharp(destAbsolute).metadata()
        const duplicate = await this.repository.findByHash(hash)
        await this.repository.create({
          fileName: path.basename(destAbsolute),
          relativePath: destRelative,
          category: cat,
          hash,
          width: metadata.width ?? 0,
          height: metadata.height ?? 0,
          format: extensionToFormat(ext),
          duplicateOfId: duplicate?.id ?? null
        })
        if (duplicate) result.duplicates++
        result.imported++
      } catch (error) {
        result.errors.push({ file: filePath, message: (error as Error).message })
      }
    }
    return result
  }

  /** Reconciles the DB index with whatever is already on disk under assets/icons - run once at project open. */
  async rescan(): Promise<IconImportResult> {
    await fs.mkdir(this.assetsIconsDir, { recursive: true })
    return this.importFolder(this.assetsIconsDir)
  }

  /** Generates a resized/converted variant next to the source file (e.g. sword-128.webp) via sharp - no native compiler required, sharp ships prebuilt libvips binaries. */
  async resize(request: IconResizeRequest): Promise<IconRecord> {
    const icon = await this.repository.get(request.iconId)
    if (!icon) throw new Error(`Icono ${request.iconId} no encontrado`)

    const sourcePath = path.join(this.assetsIconsDir, icon.relativePath)
    const format = request.format ?? icon.format

    for (const size of request.variants) {
      const variantRelative = icon.relativePath.replace(/(\.[^.]+)$/, `-${size}.${format}`)
      const variantAbsolute = path.join(this.assetsIconsDir, variantRelative)
      await sharp(sourcePath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFormat(format)
        .toFile(variantAbsolute)
    }

    return icon
  }
}
