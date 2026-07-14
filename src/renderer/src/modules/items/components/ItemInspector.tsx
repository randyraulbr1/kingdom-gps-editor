import { useState } from 'react'
import { useItemsStore } from '../store'
import { useContentActions } from '@renderer/shared/content/useContentModule'
import { ITEM_CATEGORIES, ITEM_RARITIES, createEmptyItemInput, type Item, type ItemInput } from '@shared-types/item'
import { IconThumbnail } from '@renderer/shared/components/IconThumbnail'
import { IconPickerModal } from '@renderer/shared/components/IconPickerModal'
import {
  TextField,
  TextAreaField,
  NumberField,
  SelectField,
  TagListField,
  BonusListField,
  BulkSelectField,
  BulkNumberField
} from '@renderer/shared/components/inspector/fields'

/** Migrado al framework de contenido: mismo patrón que WeaponInspector/ArmorInspector, con los campos propios de Objetos. */
export function ItemInspector(): JSX.Element {
  const items = useItemsStore((s) => s.items)
  const selectedIds = useItemsStore((s) => s.selectedIds)
  const { updateRecord, bulkUpdate } = useContentActions(useItemsStore, window.api.items, createEmptyItemInput)

  if (selectedIds.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
        Selecciona uno o varios objetos para editar
      </div>
    )
  }

  if (selectedIds.length > 1) {
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <div className="text-sm font-medium text-slate-200">{selectedIds.length} objetos seleccionados</div>
        <p className="text-xs text-slate-500">Los cambios aquí se aplican a los {selectedIds.length} objetos a la vez.</p>
        <BulkSelectField
          label="Categoría"
          options={ITEM_CATEGORIES}
          onApply={(value) => bulkUpdate(selectedIds, { category: value })}
        />
        <BulkSelectField
          label="Rareza"
          options={ITEM_RARITIES}
          onApply={(value) => bulkUpdate(selectedIds, { rarity: value })}
        />
        <BulkNumberField label="Nivel requerido" onApply={(value) => bulkUpdate(selectedIds, { requiredLevel: value })} />
        <BulkNumberField label="Valor" onApply={(value) => bulkUpdate(selectedIds, { value })} />
      </div>
    )
  }

  const item = items.find((candidate) => candidate.id === selectedIds[0])
  if (!item) {
    return <div className="p-4 text-sm text-slate-500">Objeto no encontrado</div>
  }

  return <SingleItemInspector key={item.id} item={item} onCommit={(patch) => updateRecord(item.id, patch)} />
}

function SingleItemInspector({
  item,
  onCommit
}: {
  item: Item
  onCommit(patch: Partial<ItemInput>): void
}): JSX.Element {
  const [pickingIcon, setPickingIcon] = useState(false)
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
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setPickingIcon(true)}
            className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white hover:brightness-110"
          >
            {item.iconId ? 'Cambiar icono' : 'Elegir icono'}
          </button>
          <div className="mt-1 text-[11px] text-slate-500">
            Elige desde la Biblioteca o arrástralo aquí. Se guarda la referencia, no la imagen.
          </div>
        </div>
      </div>
      {pickingIcon && (
        <IconPickerModal
          currentIconId={item.iconId}
          onClose={() => setPickingIcon(false)}
          onPick={(iconId) => {
            onCommit({ iconId })
            setPickingIcon(false)
          }}
        />
      )}

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
        <NumberField label="Vida" value={item.healthRestore} allowNull onCommit={(healthRestore) => onCommit({ healthRestore })} />
        <NumberField label="Comida" value={item.foodRestore} allowNull onCommit={(foodRestore) => onCommit({ foodRestore })} />
        <NumberField label="Mana" value={item.manaRestore} allowNull onCommit={(manaRestore) => onCommit({ manaRestore })} />
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
