import { useState } from 'react'
import { useItemsStore } from '../store/itemsStore'
import { useItems } from '../hooks/useItems'
import { ITEM_CATEGORIES, ITEM_RARITIES, type Item, type ItemInput } from '@shared-types/item'
import { IconThumbnail } from '@renderer/shared/components/IconThumbnail'
import {
  TextField,
  TextAreaField,
  NumberField,
  SelectField,
  TagListField,
  BonusListField
} from '@renderer/shared/components/inspector/fields'

export function ItemInspector(): JSX.Element {
  const items = useItemsStore((s) => s.items)
  const selectedIds = useItemsStore((s) => s.selectedIds)
  const { updateItem, bulkUpdate } = useItems()

  if (selectedIds.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
        Selecciona uno o varios objetos para editar
      </div>
    )
  }

  if (selectedIds.length > 1) {
    return <BulkEditPanel ids={selectedIds} onApply={(patch) => bulkUpdate(selectedIds, patch)} />
  }

  const item = items.find((candidate) => candidate.id === selectedIds[0])
  if (!item) {
    return <div className="p-4 text-sm text-slate-500">Objeto no encontrado</div>
  }

  return <SingleItemInspector key={item.id} item={item} onCommit={(patch) => updateItem(item.id, patch)} />
}

function SingleItemInspector({
  item,
  onCommit
}: {
  item: Item
  onCommit(patch: Partial<ItemInput>): void
}): JSX.Element {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          const iconId = event.dataTransfer.getData('application/x-kgps-icon-id')
          if (iconId) onCommit({ iconId: Number(iconId) })
        }}
        className="flex items-center gap-3 rounded-md border border-dashed border-surface-border bg-surface-2 p-3"
      >
        <IconThumbnail iconId={item.iconId} size={48} />
        <div className="text-xs text-slate-500">Arrastra un icono aquí desde la Biblioteca de Iconos</div>
      </div>

      <TextField label="Nombre" value={item.name} onCommit={(name) => onCommit({ name })} />
      <TextAreaField label="Descripción" value={item.description} onCommit={(description) => onCommit({ description })} />

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Categoría"
          value={item.category}
          options={ITEM_CATEGORIES}
          onCommit={(category) => onCommit({ category })}
        />
        <SelectField
          label="Rareza"
          value={item.rarity}
          options={ITEM_RARITIES}
          onCommit={(rarity) => onCommit({ rarity })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <NumberField label="Valor" value={item.value} onCommit={(value) => onCommit({ value: value ?? 0 })} />
        <NumberField label="Peso" value={item.weight} onCommit={(weight) => onCommit({ weight: weight ?? 0 })} />
        <NumberField
          label="Stack"
          value={item.stackSize}
          onCommit={(stackSize) => onCommit({ stackSize: stackSize ?? 1 })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Durabilidad"
          value={item.durability}
          allowNull
          onCommit={(durability) => onCommit({ durability })}
        />
        <NumberField
          label="Nivel requerido"
          value={item.requiredLevel}
          onCommit={(requiredLevel) => onCommit({ requiredLevel: requiredLevel ?? 1 })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <NumberField
          label="Vida"
          value={item.healthRestore}
          allowNull
          onCommit={(healthRestore) => onCommit({ healthRestore })}
        />
        <NumberField
          label="Comida"
          value={item.foodRestore}
          allowNull
          onCommit={(foodRestore) => onCommit({ foodRestore })}
        />
        <NumberField
          label="Mana"
          value={item.manaRestore}
          allowNull
          onCommit={(manaRestore) => onCommit({ manaRestore })}
        />
      </div>

      <TextField
        label="Profesión requerida"
        value={item.requiredProfession ?? ''}
        placeholder="(ninguna)"
        onCommit={(value) => onCommit({ requiredProfession: value || null })}
      />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Tipo de arma"
          value={item.weaponType ?? ''}
          placeholder="(no aplica)"
          onCommit={(value) => onCommit({ weaponType: value || null })}
        />
        <TextField
          label="Tipo de armadura"
          value={item.armorType ?? ''}
          placeholder="(no aplica)"
          onCommit={(value) => onCommit({ armorType: value || null })}
        />
      </div>

      <BonusListField value={item.bonuses} onCommit={(bonuses) => onCommit({ bonuses })} />
      <TagListField label="Scripts" value={item.scripts} placeholder="script1, script2" onCommit={(scripts) => onCommit({ scripts })} />
      <TagListField label="Flags" value={item.flags} placeholder="flag1, flag2" onCommit={(flags) => onCommit({ flags })} />
      <TagListField label="Checks" value={item.checks} placeholder="check1, check2" onCommit={(checks) => onCommit({ checks })} />

      <div className="text-[10px] text-slate-600">
        #{item.id} · actualizado {new Date(item.updatedAt).toLocaleString('es')}
      </div>
    </div>
  )
}

function BulkEditPanel({
  ids,
  onApply
}: {
  ids: number[]
  onApply(patch: Partial<ItemInput>): Promise<void>
}): JSX.Element {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="text-sm font-medium text-slate-200">{ids.length} objetos seleccionados</div>
      <p className="text-xs text-slate-500">Los cambios aquí se aplican a los {ids.length} objetos a la vez.</p>

      <BulkSelectField
        label="Categoría"
        options={ITEM_CATEGORIES}
        onApply={(value) => onApply({ category: value })}
      />
      <BulkSelectField label="Rareza" options={ITEM_RARITIES} onApply={(value) => onApply({ rarity: value })} />
      <BulkNumberField label="Nivel requerido" onApply={(value) => onApply({ requiredLevel: value })} />
      <BulkNumberField label="Valor" onApply={(value) => onApply({ value })} />
    </div>
  )
}

function BulkSelectField<T extends string>({
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
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</label>
        <select
          value={value}
          onChange={(event) => setValue(event.target.value as T)}
          className="w-full rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-accent"
        >
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

function BulkNumberField({
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
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</label>
        <input
          type="number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-accent"
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
