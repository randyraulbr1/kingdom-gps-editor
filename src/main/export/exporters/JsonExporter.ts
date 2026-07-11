import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Exporter } from '../Exporter'

export const jsonExporter: Exporter<unknown> = {
  id: 'json',
  label: 'JSON',
  fileExtension: '.json',
  async run(data, targetPath) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true })
    await fs.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf-8')
  }
}
