import { useWeaponsStore } from '../store'
import { useContentActions } from '@renderer/shared/content/useContentModule'
import { ITEM_RARITIES } from '@shared-types/item'
import { WEAPON_CLASSES, createEmptyWeaponInput, type Weapon, type WeaponInput } from '@shared-types/weapon'
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

export function WeaponInspector(): JSX.Element {
  const items = useWeaponsStore((s) => s.items)
  const selectedIds = useWeaponsStore((s) => s.selectedIds)
  const { updateRecord, bulkUpdate } = useContentActions(useWeaponsStore, window.api.weapons, createEmptyWeaponInput)

  if (selectedIds.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
        Selecciona una o varias armas para editar
      </div>
    )
  }

  if (selectedIds.length > 1) {
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <div className="text-sm font-medium text-slate-200">{selectedIds.length} armas seleccionadas</div>
        <p className="text-xs text-slate-500">Los cambios aquí se aplican a las {selectedIds.length} armas a la vez.</p>
        <BulkSelectField
          label="Clase"
          options={WEAPON_CLASSES}
          onApply={(value) => bulkUpdate(selectedIds, { category: value })}
        />
        <BulkSelectField
          label="Rareza"
          options={ITEM_RARITIES}
          onApply={(value) => bulkUpdate(selectedIds, { rarity: value })}
        />
        <BulkNumberField label="Daño" onApply={(value) => bulkUpdate(selectedIds, { damage: value })} />
        <BulkNumberField
          label="Nivel requerido"
          onApply={(value) => bulkUpdate(selectedIds, { requiredLevel: value })}
        />
      </div>
    )
  }

  const weapon = items.find((candidate) => candidate.id === selectedIds[0])
  if (!weapon) {
    return <div className="p-4 text-sm text-slate-500">Arma no encontrada</div>
  }

  return <SingleWeaponInspector key={weapon.id} weapon={weapon} onCommit={(patch) => updateRecord(weapon.id, patch)} />
}

function SingleWeaponInspector({
  weapon,
  onCommit
}: {
  weapon: Weapon
  onCommit(patch: Partial<WeaponInput>): void
}): JSX.Element {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <IconField iconId={weapon.iconId} onChange={(iconId) => onCommit({ iconId })} iconRef={weapon.iconRef} onChangeRef={(iconRef) => onCommit({ iconRef })} />

      <TextField label="Nombre" value={weapon.name} onCommit={(name) => onCommit({ name })} />
      <TextAreaField
        label="Descripción"
        value={weapon.description}
        onCommit={(description) => onCommit({ description })}
      />

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Clase"
          value={weapon.category}
          options={WEAPON_CLASSES}
          onCommit={(category) => onCommit({ category })}
        />
        <SelectField
          label="Rareza"
          value={weapon.rarity}
          options={ITEM_RARITIES}
          onCommit={(rarity) => onCommit({ rarity })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Daño" value={weapon.damage} onCommit={(value) => onCommit({ damage: value ?? 0 })} />
        <NumberField
          label="Vel. ataque"
          value={weapon.attackSpeed}
          onCommit={(value) => onCommit({ attackSpeed: value ?? 0 })}
        />
        <NumberField label="Alcance" value={weapon.range} onCommit={(value) => onCommit({ range: value ?? 0 })} />
        <NumberField
          label="Crítico %"
          value={weapon.critChance}
          onCommit={(value) => onCommit({ critChance: value ?? 0 })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <NumberField label="Valor" value={weapon.value} onCommit={(value) => onCommit({ value: value ?? 0 })} />
        <NumberField label="Peso" value={weapon.weight} onCommit={(value) => onCommit({ weight: value ?? 0 })} />
        <NumberField
          label="Nivel req."
          value={weapon.requiredLevel}
          onCommit={(value) => onCommit({ requiredLevel: value ?? 1 })}
        />
      </div>

      <TextField
        label="Profesión requerida"
        value={weapon.requiredProfession ?? ''}
        placeholder="(ninguna)"
        onCommit={(value) => onCommit({ requiredProfession: value || null })}
      />

      <BonusListField value={weapon.bonuses} onCommit={(bonuses) => onCommit({ bonuses })} />
      <TagListField
        label="Scripts"
        value={weapon.scripts}
        placeholder="script1, script2"
        onCommit={(scripts) => onCommit({ scripts })}
      />
      <TagListField
        label="Flags"
        value={weapon.flags}
        placeholder="flag1, flag2"
        onCommit={(flags) => onCommit({ flags })}
      />
      <TagListField
        label="Checks"
        value={weapon.checks}
        placeholder="check1, check2"
        onCommit={(checks) => onCommit({ checks })}
      />

      <div className="text-[10px] text-slate-600">
        #{weapon.id} · actualizado {new Date(weapon.updatedAt).toLocaleString('es')}
      </div>
    </div>
  )
}
