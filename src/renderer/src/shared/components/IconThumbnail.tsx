import { useIconPath } from '@renderer/shared/hooks/useIconPath'

interface IconThumbnailProps {
  iconId: number | null
  size?: number
}

export function IconThumbnail({ iconId, size = 32 }: IconThumbnailProps): JSX.Element {
  const path = useIconPath(iconId)

  if (!path) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded bg-surface-1 text-[8px] text-slate-600"
      >
        —
      </div>
    )
  }

  return (
    <img
      src={`kgps-icon://${path}`}
      alt=""
      style={{ width: size, height: size }}
      className="shrink-0 rounded object-contain"
      draggable={false}
    />
  )
}
