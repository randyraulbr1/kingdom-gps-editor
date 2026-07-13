import { useState } from 'react'
import { Gamepad2, Code2 } from 'lucide-react'
import { LiveGameTab } from './LiveGameTab'
import { CodePlaygroundTab } from './CodePlaygroundTab'

type Tab = 'live' | 'code'

/**
 * "Probar Juego" (doc 03): carga la web del juego dentro del editor para probarla
 * (recargar, limpiar caché/datos, tamaños PC/teléfono/tablet) y un playground para
 * probar fragmentos de código de la UI del juego.
 */
export function GameViewPanel(): JSX.Element {
  const [tab, setTab] = useState<Tab>('live')

  return (
    <div className="flex h-full w-full flex-col bg-surface-0">
      <div className="flex items-center gap-1 border-b border-surface-border bg-surface-1 px-3 py-2">
        <button
          type="button"
          onClick={() => setTab('live')}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs ${tab === 'live' ? 'bg-accent text-white' : 'text-slate-300 hover:bg-surface-2'}`}
        >
          <Gamepad2 size={13} /> Juego en vivo
        </button>
        <button
          type="button"
          onClick={() => setTab('code')}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs ${tab === 'code' ? 'bg-accent text-white' : 'text-slate-300 hover:bg-surface-2'}`}
        >
          <Code2 size={13} /> Probar códigos
        </button>
      </div>
      <div className="min-h-0 flex-1">{tab === 'live' ? <LiveGameTab /> : <CodePlaygroundTab />}</div>
    </div>
  )
}
