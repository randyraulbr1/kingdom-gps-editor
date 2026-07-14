import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  CircleMarker,
  useMap,
  useMapEvents
} from 'react-leaflet'
import type { DragEndEvent, LeafletMouseEvent, Marker as LeafletMarker, DivIcon, Map as LeafletMap } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useWorldEditorStore, useVisibleEntities } from '../hooks/useWorldEditorStore'
import { WorldEditorService } from '../services/entityService'
import { ZoneService } from '../services/zoneService'
import { EnemyRouteService } from '../services/enemyRouteService'
import { WorldEntityType, type Position, type WorldZone, type EnemyRoute } from '@shared-types/world'
import { routeLengthMeters } from '../content/enemyRoute'
import { getEntityIcon, getEntityColors } from '../utils/markerColors'
import { isPointInPolygon } from '../utils/geo'
import { LayersPanel } from './LayersPanel'
import { ZonesPanel } from './ZonesPanel'
import { EntityInspector } from './EntityInspector'
import { MapContextMenu, type MapMenuContext } from './MapContextMenu'
import { SyncStatusMenu } from './SyncStatusMenu'
import { OsmImportModal } from './OsmImportModal'
import { ShopModal } from './ShopModal'
import { NpcModal } from './NpcModal'
import { EnemyModal } from './EnemyModal'
import { ChestModal } from './ChestModal'
import { ResourceModal } from './ResourceModal'
import { RouteModal } from './RouteModal'
import { WorldValidatorPanel } from './WorldValidatorPanel'
import { MapSearchBar } from './MapSearchBar'
import { validateWorld, type WorldValidationSummary, type ValidationIssue } from '../content/worldValidator'
import type { SearchResult } from '../content/mapSearch'
import { getReferencesTo, unlinkReference, worldIdsWithBrokenRefs } from '../content/referenceService'
import { makeClipboardEntry, buildPasteRequest } from '../utils/clipboard'
import { readNpcConfig, npcPinBadge } from '../content/npcConfig'
import type { WorldEntityUI } from '../types'
import { Layers, Map as MapIcon, Hexagon, Download, List, Swords, ShieldCheck, UploadCloud } from 'lucide-react'

/** Color del punto de estado de sincronización que se muestra sobre cada marcador. */
const SYNC_DOT_COLORS: Record<string, string> = {
  local: '#94a3b8',
  pending: '#f59e0b',
  syncing: '#3b82f6',
  synced: '#22c55e',
  failed: '#ef4444',
  conflict: '#f97316',
  offline: '#64748b',
  deleted_pending: '#64748b',
  deleting: '#64748b',
  deleted: '#64748b'
}

interface MapStyle {
  id: string
  label: string
  url: string
  attribution: string
  subdomains?: string
  /** Zoom máximo con teselas propias; más allá se sobre-escalan (overzoom). */
  maxNativeZoom: number
}

/** Zoom máximo del mapa (permite acercar más allá de las teselas nativas). */
const MAP_MAX_ZOOM = 22

/**
 * Capas base disponibles. Las "sin etiquetas" no muestran nombres de calles ni
 * lugares (útil para ver el mundo limpio); las otras dos añaden calles/satélite.
 * Ningún proveedor requiere API key; sus dominios están permitidos en la CSP de
 * index.html (img-src/connect-src).
 */
const MAP_STYLES: MapStyle[] = [
  {
    id: 'dark-nolabels',
    label: 'Oscuro sin etiquetas',
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxNativeZoom: 20
  },
  {
    id: 'light-nolabels',
    label: 'Claro sin etiquetas',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxNativeZoom: 20
  },
  {
    id: 'streets',
    label: 'Calles (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxNativeZoom: 19
  },
  {
    id: 'satellite',
    label: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxNativeZoom: 19
  }
]

/** Paleta cíclica para colorear zonas nuevas. */
const ZONE_COLORS = ['#1E90FF', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4']

/** Preferencias de vista del mapa que se recuerdan entre sesiones. */
interface MapViewPrefs {
  styleId: string
  center: [number, number]
  zoom: number
}

const VIEW_STORAGE_KEY = 'kgps.worldEditor.mapView'
const DEFAULT_VIEW: MapViewPrefs = { styleId: 'dark-nolabels', center: [0, 0], zoom: 2 }

function loadView(): MapViewPrefs {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MapViewPrefs>
      return {
        styleId: parsed.styleId ?? DEFAULT_VIEW.styleId,
        center: parsed.center ?? DEFAULT_VIEW.center,
        zoom: parsed.zoom ?? DEFAULT_VIEW.zoom
      }
    }
  } catch {
    // localStorage no disponible o JSON corrupto: usar valores por defecto.
  }
  return DEFAULT_VIEW
}

function saveView(prefs: MapViewPrefs): void {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignorar fallos de escritura (p. ej. almacenamiento no disponible).
  }
}

/** Etiqueta legible por tipo, para nombrar entidades nuevas. */
const TYPE_NAME: Partial<Record<WorldEntityType, string>> = {
  [WorldEntityType.Npc]: 'NPC',
  [WorldEntityType.Enemy]: 'Enemigo',
  [WorldEntityType.Object]: 'Objeto',
  [WorldEntityType.Chest]: 'Cofre',
  [WorldEntityType.Shop]: 'Tienda',
  [WorldEntityType.Resource]: 'Recurso',
  [WorldEntityType.Quest]: 'Misión',
  [WorldEntityType.Event]: 'Evento',
  [WorldEntityType.Marker]: 'Pin'
}

