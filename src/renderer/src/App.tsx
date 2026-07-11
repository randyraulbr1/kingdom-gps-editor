import { useEffect, useState } from 'react'
import type { ModuleId } from '@shared-types/module'
import { useProjectStore } from '@renderer/shared/store/projectStore'
import { WelcomeScreen } from '@renderer/app/welcome/WelcomeScreen'
import { TitleBar } from '@renderer/app/layout/TitleBar'
import { Sidebar } from '@renderer/app/layout/Sidebar'
import { DockLayout } from '@renderer/app/layout/DockLayout'
import { useGlobalShortcuts } from '@renderer/app/layout/useGlobalShortcuts'

export function App(): JSX.Element {
  const project = useProjectStore((s) => s.current)
  const setCurrent = useProjectStore((s) => s.setCurrent)
  const [openRequest, setOpenRequest] = useState<ModuleId | null>(null)
  const [activeModuleId, setActiveModuleId] = useState<ModuleId | null>(null)

  useGlobalShortcuts()

  useEffect(() => {
    window.api.project.getCurrent().then(setCurrent)
  }, [setCurrent])

  const handleOpenModule = (id: ModuleId): void => {
    setActiveModuleId(id)
    setOpenRequest(id)
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface-0 text-slate-200">
      <TitleBar />
      {project ? (
        <div className="flex min-h-0 flex-1">
          <Sidebar activeModuleId={activeModuleId} onOpenModule={handleOpenModule} />
          <div className="min-w-0 flex-1">
            <DockLayout openRequest={openRequest} onOpened={() => setOpenRequest(null)} />
          </div>
        </div>
      ) : (
        <WelcomeScreen />
      )}
    </div>
  )
}
