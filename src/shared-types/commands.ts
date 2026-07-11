/** A single reversible mutation, persisted to change_log and replayed by the undo/redo command bus. */
export interface ChangeLogEntry {
  id: number
  timestamp: string
  moduleId: string
  entityId: string | number | null
  action: string
  before: unknown
  after: unknown
}

export interface CommandDescriptor<TPayload = unknown> {
  moduleId: string
  entityId: string | number | null
  action: string
  before: TPayload
  after: TPayload
}
