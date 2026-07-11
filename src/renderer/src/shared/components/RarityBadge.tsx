import type { ItemRarity } from '@shared-types/item'

const LABELS: Record<ItemRarity, string> = {
  common: 'Común',
  uncommon: 'Poco común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario'
}

const COLOR_CLASS: Record<ItemRarity, string> = {
  common: 'bg-rarity-common/20 text-rarity-common border-rarity-common/40',
  uncommon: 'bg-rarity-uncommon/20 text-rarity-uncommon border-rarity-uncommon/40',
  rare: 'bg-rarity-rare/20 text-rarity-rare border-rarity-rare/40',
  epic: 'bg-rarity-epic/20 text-rarity-epic border-rarity-epic/40',
  legendary: 'bg-rarity-legendary/20 text-rarity-legendary border-rarity-legendary/40'
}

const BORDER_CLASS: Record<ItemRarity, string> = {
  common: 'border-rarity-common',
  uncommon: 'border-rarity-uncommon',
  rare: 'border-rarity-rare',
  epic: 'border-rarity-epic',
  legendary: 'border-rarity-legendary'
}

export function RarityBadge({ rarity }: { rarity: ItemRarity }): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${COLOR_CLASS[rarity]}`}
    >
      {LABELS[rarity]}
    </span>
  )
}

export function rarityBorderClass(rarity: ItemRarity): string {
  return BORDER_CLASS[rarity]
}
