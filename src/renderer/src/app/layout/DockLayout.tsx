import { useCallback, useEffect, useRef } from 'react'
import { DockviewReact, type DockviewApi, type DockviewReadyEvent, type IDockviewPanelProps } from 'dockview-react'
import 'dockview-react/dist/styles/dockview.css'
import type { ModuleId } from '@shared-types/module'
import { getAllModules, getModule } from '@renderer/modules/registry'

const MODULES = getAllModules()

const components: Record<string, React.FC<IDockviewPanelProps>> = Object.fromEntries(
  MODULES.map((module) => {
    const Panel = module.panel
    const Wrapped: React.FC<IDockviewPanelProps> = () => <Panel />
    return [module.id, Wrapped]
  })
)

interface DockLayoutProps {
  openRequest: ModuleId | null
  onOpened(): void
}

export function DockLayout({ openRequest, onOpened }: DockLayoutProps): JSX.Element {
  const apiRef = useRef<DockviewApi | null>(null)

  const handleReady = useCallback((event: DockviewReadyEvent) => {
    apiRef.current = event.api
    const first = MODULES.find((module) => module.id === 'items') ?? MODULES[0]
    if (first) {
      event.api.addPanel({ id: first.id, component: first.id, title: first.name })
    }
  }, [])

  useEffect(() => {
    if (!openRequest || !apiRef.current) return
    const api = apiRef.current
    const existing = api.getPanel(openRequest)
    if (existing) {
      existing.api.setActive()
    } else {
      const module = getModule(openRequest)
      if (module) {
        api.addPanel({ id: module.id, component: module.id, title: module.name })
      }
    }
    onOpened()
  }, [openRequest, onOpened])

  return (
    <div className="dockview-theme-dark h-full w-full">
      <DockviewReact components={components} onReady={handleReady} />
    </div>
  )
}