/** Divs, not L.Icon.Default - sidesteps the classic "marker icon 404" bundler issue entirely. */
function makeDivIcon(
  entityType: WorldEntityType,
  isSelected: boolean,
  syncStatus: string,
  badge: string | null
): DivIcon {
  const colors = getEntityColors(entityType)
  const emoji = getEntityIcon(entityType)
  const dot = SYNC_DOT_COLORS[syncStatus] ?? '#94a3b8'
  // Indicador de contenido (p. ej. misión de NPC: ! disponible, ? lista).
  const badgeHtml = badge
    ? `<span style="position:absolute;bottom:-3px;left:-3px;min-width:13px;height:13px;padding:0 2px;border-radius:7px;background:#111827;border:1.5px solid ${colors.color};color:#fbbf24;font-size:9px;font-weight:700;line-height:11px;text-align:center;">${badge}</span>`
    : ''
  return L.divIcon({
    html: `<div style="position:relative;width:30px;height:30px;border-radius:50%;background:${colors.bg};border:2px solid ${
      isSelected ? '#ffffff' : colors.color
    };display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 1px 4px rgba(0,0,0,0.5);">${emoji}<span class="sync-dot" title="Estado: ${syncStatus} · clic para opciones" style="position:absolute;top:-4px;right:-4px;width:13px;height:13px;border-radius:50%;background:${dot};border:2px solid #1e1f22;cursor:pointer;"></span>${badgeHtml}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })
}

/**
 * Indicador de contenido a mostrar sobre el marcador. Prioriza el aviso de
 * referencia rota (⚠, doc 19); si no, el estado de misión del NPC (!/?/🛒).
 */
function entityBadge(entity: WorldEntityUI, brokenRefIds: Set<string>): string | null {
  if (brokenRefIds.has(entity.worldId)) return '⚠'
  if (entity.entityType === WorldEntityType.Npc) {
    return npcPinBadge(readNpcConfig(entity.properties))
  }
  return null
}

/**
 * Corrige el bug clásico de Leaflet dentro de paneles acoplables (dockview): el
 * mapa se monta antes de conocer su tamaño real y solo pinta un trozo de las
 * teselas (el resto queda gris) hasta que el usuario interactúa. Forzamos
 * `invalidateSize()` tras el montaje y en cada redimensionado del contenedor.
 */
function MapAutoResize(): null {
  const map = useMap()
  useEffect(() => {
    const invalidate = (): void => {
      map.invalidateSize()
    }
    const timers = [setTimeout(invalidate, 0), setTimeout(invalidate, 200), setTimeout(invalidate, 600)]
    const container = map.getContainer()
    const observer = new ResizeObserver(invalidate)
    observer.observe(container)
    window.addEventListener('resize', invalidate)
    return () => {
      timers.forEach(clearTimeout)
      observer.disconnect()
      window.removeEventListener('resize', invalidate)
    }
  }, [map])
  return null
}

/** Guarda una referencia al objeto Leaflet Map para usarlo fuera del árbol de react-leaflet. */
function MapRefSetter({ mapRef }: { mapRef: React.MutableRefObject<LeafletMap | null> }): null {
  const map = useMap()
  useEffect(() => {
    mapRef.current = map
    return () => {
      mapRef.current = null
    }
  }, [map, mapRef])
  return null
}

/** Notifica el centro/zoom actuales cada vez que el usuario mueve o hace zoom, para recordarlos. */
function MapViewTracker({ onChange }: { onChange(center: [number, number], zoom: number): void }): null {
  const map = useMapEvents({
    moveend() {
      const c = map.getCenter()
      onChange([c.lat, c.lng], map.getZoom())
    },
    zoomend() {
      const c = map.getCenter()
      onChange([c.lat, c.lng], map.getZoom())
    }
  })
  return null
}

/** Captura clic izquierdo y clic derecho del mapa y los reenvía al panel. */
function MapInteractions({
  onLeftClick,
  onRightClick,
  onDoubleClick
}: {
  onLeftClick(position: Position): void
  onRightClick(position: Position, screen: { x: number; y: number }): void
  onDoubleClick(): void
}): null {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onLeftClick({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
    dblclick() {
      onDoubleClick()
    },
    contextmenu(event: LeafletMouseEvent) {
      event.originalEvent.preventDefault()
      onRightClick(
        { lat: event.latlng.lat, lng: event.latlng.lng },
        { x: event.containerPoint.x, y: event.containerPoint.y }
      )
    }
  })
  return null
}

export function WorldMapPanel(): JSX.Element {
  const entities = useVisibleEntities()
  const selectedEntityId = useWorldEditorStore((s) => s.selectedEntityId)
  const selectEntity = useWorldEditorStore((s) => s.selectEntity)
  const loadEntities = useWorldEditorStore((s) => s.loadEntities)
  const addEntity = useWorldEditorStore((s) => s.addEntity)
  const updateEntity = useWorldEditorStore((s) => s.updateEntity)
  const removeEntity = useWorldEditorStore((s) => s.removeEntity)
  const setLoading = useWorldEditorStore((s) => s.setLoading)
  const clipboard = useWorldEditorStore((s) => s.clipboard)
  const setClipboard = useWorldEditorStore((s) => s.setClipboard)
  const layerLocked = useWorldEditorStore((s) => s.layerLocked)
  const allEntities = useWorldEditorStore((s) => s.entities)
  // Pines con alguna referencia saliente rota (doc 19): se marcan con ⚠ en el mapa.
  const brokenRefIds = useMemo(() => worldIdsWithBrokenRefs(allEntities), [allEntities])

  const [placing, setPlacing] = useState<WorldEntityType | ''>('')
  const [layersOpen, setLayersOpen] = useState(false)
  const [zonesPanelOpen, setZonesPanelOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Vista del mapa recordada entre sesiones (estilo + centro + zoom).
  const [savedView] = useState<MapViewPrefs>(loadView)
  const [styleId, setStyleId] = useState<string>(savedView.styleId)
  const mapStyle = MAP_STYLES.find((style) => style.id === styleId) ?? MAP_STYLES[0]
  const styleRef = useRef(styleId)
  const viewRef = useRef<{ center: [number, number]; zoom: number }>({
    center: savedView.center,
    zoom: savedView.zoom
  })
  const persistView = (): void => {
    saveView({ styleId: styleRef.current, center: viewRef.current.center, zoom: viewRef.current.zoom })
  }
  const handleStyleChange = (id: string): void => {
    setStyleId(id)
    styleRef.current = id
    persistView()
  }

  // Zonas y dibujo de polígonos
  const [zones, setZones] = useState<WorldZone[]>([])
  const [drawingPoints, setDrawingPoints] = useState<Position[] | null>(null)

  // Rutas de enemigos (polilíneas rojas) y su dibujo
  const [routes, setRoutes] = useState<EnemyRoute[]>([])
  const [drawingRoute, setDrawingRoute] = useState<Position[] | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<EnemyRoute | null>(null)
  const drawingRouteRef = useRef(false)

  // Validador del mundo (doc 24)
  const [validation, setValidation] = useState<WorldValidationSummary | null>(null)

  // Refs espejo para que los handlers del mapa (registrados en Leaflet) siempre
  // lean el estado actual y no una copia congelada (evita clics que "no hacen nada").
  const drawingRef = useRef(false)
  const placingRef = useRef<WorldEntityType | ''>('')
  useEffect(() => {
    drawingRef.current = drawingPoints !== null
  }, [drawingPoints])
  useEffect(() => {
    drawingRouteRef.current = drawingRoute !== null
  }, [drawingRoute])
  useEffect(() => {
    placingRef.current = placing
  }, [placing])

  // Menú contextual y modal OSM
  const [contextMenu, setContextMenu] = useState<MapMenuContext | null>(null)
  // Menú de estado de sincronización (al hacer clic en la bolita del pin).
  const [statusMenu, setStatusMenu] = useState<{
    entity: WorldEntityUI
    screen: { x: number; y: number }
  } | null>(null)
  const [osmZone, setOsmZone] = useState<WorldZone | null>(null)
  // Entidad cuya interacción (tienda/NPC) está abierta en modal.
  const [shopEntity, setShopEntity] = useState<WorldEntityUI | null>(null)
  const [npcEntity, setNpcEntity] = useState<WorldEntityUI | null>(null)
  const [enemyEntity, setEnemyEntity] = useState<WorldEntityUI | null>(null)
  const [chestEntity, setChestEntity] = useState<WorldEntityUI | null>(null)
  const [resourceEntity, setResourceEntity] = useState<WorldEntityUI | null>(null)
  // Aviso efímero (p. ej. "1 elemento copiado / pegado").
  const [notice, setNotice] = useState<string | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  // Cerrar el menú contextual con Escape (comportamiento de editor de escritorio).
  useEffect(() => {
    if (!contextMenu) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setContextMenu(null)
        setStatusMenu(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [contextMenu])

  // Escape cancela el dibujo de una ruta de enemigos en curso (doc 14).
  useEffect(() => {
    if (drawingRoute === null) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') cancelRoute()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingRoute])

  const reloadEntities = (): Promise<void> =>
    WorldEditorService.queryEntities({ limit: 2000 }).then((result) => loadEntities(result.items))

  useEffect(() => {
    setLoading(true)
    Promise.all([
      WorldEditorService.queryEntities({ limit: 2000 }).then((result) => loadEntities(result.items)),
      ZoneService.list().then((list) => setZones(list)),
      EnemyRouteService.list().then((list) => setRoutes(list))
    ]).finally(() => setLoading(false))
  }, [loadEntities, setLoading])

  const createEntityAt = async (type: WorldEntityType, position: Position): Promise<void> => {
    const entity = await WorldEditorService.createEntity({
      entityType: type,
      entityId: null,
      name: `${TYPE_NAME[type] ?? type} nuevo`,
      position,
      properties: {}
    })
    addEntity({ ...entity, isSelected: false, isEditing: false })
    selectEntity(entity.worldId)
  }

  const handleLeftClick = (position: Position): void => {
    if (drawingRouteRef.current) {
      setDrawingRoute((prev) => (prev ? [...prev, position] : [position]))
      return
    }
    if (drawingRef.current) {
      setDrawingPoints((prev) => (prev ? [...prev, position] : [position]))
      return
    }
    if (placingRef.current) {
      void createEntityAt(placingRef.current, position)
      setPlacing('')
    }
  }

  const handleRightClick = (position: Position, screen: { x: number; y: number }): void => {
    const zone = zones.find((z) => isPointInPolygon(position, z.points)) ?? null
    setContextMenu({ kind: 'map', position, screen, zone })
  }

  // Con el menú abierto, un overlay cubre el mapa: clic izquierdo cierra, clic
  // derecho reposiciona el menú en el nuevo punto (como en editores de PC).
  const handleOverlayContextMenu = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const map = mapRef.current
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    if (!map) {
      setContextMenu(null)
      return
    }
    const latlng = map.containerPointToLatLng(L.point(x, y))
    handleRightClick({ lat: latlng.lat, lng: latlng.lng }, { x, y })
  }

  const handleDragEnd = async (worldId: string, position: Position): Promise<void> => {
    const updated = await WorldEditorService.moveEntity({ worldId, position })
    updateEntity(worldId, updated)
  }

  const handleDelete = async (worldId: string): Promise<void> => {
    // Borrado seguro (doc 19): si otros pines lo referencian, avisar y ofrecer
    // desvincular esas referencias antes de eliminar; nunca dejarlas rotas.
    const all = useWorldEditorStore.getState().entities
    const usedBy = getReferencesTo(worldId, all)
    if (usedBy.length > 0) {
      const list = usedBy.map((r) => `• ${r.fromName}: ${r.label}`).join('\n')
      const ok = window.confirm(
        `Este elemento lo usan ${usedBy.length} referencia(s):\n\n${list}\n\n` +
          'Se desvincularán esas referencias (quedarán sin objetivo) y luego se eliminará. ¿Continuar?'
      )
      if (!ok) return
      // Desvincular en cada entidad que lo referencia y persistir.
      for (const ref of usedBy) {
        const from = all.find((e) => e.worldId === ref.fromWorldId)
        if (!from) continue
        const properties = unlinkReference(from, worldId, ref.relation)
        const updated = await WorldEditorService.updateEntity({ worldId: from.worldId, patch: { properties } })
        updateEntity(from.worldId, updated)
      }
    }
    await WorldEditorService.deleteEntity({ worldId })
    removeEntity(worldId)
  }

  const handleDuplicate = async (worldId: string): Promise<void> => {
    const copy = await WorldEditorService.duplicateEntity(worldId)
    addEntity({ ...copy, isSelected: false, isEditing: false })
    selectEntity(copy.worldId)
  }

  const handleToggle = async (worldId: string): Promise<void> => {
    const updated = await WorldEditorService.toggleEntity(worldId)
    updateEntity(worldId, updated)
  }

  // Subir un pin al mundo/servidor. El punto del marcador se pone verde si entra,
  // rojo si el servidor lo rechaza (p. ej. token inválido) o gris si es local.
  const handlePublishEntity = async (worldId: string): Promise<void> => {
    flash('Subiendo al mundo…')
    try {
      const result = await window.api.worldEditor.publishEntity(worldId)
      updateEntity(worldId, { syncStatus: result.syncStatus as WorldEntityUI['syncStatus'] })
      flash(result.message ?? (result.ok ? 'Subido al mundo' : 'No se pudo subir'))
    } catch (error) {
      flash(`Error al subir: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Cola de sincronización: pines que aún no están en el juego (local/pendiente/
  // fallido). Reintentar los fallidos entra aquí también, así no se pierde nada.
  const PENDING_STATES = new Set(['local', 'pending', 'failed'])
  const pendingEntities = entities.filter((e) => PENDING_STATES.has(e.syncStatus))
  const [syncing, setSyncing] = useState(false)

  const handleSyncPending = async (): Promise<void> => {
    if (syncing) return
    const queue = entities.filter((e) => PENDING_STATES.has(e.syncStatus))
    if (queue.length === 0) {
      flash('No hay pines pendientes de subir.')
      return
    }
    setSyncing(true)
    let ok = 0
    let failed = 0
    for (let i = 0; i < queue.length; i++) {
      const e = queue[i]
      flash(`Subiendo ${i + 1}/${queue.length}: ${e.name}…`)
      try {
        const result = await window.api.worldEditor.publishEntity(e.worldId)
        updateEntity(e.worldId, { syncStatus: result.syncStatus as WorldEntityUI['syncStatus'] })
        if (result.ok) ok++
        else failed++
      } catch {
        updateEntity(e.worldId, { syncStatus: 'failed' as WorldEntityUI['syncStatus'] })
        failed++
      }
    }
    setSyncing(false)
    flash(failed === 0 ? `Subidos ${ok} pines al mundo.` : `Subidos ${ok}, fallaron ${failed}. Reintenta los rojos.`)
  }

  // ===== Portapapeles interno: copiar / cortar / pegar (doc 28) =====

  const flash = (message: string): void => {
    setNotice(message)
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 1600)
  }

  const handleCopy = (worldId: string): void => {
    const entity = useWorldEditorStore.getState().entities.find((e) => e.worldId === worldId)
    if (!entity) return
    setClipboard(makeClipboardEntry(entity, 'copy'))
    flash('1 elemento copiado')
  }

  const handleCut = (worldId: string): void => {
    const entity = useWorldEditorStore.getState().entities.find((e) => e.worldId === worldId)
    if (!entity) return
    setClipboard(makeClipboardEntry(entity, 'cut'))
    flash('1 elemento cortado')
  }

  const handlePasteAt = async (position: Position): Promise<void> => {
    const entry = useWorldEditorStore.getState().clipboard
    if (!entry) return
    // Cortar: si el original sigue existiendo, se mueve (mismo ID) y se limpia el
    // portapapeles. Si ya no existe, se degrada a pegar como copia nueva.
    if (entry.mode === 'cut') {
      const stillExists = useWorldEditorStore.getState().entities.some((e) => e.worldId === entry.sourceWorldId)
      if (stillExists) {
        const moved = await WorldEditorService.moveEntity({ worldId: entry.sourceWorldId, position })
        updateEntity(entry.sourceWorldId, moved)
        selectEntity(entry.sourceWorldId)
        setClipboard(null)
        flash('1 elemento pegado')
        return
      }
    }
    const created = await WorldEditorService.createEntity(buildPasteRequest(entry, position))
    addEntity({ ...created, isSelected: false, isEditing: false })
    selectEntity(created.worldId)
    flash('1 elemento pegado')
  }

  const handleOpenProperties = (worldId: string): void => {
    selectEntity(worldId)
    const entity = useWorldEditorStore.getState().entities.find((e) => e.worldId === worldId)
    if (entity) mapRef.current?.panTo([entity.position.lat, entity.position.lng])
  }

  // Abre la interacción real del pin según su tipo (tienda, NPC, …).
  const handleOpenInteraction = (entity: WorldEntityUI): void => {
    selectEntity(entity.worldId)
    if (entity.entityType === WorldEntityType.Shop) {
      setShopEntity(entity)
    } else if (entity.entityType === WorldEntityType.Npc) {
      setNpcEntity(entity)
    } else if (entity.entityType === WorldEntityType.Enemy) {
      setEnemyEntity(entity)
    } else if (entity.entityType === WorldEntityType.Chest) {
      setChestEntity(entity)
    } else if (entity.entityType === WorldEntityType.Resource) {
      setResourceEntity(entity)
    }
  }

  const startZone = (firstPoint?: Position): void => {
    setPlacing('')
    setDrawingPoints(firstPoint ? [firstPoint] : [])
  }

  const finishZone = async (): Promise<void> => {
    if (!drawingPoints || drawingPoints.length < 3) return
    try {
      const zone = await ZoneService.create({
        name: `Zona ${zones.length + 1}`,
        color: ZONE_COLORS[zones.length % ZONE_COLORS.length],
        points: drawingPoints
      })
      setZones((prev) => [...prev, zone])
      setDrawingPoints(null)
    } catch (error) {
      // No fallar en silencio: si la creación en SQLite falla, avisar.
      window.alert(`No se pudo crear la zona: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const deleteZone = async (zone: WorldZone): Promise<void> => {
    await ZoneService.delete(zone.zoneId)
    setZones((prev) => prev.filter((z) => z.zoneId !== zone.zoneId))
  }

  const updateZone = async (zoneId: string, patch: Partial<Pick<WorldZone, 'name' | 'color'>>): Promise<void> => {
    const updated = await ZoneService.update({ zoneId, patch })
    setZones((prev) => prev.map((z) => (z.zoneId === zoneId ? updated : z)))
  }

  // ===== Rutas de enemigos (polilíneas rojas, doc 14) =====

  const startRoute = (firstPoint?: Position): void => {
    setPlacing('')
    setDrawingPoints(null)
    setDrawingRoute(firstPoint ? [firstPoint] : [])
    // Evita que el doble clic para finalizar haga zoom.
    mapRef.current?.doubleClickZoom.disable()
  }

  const cancelRoute = (): void => {
    setDrawingRoute(null)
    mapRef.current?.doubleClickZoom.enable()
  }

  const finishRoute = async (): Promise<void> => {
    const points = drawingRoute
    setDrawingRoute(null)
    mapRef.current?.doubleClickZoom.enable()
    if (!points || points.length < 2) return
    try {
      const route = await EnemyRouteService.create({
        name: `Ruta ${routes.length + 1}`,
        color: '#ef4444',
        points
      })
      setRoutes((prev) => [...prev, route])
      setSelectedRoute(route)
    } catch (error) {
      window.alert(`No se pudo crear la ruta: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleRouteSaved = (updated: EnemyRoute): void => {
    setRoutes((prev) => prev.map((r) => (r.routeId === updated.routeId ? updated : r)))
    setSelectedRoute(updated)
  }

  const handleRouteDeleted = (routeId: string): void => {
    setRoutes((prev) => prev.filter((r) => r.routeId !== routeId))
    setSelectedRoute(null)
  }

  // ===== Validador del mundo (doc 24) =====

  const runValidation = (): WorldValidationSummary => {
    const entitiesNow = useWorldEditorStore.getState().entities
    const summary = validateWorld({ entities: entitiesNow, zones, routes })
    setValidation(summary)
    return summary
  }

  // Desde un aviso: centrar el mapa en el elemento y abrir su ficha/inspector.
  const goToIssue = (issue: ValidationIssue): void => {
    if (issue.position) mapRef.current?.panTo([issue.position.lat, issue.position.lng])
    if (issue.targetKind === 'entity') {
      const entity = useWorldEditorStore.getState().entities.find((e) => e.worldId === issue.targetId)
      if (entity) {
        selectEntity(entity.worldId)
        handleOpenInteraction(entity)
      }
    } else if (issue.targetKind === 'route') {
      const route = routes.find((r) => r.routeId === issue.targetId)
      if (route) setSelectedRoute(route)
    }
    setValidation(null)
  }

  // Desde un resultado de búsqueda (doc 26): centrar el mapa y abrir su ficha.
  const goToSearchResult = (result: SearchResult): void => {
    if (result.position) mapRef.current?.panTo([result.position.lat, result.position.lng])
    if (result.kind === 'entity') {
      const entity = useWorldEditorStore.getState().entities.find((e) => e.worldId === result.id)
      if (entity) {
        selectEntity(entity.worldId)
        handleOpenInteraction(entity)
      }
    } else if (result.kind === 'route') {
      const route = routes.find((r) => r.routeId === result.id)
      if (route) setSelectedRoute(route)
    }
  }

  const handleExport = async (): Promise<void> => {
    // Validar antes de exportar (doc 24): los errores críticos bloquean la publicación.
    const summary = runValidation()
    if (summary.errors > 0) {
      window.alert(
        `No se puede exportar: hay ${summary.errors} error(es) crítico(s).\n` +
          'Revisa el panel de validación y corrígelos antes de publicar.'
      )
      return
    }
    if (summary.warnings > 0 && !window.confirm(`Hay ${summary.warnings} advertencia(s). ¿Exportar de todos modos?`)) {
      return
    }
    setValidation(null)
    setExporting(true)
    try {
      const result = await window.api.export.world()
      window.alert(
        `Mundo exportado a:\n${result.outputPath}\n\n${result.recordCount} elementos (entidades + zonas).`
      )
    } catch (error) {
      window.alert(`No se pudo exportar el mundo: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setExporting(false)
    }
  }

  // Atajos de teclado estilo escritorio (doc 28). Operan sobre la entidad
  // seleccionada; pegar coloca en el centro visible del mapa. Se ignoran si el
  // foco está en un campo de texto para no pisar la escritura.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return

      const selectedId = useWorldEditorStore.getState().selectedEntityId
      const mod = event.ctrlKey || event.metaKey

      if (mod && event.key.toLowerCase() === 'c' && selectedId) {
        event.preventDefault()
        handleCopy(selectedId)
      } else if (mod && event.key.toLowerCase() === 'x' && selectedId) {
        event.preventDefault()
        handleCut(selectedId)
      } else if (mod && event.key.toLowerCase() === 'v') {
        event.preventDefault()
        const center = mapRef.current?.getCenter()
        if (center) void handlePasteAt({ lat: center.lat, lng: center.lng })
      } else if (mod && event.key.toLowerCase() === 'd' && selectedId) {
        event.preventDefault()
        void handleDuplicate(selectedId)
      } else if (event.key === 'Delete' && selectedId) {
        event.preventDefault()
        void handleDelete(selectedId)
      } else if (event.altKey && event.key === 'Enter' && selectedId) {
        event.preventDefault()
        handleOpenProperties(selectedId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // Los handlers leen estado fresco vía getState, así que no dependen de closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-surface-border bg-surface-1 px-3 py-2">
          <span className="text-xs text-slate-500">
            {entities.length} entidades · {zones.length} zonas · {routes.length} rutas
          </span>
          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
            <MapSearchBar zones={zones} routes={routes} onSelect={goToSearchResult} />
            <div className="flex items-center gap-1" title="Estilo del mapa">
              <MapIcon size={12} className="text-slate-500" />
              <select
                value={styleId}
                onChange={(event) => handleStyleChange(event.target.value)}
                className="rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-accent"
              >
                {MAP_STYLES.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => (drawingPoints !== null ? setDrawingPoints(null) : startZone())}
              className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${
                drawingPoints !== null
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-surface-border text-slate-300 hover:bg-surface-2'
              }`}
            >
              <Hexagon size={12} /> Zona
            </button>
            <select
              value={placing}
              onChange={(event) => setPlacing(event.target.value as WorldEntityType | '')}
              className="rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-accent"
            >
              <option value="">Colocar entidad...</option>
              {Object.values(WorldEntityType).map((type) => (
                <option key={type} value={type}>
                  {getEntityIcon(type)} {type}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setZonesPanelOpen((open) => !open)}
              className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${
                zonesPanelOpen
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-surface-border text-slate-300 hover:bg-surface-2'
              }`}
            >
              <List size={12} /> Zonas
            </button>
            <button
              type="button"
              onClick={() => setLayersOpen((open) => !open)}
              className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${
                layersOpen ? 'border-accent bg-accent-muted text-accent' : 'border-surface-border text-slate-300 hover:bg-surface-2'
              }`}
            >
              <Layers size={12} /> Capas
            </button>
            <button
              type="button"
              onClick={() => runValidation()}
              title="Validar el mundo (pines, zonas y rutas) antes de publicar"
              className="flex items-center gap-1 rounded-md border border-surface-border px-2 py-1.5 text-xs text-slate-300 hover:bg-surface-2"
            >
              <ShieldCheck size={12} /> Validar
            </button>
            <button
              type="button"
              onClick={() => void handleSyncPending()}
              disabled={syncing || pendingEntities.length === 0}
              title="Subir al mundo todos los pines pendientes (locales, con cambios o fallidos)"
              className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs disabled:opacity-40 ${
                pendingEntities.length > 0
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-surface-border text-slate-300 hover:bg-surface-2'
              }`}
            >
              <UploadCloud size={12} className={syncing ? 'animate-pulse' : ''} />
              {syncing ? 'Subiendo…' : `Subir pendientes${pendingEntities.length > 0 ? ` (${pendingEntities.length})` : ''}`}
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
              title="Validar y exportar el mundo (entidades + zonas) a export/world.json"
              className="flex items-center gap-1 rounded-md border border-surface-border px-2 py-1.5 text-xs text-slate-300 hover:bg-surface-2 disabled:opacity-40"
            >
              <Download size={12} /> {exporting ? 'Exportando…' : 'Exportar'}
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <MapContainer
            center={savedView.center}
            zoom={savedView.zoom}
            maxZoom={MAP_MAX_ZOOM}
            className="h-full w-full"
            style={{ background: '#1e1f22' }}
          >
            <TileLayer
              key={mapStyle.id}
              url={mapStyle.url}
              attribution={mapStyle.attribution}
              subdomains={mapStyle.subdomains ?? 'abc'}
              maxZoom={MAP_MAX_ZOOM}
              maxNativeZoom={mapStyle.maxNativeZoom}
            />
            <MapRefSetter mapRef={mapRef} />
            <MapAutoResize />
            <MapViewTracker
              onChange={(center, zoom) => {
                viewRef.current = { center, zoom }
                persistView()
              }}
            />
            <MapInteractions
              onLeftClick={handleLeftClick}
              onRightClick={handleRightClick}
              onDoubleClick={() => {
                if (drawingRouteRef.current) void finishRoute()
              }}
            />

            {/* Zonas guardadas */}
            {zones.map((zone) => (
              <Polygon
                key={zone.zoneId}
                positions={zone.points.map((p) => [p.lat, p.lng])}
                pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.12, weight: 2 }}
                eventHandlers={{
                  contextmenu: (event: LeafletMouseEvent) => {
                    event.originalEvent.preventDefault()
                    L.DomEvent.stopPropagation(event)
                    handleRightClick(
                      { lat: event.latlng.lat, lng: event.latlng.lng },
                      { x: event.containerPoint.x, y: event.containerPoint.y }
                    )
                  }
                }}
              >
                <Popup>{zone.name}</Popup>
              </Polygon>
            ))}

            {/* Rutas de enemigos guardadas (polilíneas rojas) */}
            {routes.map((route) => (
              <Polyline
                key={route.routeId}
                positions={route.points.map((p) => [p.lat, p.lng])}
                pathOptions={{ color: route.color, weight: 4, opacity: 0.9 }}
                eventHandlers={{
                  click: (event: LeafletMouseEvent) => {
                    L.DomEvent.stopPropagation(event)
                    setSelectedRoute(route)
                  },
                  contextmenu: (event: LeafletMouseEvent) => {
                    event.originalEvent.preventDefault()
                    L.DomEvent.stopPropagation(event)
                    setSelectedRoute(route)
                  }
                }}
              />
            ))}

            {/* Ruta de enemigos en construcción */}
            {drawingRoute && drawingRoute.length > 0 && (
              <>
                <Polyline
                  positions={drawingRoute.map((p) => [p.lat, p.lng])}
                  pathOptions={{ color: '#ef4444', weight: 3, dashArray: '5' }}
                />
                {drawingRoute.map((p, index) => (
                  <CircleMarker
                    key={index}
                    center={[p.lat, p.lng]}
                    radius={index === 0 ? 6 : 4}
                    pathOptions={{ color: '#ef4444', fillColor: index === 0 ? '#ef4444' : '#fca5a5', fillOpacity: 1, weight: 1 }}
                  />
                ))}
              </>
            )}

            {/* Zona en construcción */}
            {drawingPoints && drawingPoints.length > 0 && (
              <>
                {drawingPoints.length >= 3 && (
                  <Polygon
                    positions={drawingPoints.map((p) => [p.lat, p.lng])}
                    pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.1, weight: 1, dashArray: '4' }}
                  />
                )}
                <Polyline
                  positions={drawingPoints.map((p) => [p.lat, p.lng])}
                  pathOptions={{ color: '#38bdf8', dashArray: '4' }}
                />
                {drawingPoints.map((p, index) => {
                  const isFirst = index === 0
                  const canClose = isFirst && drawingPoints.length >= 3
                  return (
                    <CircleMarker
                      key={index}
                      center={[p.lat, p.lng]}
                      radius={canClose ? 8 : isFirst ? 6 : 4}
                      pathOptions={{
                        color: canClose ? '#22c55e' : '#38bdf8',
                        fillColor: canClose ? '#22c55e' : isFirst ? '#38bdf8' : '#0ea5e9',
                        fillOpacity: 1,
                        weight: canClose ? 3 : 1
                      }}
                      eventHandlers={
                        canClose
                          ? {
                              click: (event: LeafletMouseEvent) => {
                                L.DomEvent.stop(event.originalEvent)
                                void finishZone()
                              }
                            }
                          : undefined
                      }
                    />
                  )
                })}
              </>
            )}

            {/* Entidades */}
            {entities.map((entity) => (
              <Marker
                key={entity.worldId}
                position={[entity.position.lat, entity.position.lng]}
                draggable={!layerLocked[entity.entityType]}
                icon={makeDivIcon(
                  entity.entityType,
                  entity.worldId === selectedEntityId,
                  entity.syncStatus,
                  entityBadge(entity, brokenRefIds)
                )}
                eventHandlers={{
                  click: (event: LeafletMouseEvent) => {
                    const target = event.originalEvent?.target as HTMLElement | null
                    if (target?.closest?.('.sync-dot')) {
                      L.DomEvent.stopPropagation(event)
                      selectEntity(entity.worldId)
                      setContextMenu(null)
                      setStatusMenu({
                        entity,
                        screen: { x: event.containerPoint.x, y: event.containerPoint.y }
                      })
                      return
                    }
                    selectEntity(entity.worldId)
                  },
                  dblclick: () => handleOpenInteraction(entity),
                  contextmenu: (event: LeafletMouseEvent) => {
                    event.originalEvent.preventDefault()
                    L.DomEvent.stopPropagation(event)
                    setContextMenu({
                      kind: 'entity',
                      position: { lat: entity.position.lat, lng: entity.position.lng },
                      screen: { x: event.containerPoint.x, y: event.containerPoint.y },
                      entity
                    })
                  },
                  dragend: (event: DragEndEvent) => {
                    const marker = event.target as LeafletMarker
                    const position = marker.getLatLng()
                    handleDragEnd(entity.worldId, { lat: position.lat, lng: position.lng })
                  }
                }}
              >
                <Popup>{entity.name}</Popup>
              </Marker>
            ))}
          </MapContainer>

          {layersOpen && (
            <div className="absolute right-3 top-3 z-[1000]">
              <LayersPanel />
            </div>
          )}

          {zonesPanelOpen && (
            <div className="absolute left-3 top-3 z-[1000]">
              <ZonesPanel
                zones={zones}
                onRename={(zoneId, name) => void updateZone(zoneId, { name })}
                onRecolor={(zoneId, color) => void updateZone(zoneId, { color })}
                onDelete={(zone) => void deleteZone(zone)}
              />
            </div>
          )}

          {placing && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white shadow-lg">
              Haz click en el mapa para colocar: {placing}
            </div>
          )}

          {drawingPoints !== null && (
            <div className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-md border border-surface-border bg-surface-1 px-3 py-1.5 text-xs shadow-lg">
              <Hexagon size={12} className="text-accent" />
              <span className="text-slate-300">
                Zona: {drawingPoints.length} punto(s) ·{' '}
                {drawingPoints.length < 3
                  ? 'clic izquierdo en el mapa para añadir (mín. 3)'
                  : 'clic izquierdo para añadir · toca el punto verde o Finalizar para cerrar'}
              </span>
              <button
                type="button"
                disabled={drawingPoints.length < 1}
                onClick={() => setDrawingPoints(drawingPoints.slice(0, -1))}
                className="rounded border border-surface-border px-1.5 py-0.5 text-slate-300 hover:bg-surface-2 disabled:opacity-40"
              >
                Deshacer punto
              </button>
              <button
                type="button"
                disabled={drawingPoints.length < 3}
                onClick={() => void finishZone()}
                className="rounded bg-accent px-1.5 py-0.5 font-medium text-white disabled:opacity-40"
              >
                Finalizar
              </button>
              <button
                type="button"
                onClick={() => setDrawingPoints(null)}
                className="rounded border border-surface-border px-1.5 py-0.5 text-slate-300 hover:bg-surface-2"
              >
                Cancelar
              </button>
            </div>
          )}

          {drawingRoute !== null && (
            <div className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-md border border-red-500/50 bg-surface-1 px-3 py-1.5 text-xs shadow-lg">
              <Swords size={12} className="text-red-400" />
              <span className="text-slate-300">
                Ruta de enemigos: {drawingRoute.length} punto(s) ·{' '}
                {drawingRoute.length < 2
                  ? 'clic izquierdo para añadir (mín. 2)'
                  : `${Math.round(routeLengthMeters(drawingRoute))} m · doble clic o Finalizar para cerrar`}
              </span>
              <button
                type="button"
                disabled={drawingRoute.length < 1}
                onClick={() => setDrawingRoute(drawingRoute.slice(0, -1))}
                className="rounded border border-surface-border px-1.5 py-0.5 text-slate-300 hover:bg-surface-2 disabled:opacity-40"
              >
                Deshacer punto
              </button>
              <button
                type="button"
                disabled={drawingRoute.length < 2}
                onClick={() => void finishRoute()}
                className="rounded bg-red-500 px-1.5 py-0.5 font-medium text-white disabled:opacity-40"
              >
                Finalizar ruta
              </button>
              <button
                type="button"
                onClick={cancelRoute}
                className="rounded border border-surface-border px-1.5 py-0.5 text-slate-300 hover:bg-surface-2"
              >
                Cancelar
              </button>
            </div>
          )}

          {contextMenu && (
            <div
              className="absolute inset-0 z-[1150]"
              onClick={() => setContextMenu(null)}
              onContextMenu={handleOverlayContextMenu}
            />
          )}

          {contextMenu && (
            <MapContextMenu
              context={contextMenu}
              clipboard={clipboard}
              onClose={() => setContextMenu(null)}
              onCreatePin={(position) => void createEntityAt(WorldEntityType.Marker, position)}
              onCreateEntity={(type, position) => void createEntityAt(type, position)}
              onStartZone={(position) => startZone(position)}
              onStartRoute={(position) => startRoute(position)}
              onImportOsm={(zone) => setOsmZone(zone)}
              onDeleteZone={(zone) => void deleteZone(zone)}
              onSelectEntity={(worldId) => selectEntity(worldId)}
              onOpenProperties={(worldId) => handleOpenProperties(worldId)}
              onOpenInteraction={(entity) => handleOpenInteraction(entity)}
              onPublishEntity={(worldId) => void handlePublishEntity(worldId)}
              onCopyEntity={(worldId) => handleCopy(worldId)}
              onCutEntity={(worldId) => handleCut(worldId)}
              onPasteAt={(position) => void handlePasteAt(position)}
              onDuplicateEntity={(worldId) => void handleDuplicate(worldId)}
              onToggleEntity={(worldId) => void handleToggle(worldId)}
              onDeleteEntity={(worldId) => void handleDelete(worldId)}
            />
          )}

          {statusMenu && (
            <div className="absolute inset-0 z-[1200]" onClick={() => setStatusMenu(null)} />
          )}
          {statusMenu && (
            <SyncStatusMenu
              entity={statusMenu.entity}
              screen={statusMenu.screen}
              onClose={() => setStatusMenu(null)}
              onPublish={(worldId) => void handlePublishEntity(worldId)}
              onShowMessage={(message) => flash(message)}
            />
          )}

          {notice && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-[1300] -translate-x-1/2 rounded-md bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-lg ring-1 ring-surface-border">
              {notice}
            </div>
          )}

          {shopEntity && <ShopModal entity={shopEntity} onClose={() => setShopEntity(null)} />}

          {npcEntity && <NpcModal entity={npcEntity} onClose={() => setNpcEntity(null)} />}

          {enemyEntity && <EnemyModal entity={enemyEntity} onClose={() => setEnemyEntity(null)} />}

          {chestEntity && <ChestModal entity={chestEntity} onClose={() => setChestEntity(null)} />}

          {resourceEntity && <ResourceModal entity={resourceEntity} onClose={() => setResourceEntity(null)} />}

          {selectedRoute && (
            <RouteModal
              route={selectedRoute}
              onSaved={handleRouteSaved}
              onDeleted={handleRouteDeleted}
              onClose={() => setSelectedRoute(null)}
            />
          )}

          {validation && (
            <WorldValidatorPanel
              summary={validation}
              onGoTo={goToIssue}
              onRevalidate={runValidation}
              onClose={() => setValidation(null)}
            />
          )}

          {osmZone && (
            <OsmImportModal
              zone={osmZone}
              onClose={() => setOsmZone(null)}
              onImported={() => void reloadEntities()}
            />
          )}
        </div>
      </div>

      <div className="w-72 shrink-0 border-l border-surface-border">
        <EntityInspector onDelete={handleDelete} onOpenInteraction={handleOpenInteraction} />
      </div>
    </div>
  )
}
