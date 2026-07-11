import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Resolves a module's `icon` string (e.g. "Sword") to its lucide-react component, falling back to a generic dot. */
export function resolveIcon(name: string): LucideIcon {
  const icon = (Icons as unknown as Record<string, LucideIcon>)[name]
  return icon ?? Icons.Circle
}
