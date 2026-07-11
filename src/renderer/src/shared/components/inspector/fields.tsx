import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { ItemBonus } from '@shared-types/item'

function FieldLabel({ children }: { children: React.ReactNode }): JSX.Element {
  return <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{children}</label>
}

const inputClass =
  'w-full rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-accent'

interface TextFieldProps {
  label: string
  value: string
  placeholder?: string
  onCommit(value: string): void
}

/** Uncontrolled + `key={value}`: resets local typing state whenever the underlying record changes (e.g. switching selection) without fighting the user mid-keystroke. Commits on blur (autosave). */
export function TextField({ label, value, placeholder, onCommit }: TextFieldProps): JSX.Element {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        key={value}
        defaultValue={value}
        placeholder={placeholder}
        onBlur={(event) => {
          if (event.target.value !== value) onCommit(event.target.value)
        }}
        className={inputClass}
      />
    </div>
  )
}

export function TextAreaField({ label, value, onCommit }: Omit<TextFieldProps, 'placeholder'>): JSX.Element {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        key={value}
        defaultValue={value}
        rows={3}
        onBlur={(event) => {
          if (event.target.value !== value) onCommit(event.target.value)
        }}
        className={`${inputClass} resize-none`}
      />
    </div>
  )
}

interface NumberFieldProps {
  label: string
  value: number | null
  allowNull?: boolean
  onCommit(value: number | null): void
}

export function NumberField({ label, value, allowNull, onCommit }: NumberFieldProps): JSX.Element {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        key={value ?? 'null'}
        type="number"
        defaultValue={value ?? ''}
        placeholder={allowNull ? '(sin valor)' : undefined}
        onBlur={(event) => {
          const raw = event.target.value
          if (raw === '') {
            if (allowNull && value !== null) onCommit(null)
            return
          }
          const num = Number(raw)
          if (!Number.isNaN(num) && num !== value) onCommit(num)
        }}
        className={inputClass}
      />
    </div>
  )
}

interface SelectFieldProps<T extends string> {
  label: string
  value: T
  options: readonly T[]
  onCommit(value: T): void
}

export function SelectField<T extends string>({ label, value, options, onCommit }: SelectFieldProps<T>): JSX.Element {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select value={value} onChange={(event) => onCommit(event.target.value as T)} className={inputClass}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

interface TagListFieldProps {
  label: string
  value: string[]
  placeholder?: string
  onCommit(value: string[]): void
}

export function TagListField({ label, value, placeholder, onCommit }: TagListFieldProps): JSX.Element {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        key={value.join(',')}
        defaultValue={value.join(', ')}
        placeholder={placeholder}
        onBlur={(event) => {
          const next = event.target.value
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
          onCommit(next)
        }}
        className={inputClass}
      />
    </div>
  )
}

interface BonusListFieldProps {
  value: ItemBonus[]
  onCommit(value: ItemBonus[]): void
}

/** Campo de edición masiva (selección) con botón "Aplicar" explícito. Reutilizable por cualquier módulo de contenido. */
export function BulkSelectField<T extends string>({
  label,
  options,
  onApply
}: {
  label: string
  options: readonly T[]
  onApply(value: T): Promise<void>
}): JSX.Element {
  const [value, setValue] = useState<T>(options[0])
  const [applying, setApplying] = useState(false)

  const apply = async (): Promise<void> => {
    setApplying(true)
    try {
      await onApply(value)
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <FieldLabel>{label}</FieldLabel>
        <select value={value} onChange={(event) => setValue(event.target.value as T)} className={inputClass}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        disabled={applying}
        onClick={apply}
        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        Aplicar
      </button>
    </div>
  )
}

/** Campo de edición masiva (número) con botón "Aplicar" explícito. Reutilizable por cualquier módulo de contenido. */
export function BulkNumberField({
  label,
  onApply
}: {
  label: string
  onApply(value: number): Promise<void>
}): JSX.Element {
  const [value, setValue] = useState('0')
  const [applying, setApplying] = useState(false)

  const apply = async (): Promise<void> => {
    setApplying(true)
    try {
      await onApply(Number(value) || 0)
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <FieldLabel>{label}</FieldLabel>
        <input
          type="number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="button"
        disabled={applying}
        onClick={apply}
        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        Aplicar
      </button>
    </div>
  )
}

export function BonusListField({ value, onCommit }: BonusListFieldProps): JSX.Element {
  const update = (index: number, patch: Partial<ItemBonus>): void => {
    onCommit(value.map((bonus, i) => (i === index ? { ...bonus, ...patch } : bonus)))
  }
  const remove = (index: number): void => onCommit(value.filter((_, i) => i !== index))
  const add = (): void => onCommit([...value, { stat: 'stat', value: 0 }])

  return (
    <div>
      <FieldLabel>Bonificaciones</FieldLabel>
      <div className="flex flex-col gap-1.5">
        {value.map((bonus, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <input
              defaultValue={bonus.stat}
              onBlur={(event) => update(index, { stat: event.target.value })}
              className="flex-1 rounded-md border border-surface-border bg-surface-2 px-2 py-1 text-xs text-slate-200 outline-none focus:border-accent"
            />
            <input
              type="number"
              defaultValue={bonus.value}
              onBlur={(event) => update(index, { value: Number(event.target.value) || 0 })}
              className="w-20 rounded-md border border-surface-border bg-surface-2 px-2 py-1 text-xs text-slate-200 outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="rounded p-1 text-slate-500 hover:bg-surface-2 hover:text-red-400"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="mt-1 flex items-center justify-center gap-1 rounded-md border border-dashed border-surface-border py-1 text-xs text-slate-500 hover:border-accent hover:text-accent"
        >
          <Plus size={12} /> Añadir bonificación
        </button>
      </div>
    </div>
  )
}
