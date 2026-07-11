import type { IconLibraryRepository } from '../icons/iconLibraryRepository'
import type { ItemsRepository } from '../items/itemsRepository'
import type { WorldEntityRepository } from '../worldEditor/worldEntityRepository'
import type { ChangeLogService } from './changeLog'
import type { ChangeLogEntry } from '@shared-types/commands'
import type { Item } from '@shared-types/item'
import type { WorldEntity, Position } from '@shared-types/world'

/**
 * Applies the inverse (undo) or forward (redo) side of a ChangeLogEntry.
 * Each module registers its own case in applyState() as it gains real
 * mutations, following this same before/after JSON-snapshot pattern - no
 * per-module undo stacks. Items (Fase 2) is the reference: create/update/
 * delete/bulkUpdate all round-trip through here.
 */
export class CommandBus {
  constructor(
    private changeLog: ChangeLogService,
    private iconRepository: IconLibraryRepository,
    private itemsRepository: ItemsRepository,
    private worldEntityRepository: WorldEntityRepository
  ) {}

  async recordFavoriteToggle(iconId: number, before: boolean, after: boolean): Promise<void> {
    await this.changeLog.record({ moduleId: 'icon-library', entityId: iconId, action: 'favorite', before, after })
  }

  async recordTagsChange(iconId: number, before: string[], after: string[]): Promise<void> {
    await this.changeLog.record({ moduleId: 'icon-library', entityId: iconId, action: 'tags', before, after })
  }

  async recordItemCreate(item: Item): Promise<void> {
    await this.changeLog.record({ moduleId: 'items', entityId: item.id, action: 'create', before: null, after: item })
  }

  async recordItemUpdate(before: Item, after: Item): Promise<void> {
    await this.changeLog.record({ moduleId: 'items', entityId: after.id, action: 'update', before, after })
  }

  async recordItemDelete(item: Item): Promise<void> {
    await this.changeLog.record({ moduleId: 'items', entityId: item.id, action: 'delete', before: item, after: null })
  }

  async recordItemBulkUpdate(before: Array<Item | undefined>, after: Item[]): Promise<void> {
    await this.changeLog.record({ moduleId: 'items', entityId: null, action: 'bulkUpdate', before, after })
  }

  async recordWorldEntityCreate(entity: WorldEntity): Promise<void> {
    await this.changeLog.record({
      moduleId: 'worldEditor',
      entityId: entity.worldId,
      action: 'create',
      before: null,
      after: entity
    })
  }

  async recordWorldEntityUpdate(before: WorldEntity, after: WorldEntity): Promise<void> {
    await this.changeLog.record({
      moduleId: 'worldEditor',
      entityId: after.worldId,
      action: 'update',
      before,
      after
    })
  }

  async recordWorldEntityMove(before: WorldEntity, after: WorldEntity): Promise<void> {
    await this.changeLog.record({
      moduleId: 'worldEditor',
      entityId: after.worldId,
      action: 'move',
      before: before.position,
      after: after.position
    })
  }

  async recordWorldEntityDelete(entity: WorldEntity): Promise<void> {
    await this.changeLog.record({
      moduleId: 'worldEditor',
      entityId: entity.worldId,
      action: 'delete',
      before: entity,
      after: null
    })
  }

  async recordWorldEntityToggle(before: WorldEntity, after: WorldEntity): Promise<void> {
    await this.changeLog.record({
      moduleId: 'worldEditor',
      entityId: after.worldId,
      action: 'toggle',
      before: before.enabled,
      after: after.enabled
    })
  }

  private async applyIconState(entry: ChangeLogEntry, useAfter: boolean): Promise<void> {
    if (entry.entityId === null) return
    const iconId = Number(entry.entityId)
    const value = useAfter ? entry.after : entry.before

    if (entry.action === 'favorite') {
      await this.iconRepository.setFavorite(iconId, value as boolean)
    } else if (entry.action === 'tags') {
      await this.iconRepository.setTags(iconId, value as string[])
    }
  }

  private async applyItemState(entry: ChangeLogEntry, useAfter: boolean): Promise<void> {
    if (entry.action === 'create') {
      if (useAfter) {
        await this.itemsRepository.restoreWithId(entry.after as Item)
      } else if (entry.entityId !== null) {
        await this.itemsRepository.delete(Number(entry.entityId))
      }
    } else if (entry.action === 'delete') {
      if (useAfter) {
        if (entry.entityId !== null) await this.itemsRepository.delete(Number(entry.entityId))
      } else {
        await this.itemsRepository.restoreWithId(entry.before as Item)
      }
    } else if (entry.action === 'update') {
      const item = (useAfter ? entry.after : entry.before) as Item | null
      if (item) await this.itemsRepository.update(item.id, item)
    } else if (entry.action === 'bulkUpdate') {
      const items = (useAfter ? entry.after : entry.before) as Array<Item | null | undefined>
      for (const item of items) {
        if (item) await this.itemsRepository.update(item.id, item)
      }
    }
  }

  private async applyWorldEntityState(entry: ChangeLogEntry, useAfter: boolean): Promise<void> {
    if (entry.entityId === null) return
    const worldId = String(entry.entityId)

    if (entry.action === 'create') {
      if (useAfter) {
        await this.worldEntityRepository.restoreWithId(entry.after as WorldEntity)
      } else {
        await this.worldEntityRepository.hardDelete(worldId)
      }
    } else if (entry.action === 'delete') {
      if (useAfter) {
        await this.worldEntityRepository.softDelete(worldId)
      } else {
        await this.worldEntityRepository.restoreWithId(entry.before as WorldEntity)
      }
    } else if (entry.action === 'update') {
      const entity = (useAfter ? entry.after : entry.before) as WorldEntity | null
      if (entity) await this.worldEntityRepository.restoreWithId(entity)
    } else if (entry.action === 'move') {
      const position = (useAfter ? entry.after : entry.before) as Position
      await this.worldEntityRepository.move(worldId, position)
    } else if (entry.action === 'toggle') {
      const enabled = (useAfter ? entry.after : entry.before) as boolean
      await this.worldEntityRepository.setEnabled(worldId, enabled)
    }
  }

  private async applyState(entry: ChangeLogEntry, useAfter: boolean): Promise<void> {
    if (entry.moduleId === 'icon-library') {
      await this.applyIconState(entry, useAfter)
    } else if (entry.moduleId === 'items') {
      await this.applyItemState(entry, useAfter)
    } else if (entry.moduleId === 'worldEditor') {
      await this.applyWorldEntityState(entry, useAfter)
    }
  }

  async undo(): Promise<ChangeLogEntry | null> {
    const entry = await this.changeLog.findLastActive()
    if (!entry) return null
    await this.applyState(entry, false)
    await this.changeLog.markUndone(entry.id, true)
    return entry
  }

  async redo(): Promise<ChangeLogEntry | null> {
    const entry = await this.changeLog.findLastUndone()
    if (!entry) return null
    await this.applyState(entry, true)
    await this.changeLog.markUndone(entry.id, false)
    return entry
  }
}
