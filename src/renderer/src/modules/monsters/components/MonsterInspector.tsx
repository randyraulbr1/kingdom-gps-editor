import { useMonsterStore } from '../store'
import { useContentActions } from '@renderer/shared/content/useContentModule'
import { ITEM_RARITIES } from '@shared-types/item'
import { MONSTER_CATEGORIES, createEmptyMonsterInput, type Monster, type MonsterInput } from '@shared-types/monster'
import { IconField } from '@renderer/shared/components/IconField'
import {
  TextField,
  TextAreaField,
  NumberField,
  SelectField,
  TagListField,
  BulkSelectField,
  BulkNumberField
} from '@renderer/shared/components/inspector/fields'

export function MonsterInspector(): JSX.Element {
  const items = useMonsterStore((s) => s.items)
  const selectedIds = useMonsterStore((s) => s.selectedIds)
  const { updateRecord, bulkUpdate } = useContentActions(useMonsterStore, window.api.monsters, createEmptyMonsterInput)

  if (selectedIds.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
        Selecciona uno o varios monstruos para editar
      </div>
    )
  }

  if (selectedIds.length > 1) {
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <div className="text-sm font-medium text-slate-200">{selectedIds.length} monstruos seleccionados</div>
        <p className="text-xs text-slate-500">Los cambios aquí se aplican a los {selectedIds.length} monstruos a la vez.</p>
        <BulkSelectField label="Categoría" options={MONSTER_CATEGORIES} onApply={(value) => bulkUpdate(selectedIds, { category: value })} />
        <BulkSelectField label="Rareza" options={ITEM_RARITIES} onApply={(value) => bulkUpdate(selectedIds, { rarity: value })} />
        <BulkNumberField label="Nivel" onApply={(value) => bulkUpdate(selectedIds, { level: value })} />
        <BulkNumberField label="Vida (HP)" onApply={(value) => bulkUpdate(selectedIds, { hp: value })} />
      </div>
    )
  }

  const monster = items.find((candidate) => candidate.id === selectedIds[0])
  if (!monster) {
    return <div className="p-4 text-sm text-slate-500">Monstruo no encontrado</div>
  }

  return <SingleMonsterInspector key={monster.id} monster={monster} onCommit={(patch) => updateRecord(monster.id, patch)} />
}

function SingleMonsterInspector({
  monster,
  onCommit
}: {
  monster: Monster
  onCommit(patch: Partial<MonsterInput>): void
}): JSX.Element {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <IconField iconId={monster.iconId} onChange={(iconId) => onCommit({ iconId })} />

      <TextField label="Nombre" value={monster.name} onCommit={(name) => onCommit({ name })} />
      <TextAreaField label="Descripción" value={monster.description} onCommit={(description) => onCommit({ description })} />

      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Categoría" value={monster.category} options={MONSTER_CATEGORIES} onCommit={(category) => onCommit({ category })} />
        <SelectField label="Rareza" value={monster.rarity} options={ITEM_RARITIES} onCommit={(rarity) => onCommit({ rarity })} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <NumberField label="Nivel" value={monster.level} onCommit={(value) => onCommit({ level: value ?? 1 })} />
        <NumberField label="Vida (HP)" value={monster.hp} onCommit={(value) => onCommit({ hp: value ?? 1 })} />
        <NumberField label="Velocidad" value={monster.speed} onCommit={(value) => onCommit({ speed: value ?? 0 })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Daño" value={monster.damage} onCommit={(value) => onCommit({ damage: value ?? 0 })} />
        <NumberField label="Defensa" value={monster.defense} onCommit={(value) => onCommit({ defense: value ?? 0 })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Experiencia" value={monster.xpReward} onCommit={(value) => onCommit({ xpReward: value ?? 0 })} />
        <NumberField label="Monedas" value={monster.coinReward} onCommit={(value) => onCommit({ coinReward: value ?? 0 })} />
      </div>

      <TagListField label="Scripts" value={monster.scripts} placeholder="script1, script2" onCommit={(scripts) => onCommit({ scripts })} />
      <TagListField label="Flags" value={monster.flags} placeholder="flag1, flag2" onCommit={(flags) => onCommit({ flags })} />
      <TagListField label="Checks" value={monster.checks} placeholder="check1, check2" onCommit={(checks) => onCommit({ checks })} />

      <div className="text-[10px] text-slate-600">
        #{monster.id} · actualizado {new Date(monster.updatedAt).toLocaleString('es')}
      </div>
    </div>
  )
}
