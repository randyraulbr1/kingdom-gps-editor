import { contextBridge, ipcRenderer } from 'electron'
import type { KingdomGpsApi } from '../shared-types/api'

/**
 * The renderer never gets `require`/`ipcRenderer` directly (sandbox: false
 * but contextIsolation stays on by default) - this is the only surface it
 * can call. Every method here is a 1:1 mirror of a channel registered in
 * src/main/ipc/handlers/*.
 */
const api: KingdomGpsApi = {
  project: {
    create: (parentDir, name) => ipcRenderer.invoke('project:create', parentDir, name),
    open: (projectPath) => ipcRenderer.invoke('project:open', projectPath),
    listRecent: () => ipcRenderer.invoke('project:listRecent'),
    getCurrent: () => ipcRenderer.invoke('project:getCurrent'),
    checkHealth: () => ipcRenderer.invoke('project:checkHealth'),
    backupNow: () => ipcRenderer.invoke('project:backupNow')
  },
  icons: {
    list: (query) => ipcRenderer.invoke('icons:list', query),
    get: (iconId) => ipcRenderer.invoke('icons:get', iconId),
    importFolder: (sourceDir) => ipcRenderer.invoke('icons:importFolder', sourceDir),
    toggleFavorite: (iconId) => ipcRenderer.invoke('icons:toggleFavorite', iconId),
    setTags: (iconId, tags) => ipcRenderer.invoke('icons:setTags', iconId, tags),
    resize: (request) => ipcRenderer.invoke('icons:resize', request),
    listCategories: () => ipcRenderer.invoke('icons:listCategories'),
    listTags: () => ipcRenderer.invoke('icons:listTags')
  },
  items: {
    query: (params) => ipcRenderer.invoke('items:query', params),
    get: (id) => ipcRenderer.invoke('items:get', id),
    create: (data) => ipcRenderer.invoke('items:create', data),
    update: (id, patch) => ipcRenderer.invoke('items:update', id, patch),
    delete: (id) => ipcRenderer.invoke('items:delete', id),
    bulkUpdate: (ids, patch) => ipcRenderer.invoke('items:bulkUpdate', ids, patch),
    bulkDelete: (ids) => ipcRenderer.invoke('items:bulkDelete', ids),
    listCategories: () => ipcRenderer.invoke('items:listCategories')
  },
  weapons: {
    query: (params) => ipcRenderer.invoke('weapons:query', params),
    get: (id) => ipcRenderer.invoke('weapons:get', id),
    create: (data) => ipcRenderer.invoke('weapons:create', data),
    update: (id, patch) => ipcRenderer.invoke('weapons:update', id, patch),
    delete: (id) => ipcRenderer.invoke('weapons:delete', id),
    bulkUpdate: (ids, patch) => ipcRenderer.invoke('weapons:bulkUpdate', ids, patch),
    bulkDelete: (ids) => ipcRenderer.invoke('weapons:bulkDelete', ids),
    listCategories: () => ipcRenderer.invoke('weapons:listCategories')
  },
  armor: {
    query: (params) => ipcRenderer.invoke('armor:query', params),
    get: (id) => ipcRenderer.invoke('armor:get', id),
    create: (data) => ipcRenderer.invoke('armor:create', data),
    update: (id, patch) => ipcRenderer.invoke('armor:update', id, patch),
    delete: (id) => ipcRenderer.invoke('armor:delete', id),
    bulkUpdate: (ids, patch) => ipcRenderer.invoke('armor:bulkUpdate', ids, patch),
    bulkDelete: (ids) => ipcRenderer.invoke('armor:bulkDelete', ids),
    listCategories: () => ipcRenderer.invoke('armor:listCategories')
  },
  monsters: {
    query: (params) => ipcRenderer.invoke('monsters:query', params),
    get: (id) => ipcRenderer.invoke('monsters:get', id),
    create: (data) => ipcRenderer.invoke('monsters:create', data),
    update: (id, patch) => ipcRenderer.invoke('monsters:update', id, patch),
    delete: (id) => ipcRenderer.invoke('monsters:delete', id),
    bulkUpdate: (ids, patch) => ipcRenderer.invoke('monsters:bulkUpdate', ids, patch),
    bulkDelete: (ids) => ipcRenderer.invoke('monsters:bulkDelete', ids),
    listCategories: () => ipcRenderer.invoke('monsters:listCategories')
  },
  export: {
    icons: () => ipcRenderer.invoke('export:icons'),
    items: () => ipcRenderer.invoke('export:items'),
    weapons: () => ipcRenderer.invoke('export:weapons'),
    armor: () => ipcRenderer.invoke('export:armor'),
    monsters: () => ipcRenderer.invoke('export:monsters'),
    world: () => ipcRenderer.invoke('export:world')
  },
  commandHistory: {
    listRecent: (limit) => ipcRenderer.invoke('commandHistory:listRecent', limit),
    undo: () => ipcRenderer.invoke('commandHistory:undo'),
    redo: () => ipcRenderer.invoke('commandHistory:redo')
  },
  worldEditor: {
    createEntity: (request) => ipcRenderer.invoke('worldEditor:createEntity', request),
    updateEntity: (request) => ipcRenderer.invoke('worldEditor:updateEntity', request),
    moveEntity: (request) => ipcRenderer.invoke('worldEditor:moveEntity', request),
    deleteEntity: (request) => ipcRenderer.invoke('worldEditor:deleteEntity', request),
    getEntity: (worldId) => ipcRenderer.invoke('worldEditor:getEntity', worldId),
    queryEntities: (query) => ipcRenderer.invoke('worldEditor:queryEntities', query),
    listByType: (entityType) => ipcRenderer.invoke('worldEditor:listByType', entityType),
    toggleEntity: (worldId) => ipcRenderer.invoke('worldEditor:toggleEntity', worldId),
    duplicateEntity: (worldId) => ipcRenderer.invoke('worldEditor:duplicateEntity', worldId),
    publishEntity: (worldId) => ipcRenderer.invoke('worldEditor:publishEntity', worldId),
    getPublishSummary: () => ipcRenderer.invoke('worldEditor:getPublishSummary'),
    publishChanges: (request) => ipcRenderer.invoke('worldEditor:publishChanges', request),
    getSyncStatus: () => ipcRenderer.invoke('worldEditor:getSyncStatus'),
    retryFailed: () => ipcRenderer.invoke('worldEditor:retryFailed'),
    resolveConflict: (resolution) => ipcRenderer.invoke('worldEditor:resolveConflict', resolution),
    exportWorld: () => ipcRenderer.invoke('worldEditor:exportWorld'),
    clearUnsyncedChanges: (worldIds) => ipcRenderer.invoke('worldEditor:clearUnsyncedChanges', worldIds)
  },
  worldZones: {
    create: (request) => ipcRenderer.invoke('worldZones:create', request),
    update: (request) => ipcRenderer.invoke('worldZones:update', request),
    delete: (zoneId) => ipcRenderer.invoke('worldZones:delete', zoneId),
    list: () => ipcRenderer.invoke('worldZones:list')
  },
  enemyRoutes: {
    create: (request) => ipcRenderer.invoke('enemyRoutes:create', request),
    update: (request) => ipcRenderer.invoke('enemyRoutes:update', request),
    delete: (routeId) => ipcRenderer.invoke('enemyRoutes:delete', routeId),
    list: () => ipcRenderer.invoke('enemyRoutes:list')
  },
  osm: {
    queryPlaces: (request) => ipcRenderer.invoke('osm:queryPlaces', request)
  },
  updates: {
    getVersion: () => ipcRenderer.invoke('updates:getVersion'),
    check: () => ipcRenderer.invoke('updates:check'),
    downloadAndInstall: () => ipcRenderer.invoke('updates:downloadAndInstall')
  },
  capture: {
    window: () => ipcRenderer.invoke('capture:window')
  },
  server: {
    get: () => ipcRenderer.invoke('server:get'),
    set: (config) => ipcRenderer.invoke('server:set', config)
  },
  dialog: {
    pickFolder: () => ipcRenderer.invoke('dialog:pickFolder')
  },
  windowControls: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
    close: () => ipcRenderer.invoke('window:close')
  }
}

contextBridge.exposeInMainWorld('api', api)
