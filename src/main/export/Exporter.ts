/**
 * Every export target (JSON now; CSV/SQL/XML/binary/direct-to-server later,
 * see condition #5) implements this. Modules register the exporters they
 * offer; the registry never needs to know the concrete formats in advance.
 */
export interface Exporter<TData = unknown> {
  id: string
  label: string
  fileExtension: string
  run(data: TData, targetPath: string): Promise<void>
}
