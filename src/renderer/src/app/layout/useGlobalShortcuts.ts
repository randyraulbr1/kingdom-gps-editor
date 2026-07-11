import { useEffect } from 'react'

/** Ctrl+Z / Ctrl+Y (and Ctrl+Shift+Z) drive the main-process command bus regardless of which module tab is focused. */
export function useGlobalShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const ctrl = event.ctrlKey || event.metaKey
      if (!ctrl) return

      const key = event.key.toLowerCase()
      const isUndo = key === 'z' && !event.shiftKey
      const isRedo = key === 'y' || (key === 'z' && event.shiftKey)

      if (isUndo) {
        event.preventDefault()
        window.api.commandHistory.undo().then(() => window.dispatchEvent(new CustomEvent('kgps:refresh')))
      } else if (isRedo) {
        event.preventDefault()
        window.api.commandHistory.redo().then(() => window.dispatchEvent(new CustomEvent('kgps:refresh')))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
