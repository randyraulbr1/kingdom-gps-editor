import type { Exporter } from './Exporter'
import { jsonExporter } from './exporters/JsonExporter'

const EXPORTERS: Exporter[] = [jsonExporter]

export function getExporter(id: string): Exporter | undefined {
  return EXPORTERS.find((exporter) => exporter.id === id)
}

export function listExporters(): Exporter[] {
  return EXPORTERS
}
