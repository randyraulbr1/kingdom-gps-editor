import { useArmorStore } from '../store'
import { useContentActions } from '@renderer/shared/content/useContentModule'
import { ITEM_RARITIES } from '@shared-types/item'
import { ARMOR_SLOTS, createEmptyArmorInput, type Armor, type ArmorInput } from '@shared-types/armor'
import { IconField } from '@renderer/shared/components/IconField'
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

export function ArmorInspector(): JSX.Element {
  const items = useArmorStore((s) => s.items)
  const selectedIds = useArmorStore((s) => s.selectedIds)
  const { updateRecord, bulkUpdate } = useContentActions(useArmorStore, window.api.armor, createEmptyArmorInput)

  if (selectedIds.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
        Selecciona una o varias armaduras para editar
      </div>
    )
  }

  if (selectedIds.length > 1) {
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <div className="text-sm font-medium text-slate-200">{selectedIds.length} armaduras seleccionadas</div>
        <p className="text-xs text-slate-500">
          Los cambios aquí se aplican a las {selectedIds.length} armaduras a la vez.
        </p>
        <BulkSelectField
          label="Slot"
          options={ARMOR_SLOTS}
          onApply={(value) => bulkUpdate(selectedIds, { category: value })}
        />
        <BulkSelectField
          label="Rareza"
          options={ITEM_RARITIES}
          onApply={(value) => bulkUpdate(selectedIds, { rarity: value })}
        />
        <BulkNumberField label="Defensa" onApply={(value) => bulkUpdate(selectedIds, { defense: value })} />
        <BulkNumberField
          label="Nivel requerido"
          onApply={(value) => bulkUpdate(selectedIds, { requiredLevel: value })}
        />
      </div>
    )
  }

  const armor = items.find((candidate) => candidate.id === selectedIds[0])
  if (!armor) {
    return <div className="p-4 text-sm text-slate-500">Armadura no encontrada</div>
  }

  return <SingleArmorInspector key={armor.id} armor={armor} onCommit={(patch) => updateRecord(armor.id, patch)} />
}

function SingleArmorInspector({
  armor,
  onCommit
}: {
  armor: Armor
  onCommit(patch: Partial<ArmorInput>): void
}): JSX.Element {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <IconField iconId={armor.iconId} onChange={(iconId) => onCommit({ iconId })} iconRef={armor.iconRef} onChangeRef={(iconRef) => onCommit({ iconRef })} />

      <TextField label="Nombre" value={armor.name} onCommit={(name) => onCommit({ name })} />
      <TextAreaField
        label="Descripción"
        value={armor.description}
        onCommit={(description) => onCommit({ description })}
      />

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Slot"
          value={armor.category}
          options={ARMOR_SLOTS}
          onCommit={(category) => onCommit({ category })}
        />
        <SelectField
          label="Rareza"
          value={armor.rarity}
          options={ITEM_RARITIES}
          onCommit={(rarity) => onCommit({ rarity })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Defensa" value={armor.defense} onCommit={(value) => onCommit({ defense: value ?? 0 })} />
        <NumberField
          label="Res. mágica"
          value={armor.magicResist}
          onCommit={(value) => onCommit({ magicResist: value ?? 0 })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <NumberField label="Valor" value={armor.value} onCommit={(value) => onCommit({ value: value ?? 0 })} />
        <NumberField label="Peso" value={armor.weight} onCommit={(value) => onCommit({ weight: value ?? 0 })} />
        <NumberField
          label="Nivel req."
          value={armor.requiredLevel}
          onCommit={(value) => onCommit({ requiredLevel: value ?? 1 })}
        />
      </div>

      <TextField
        label="Profesión requerida"
        value={armor.requiredProfession ?? ''}
        placeholder="(ninguna)"
        onCommit={(value) => onCommit({ requiredProfession: value || null })}
      />

      <BonusListField value={armor.bonuses} onCommit={(bonuses) => onCommit({ bonuses })} />
      <TagListField
        label="Scripts"
        value={armor.scripts}
        placeholder="script1, script2"
        onCommit={(scripts) => onCommit({ scripts })}
      />
      <TagListField label="Flags" value={armor.flags} placeholder="flag1, flag2" onCommit={(flags) => onCommit({ flags })} />
      <TagListField
        label="Checks"
        value={armor.checks}
        placeholder="check1, check2"
        onCommit={(checks) => onCommit({ checks })}
      />

      <div className="text-[10px] text-slate-600">
        #{armor.id} · actualizado {new Date(armor.updatedAt).toLocaleString('es')}
      </div>
    </div>
  )
}
