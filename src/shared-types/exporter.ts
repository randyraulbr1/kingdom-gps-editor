export interface ExporterMeta {
  id: string
  label: string
  fileExtension: string
}

export interface ExportRunResult {
  exporterId: string
  outputPath: string
  recordCount: number
  durationMs: number
}
