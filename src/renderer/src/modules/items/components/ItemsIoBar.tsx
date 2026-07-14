import { useRef, useState } from 'react'
import { Upload, FileDown, ClipboardCopy, Check, AlertTriangle } from 'lucide-react'
import { parseItemsTxt, serializeItemsTxt, buildItemsPrompt } from '../itemsTxt'
import type { Item } from '@shared-types/item'

/** Refresca la lista del módulo (el framework escucha este evento). */
function refreshList(): void {
  window.dispatchEvent(new Event('kgps:refresh'))
}

/**
 * Barra de importar/exportar Objetos como .txt + botón de Prompt para pedirle a
 * una IA que genere objetos en el formato correcto (con sus conexiones).
 */
export function ItemsIoBar(): JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [count, setCount] = useState('10')
  const [busy, setBusy] = useState(false)

  const flash = (ok: boolean, text: string): void => {
    setNotice({ ok, text })
    window.setTimeout(() => setNotice((n) => (n?.text === text ? null : n)), 5000)
  }

  const onPickFile = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (fileRef.current) fileRef.current.value = ''
    if (!file) return
    setBusy(true)
    try {
      const text = await file.text()
      const { items, errors } = parseItemsTxt(text)
      if (items.length === 0) {
        flash(false, errors[0] ?? 'No se pudo leer ningún objeto del archivo.')
        return
      }
      let created = 0
      for (const item of items) {
        try {
          await window.api.items.create(item)
          created++
        } catch {
          /* seguir con el resto */
        }
      }
      refreshList()
      const extra = errors.length ? ` (${errors.length} línea(s) omitida(s))` : ''
      flash(created > 0, `Importados ${created}/${items.length} objetos${extra}.`)
    } catch (error) {
      flash(false, error instanceof Error ? error.message : 'No se pudo importar el archivo.')
    } finally {
      setBusy(false)
    }
  }

  const onExport = async (): Promise<void> => {
    setBusy(true)
    try {
      const { items } = await window.api.items.query({ limit: 100000, offset: 0 })
      const text = serializeItemsTxt(items as Item[])
      downloadTxt(`objetos-${new Date().toISOString().slice(0, 10)}.txt`, text)
      flash(true, `Exportados ${items.length} objetos a .txt.`)
    } catch (error) {
      flash(false, error instanceof Error ? error.message : 'No se pudo exportar.')
    } finally {
      setBusy(false)
    }
  }

  const onCopyPrompt = async (): Promise<void> => {
    const n = Math.max(1, Math.min(500, Number(count.replace(/[^0-9]/g, '')) || 10))
    const prompt = buildItemsPrompt(n)
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      flash(false, 'No se pudo copiar. Selecciona y copia manualmente.')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-surface-border bg-surface-2/40 px-3 py-2 text-xs">
      <span className="font-medium text-slate-400">Objetos por lote:</span>

      <input ref={fileRef} type="file" accept=".txt,.json,text/plain,application/json" className="hidden" onChange={(e) => void onPickFile(e)} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-md border border-surface-border px-2.5 py-1.5 text-slate-200 hover:bg-surface-2 disabled:opacity-50"
      >
        <Upload size={13} /> Importar .txt
      </button>

      <button
        type="button"
        onClick={() => void onExport()}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-md border border-surface-border px-2.5 py-1.5 text-slate-200 hover:bg-surface-2 disabled:opacity-50"
      >
        <FileDown size={13} /> Exportar .txt
      </button>

      <span className="ml-2 h-4 w-px bg-surface-border" />

      <span className="text-slate-500">Prompt para IA:</span>
      <input
        type="text"
        inputMode="numeric"
        value={count}
        onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ''))}
        title="Cuántos objetos pedirle a la IA"
        className="w-14 rounded-md border border-surface-border bg-surface-1 px-2 py-1 text-slate-100 focus:border-accent focus:outline-none"
      />
      <button
        type="button"
        onClick={() => void onCopyPrompt()}
        className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 font-medium text-white hover:brightness-110"
      >
        {copied ? <Check size={13} /> : <ClipboardCopy size={13} />} {copied ? 'Copiado' : 'Copiar prompt'}
      </button>

      {notice && (
        <span className={`ml-2 flex items-center gap-1.5 ${notice.ok ? 'text-green-400' : 'text-amber-400'}`}>
          {notice.ok ? <Check size={13} /> : <AlertTriangle size={13} />} {notice.text}
        </span>
      )}
    </div>
  )
}

function downloadTxt(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
