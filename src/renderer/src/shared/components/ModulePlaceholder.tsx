import type { ComponentType } from 'react'
import { Construction } from 'lucide-react'

interface ModulePlaceholderProps {
  title: string
  description: string
}

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps): JSX.Element {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-1 text-surface-border">
      <Construction size={40} className="text-accent" strokeWidth={1.5} />
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
      </div>
    </div>
  )
}

export function makePlaceholderPanel(title: string, description: string): ComponentType {
  return function PlaceholderPanel() {
    return <ModulePlaceholder title={title} description={description} />
  }
}
