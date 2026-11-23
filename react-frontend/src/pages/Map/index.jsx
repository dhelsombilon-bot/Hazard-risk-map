import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { X, Layers, ChevronDown, MapPin, Building2, RotateCcw, ArrowRight, Crosshair, Info } from 'lucide-react'
import { MapContainer, TileLayer, ZoomControl, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge, RiskBadge } from '../../components/ui/Badge'
import BuildingMarker from '../../components/map/BuildingMarker'
import HazardLayer from '../../components/map/HazardLayer'
import BarangayLayer from '../../components/map/BarangayLayer'
import RiskLegend from '../../components/map/RiskLegend'
import { buildingService } from '../../services/buildings'
import { hazardService } from '../../services/hazards'
import { lookupService } from '../../services/lookups'
import { BOUNDARY_BOUNDS, RESTRICT_PROPS, isInsideBongabong } from '../../components/map/BongabongBoundary'
import { RISK_COLORS, riskHex } from '../../utils/riskColors'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'

const RISK_LEVELS = ['High', 'Moderate-to-High', 'Moderate', 'Low']

// Which hazard drives marker colors, the risk filter and the counts
const HAZARDS = [
  { key: 'overall', label: 'Overall', legend: 'Risk Classification' },
  { key: 'Flood', label: 'Flood', legend: 'Flood Risk' },
  { key: 'Landslide', label: 'Landslide', legend: 'Landslide Risk' },
]

/** Risk level of a building for the selected hazard ('overall' = highest of all hazards) */
const levelOf = (f, hazard) => hazard === 'overall' ? f.properties.risk_level : f.properties.hazard_levels?.[hazard]

/* Pans/zooms the map to the visible buildings whenever the barangay filter changes */
function FitToBarangay({ barangayId, features }) {
  const map = useMap()
  useEffect(() => {
    if (!barangayId) {
      map.flyToBounds(BOUNDARY_BOUNDS, { padding: [20, 20], duration: 0.6 })
      return
    }
    const pts = features.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]])
    if (pts.length === 1) map.flyTo(pts[0], 16, { duration: 0.6 })
    else if (pts.length > 1) map.flyToBounds(pts, { padding: [80, 80], maxZoom: 16, duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barangayId])
  return null
}

function SelectedPanel({ building, hazard, onClose }) {
  if (!building) return null
  const b = building.properties || building
  const current = levelOf(building, hazard)
  const color = riskHex(current)
  const [lng, lat] = building.geometry?.coordinates || []
  return (
    <div className="absolute bottom-4 left-4 z-[1000] w-[calc(100%-2rem)] max-w-xs bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: RISK_COLORS[current]?.bg || '#F1F5F9' }}>
              <Building2 size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-gray-400 tracking-wide">{b.building_code}</div>
              <div className="text-sm font-semibold text-text-dark leading-snug">{b.building_name}</div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin size={11} /> {b.barangay_name}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 -m-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 text-xs">
          <div>
            <dt className="text-gray-400 mb-0.5">Flood risk</dt>
            <dd><RiskBadge level={b.hazard_levels?.Flood} /></dd>
          </div>
          <div>
            <dt className="text-gray-400 mb-0.5">Landslide risk</dt>
            <dd><RiskBadge level={b.hazard_levels?.Landslide} /></dd>
          </div>
          <div>
            <dt className="text-gray-400 mb-0.5">Overall risk</dt>
            <dd><RiskBadge level={b.risk_level} /></dd>
          </div>
          <div>
            <dt className="text-gray-400 mb-0.5">Status</dt>
            <dd><StatusBadge status={b.building_status} /></dd>
          </div>
          {b.building_type && (
            <div>
              <dt className="text-gray-400 mb-0.5">Type</dt>
              <dd className="text-gray-700 font-medium">{b.building_type}</dd>
            </div>
          )}
          {lat != null && (
            <div>
              <dt className="text-gray-400 mb-0.5">Coordinates</dt>
              <dd className="text-gray-700 font-medium tabular-nums">{lat.toFixed(4)}, {lng.toFixed(4)}</dd>
            </div>
          )}
        </dl>

        <Link
          to={`/buildings/${b.building_id}`}
          className="mt-4 flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg py-2.5 transition-colors"
        >
          View building record <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

/* ---------- Future building location assessment ---------- */

// Diamond marker so a candidate site never looks like a registered building (circles)
const SITE_ICON = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;transform:rotate(45deg);background:#0F1E3D;border:3px solid #fff;box-shadow:0 0 0 2px #0F1E3D,0 2px 6px rgba(0,0,0,.35)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

/* Handles map clicks while assessment mode is on (only points inside Bongabong) */
function SitePicker({ active, onPick, onOutside, ignoreRef }) {
  const map = useMap()
  useEffect(() => {
    map.getContainer().style.cursor = active ? 'crosshair' : ''
    return () => { map.getContainer().style.cursor = '' }
  }, [active, map])
  useMapEvents({
    click: (e) => {
      // A building-marker click bubbles to the map too; that one selects the building instead
      if (ignoreRef.current) { ignoreRef.current = false; return }
      if (!active) return
      const { lat, lng } = e.latlng
      if (!isInsideBongabong(lat, lng)) { onOutside(); return }
      onPick({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) })
    },
  })
  return null
}

/** Ray-casting test against a GeoJSON Polygon / MultiPolygon (outer rings) */
function geometryContains(geometry, lat, lng) {
  const polys = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.type === 'MultiPolygon' ? geometry.coordinates : []
  return polys.some(([ring]) => {
    let inside = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j]
      if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
    }
    return inside
  })
}

/** Barangay name from loaded boundary polygons; null when boundaries aren't available */
function barangayAt(boundaries, lat, lng) {
  const f = boundaries?.features?.find(f => geometryContains(f.geometry, lat, lng))
  const p = f?.properties
  return p ? (p.barangay_name || p.name || p.NAME || p.ADM4_EN || null) : null
}

function ExposureBadge({ result }) {
  if (result?.status === 'exposed') return <RiskBadge level={result.level} />
  if (result?.status === 'no_identified_exposure') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border" style={{ borderColor: RISK_COLORS.Low.hex, color: RISK_COLORS.Low.text }}>No identified exposure</span>
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No Available Hazard Data</span>
}

function SitePanel({ site, boundaries, onClose }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['hazard-assess', site.lat, site.lng],
    queryFn: () => hazardService.assess(site.lat, site.lng),
  })
  const barangay = barangayAt(boundaries, site.lat, site.lng)
  const overall = data?.overall
  const color = overall?.status === 'exposed' ? riskHex(overall.level) : '#94A3B8'
  const datasets = data ? Object.entries(data.hazards).filter(([, h]) => h.dataset) : []
  const missing = data ? Object.entries(data.hazards).filter(([, h]) => h.status === 'no_data').map(([k]) => k) : []

  return (
    <div className="absolute bottom-4 left-4 z-[1000] w-[calc(100%-2rem)] max-w-xs bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100">
              <Crosshair size={18} className="text-[#0F1E3D]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-gray-400 tracking-wide">POTENTIAL SITE · NO BUILDING RECORD</div>
              <div className="text-sm font-semibold text-text-dark leading-snug">Location Hazard Assessment</div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin size={11} /> {barangay || 'Barangay not identifiable'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 -m-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 text-xs">
          <div>
            <dt className="text-gray-400 mb-0.5">Latitude</dt>
            <dd className="text-gray-700 font-medium tabular-nums">{site.lat.toFixed(6)}</dd>
          </div>
          <div>
            <dt className="text-gray-400 mb-0.5">Longitude</dt>
            <dd className="text-gray-700 font-medium tabular-nums">{site.lng.toFixed(6)}</dd>
          </div>
          {isLoading ? (
            <div className="col-span-2"><SkeletonGroup label="Checking hazard data…" className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></SkeletonGroup></div>
          ) : isError ? (
            <div className="col-span-2 text-red-500">Could not check hazard data for this location.</div>
          ) : (
            <>
              <div>
                <dt className="text-gray-400 mb-0.5">Flood risk</dt>
                <dd><ExposureBadge result={data.hazards.Flood} /></dd>
              </div>
              <div>
                <dt className="text-gray-400 mb-0.5">Landslide risk</dt>
                <dd><ExposureBadge result={data.hazards.Landslide} /></dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-400 mb-0.5">Overall hazard exposure</dt>
                <dd><ExposureBadge result={overall} /></dd>
              </div>
            </>
          )}
        </dl>

        {data && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
            <div className="font-semibold text-gray-600">Hazard data used</div>
            {datasets.map(([k, h]) => (
              <div key={k}>{k}: {h.dataset.dataset_name}{h.dataset.source_agency && ` · ${h.dataset.source_agency}`}{h.dataset.data_year && ` (${h.dataset.data_year})`}</div>
            ))}
            {datasets.some(([, h]) => h.source === 'estimate') && (
              <div className="text-amber-700">Estimate from elevation, slope and distance to coast/rivers — not an official hazard map.</div>
            )}
            {missing.length > 0 && <div className="text-gray-400">No {missing.join(' / ').toLowerCase()} hazard dataset is loaded in the system.</div>}
          </div>
        )}

        <p className="mt-3 flex gap-1.5 text-[10px] text-gray-400 leading-snug">
          <Info size={11} className="shrink-0 mt-px" />
          Based on available mapped data only; not a structural or site safety assessment. No building record is created.
        </p>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, swatch, label, hint }) {
  return (
    <label className="flex items-center gap-2.5 py-1 cursor-pointer select-none group">
      <span className="w-3 h-3 rounded-sm shrink-0" style={swatch} />
      <span className="flex-1 text-xs text-gray-700 group-hover:text-gray-900">
        {label}
        {hint && <span className="block text-[10px] text-gray-400 leading-tight">{hint}</span>}
      </span>
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="relative w-8 h-[18px] rounded-full bg-gray-300 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300
        after:absolute after:top-0.5 after:left-0.5 after:w-3.5 after:h-3.5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-3.5" />
    </label>
  )
}

function FilterPanel({
  barangayId, setBarangayId, riskLevel, setRiskLevel, hazard, setHazard,
  showFlood, setShowFlood, showLandslide, setShowLandslide, showBoundaries, setShowBoundaries,
  barangays, riskCounts, shownCount, totalCount, emptyLayers, onReset, loading,
}) {
  const [open, setOpen] = useState(true)
  const hasFilters = barangayId || riskLevel || hazard !== 'overall'

  return (
    <div className="absolute top-4 left-4 z-[1000] w-[calc(100%-5rem)] max-w-[272px] bg-white/95 backdrop-blur rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-text-dark">
          <span className="w-7 h-7 rounded-lg bg-blue-50 text-primary flex items-center justify-center"><Layers size={14} /></span>
          Layers & Filters
        </span>
        <span className="flex items-center gap-2">
          {loading
            ? <Skeleton className="h-3 w-8" />
            : <span className="text-[11px] font-medium text-gray-500 tabular-nums">{shownCount}/{totalCount}</span>}
          <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 space-y-4 border-t border-gray-100 max-h-[calc(100vh-260px)] overflow-y-auto">
          {/* Barangay */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Barangay</label>
            <select
              className="w-full px-2.5 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-primary"
              value={barangayId}
              onChange={e => setBarangayId(e.target.value)}
            >
              <option value="">All barangays</option>
              {barangays?.map(b => <option key={b.barangay_id} value={b.barangay_id}>{b.barangay_name}</option>)}
            </select>
          </div>

          {/* Hazard selector */}
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hazard</div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-lg" role="radiogroup" aria-label="Hazard">
              {HAZARDS.map(h => (
                <button
                  key={h.key}
                  role="radio"
                  aria-checked={hazard === h.key}
                  onClick={() => setHazard(h.key)}
                  className={`py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                    hazard === h.key ? 'bg-white text-text-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Risk level chips */}
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{hazard === 'overall' ? 'Risk Level' : `${hazard} Risk Level`}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {RISK_LEVELS.map(level => {
                const active = riskLevel === level
                const c = RISK_COLORS[level]
                return (
                  <button
                    key={level}
                    onClick={() => setRiskLevel(active ? '' : level)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] font-medium text-left transition-all ${
                      active ? 'shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    style={active ? { backgroundColor: c.bg, borderColor: c.hex, color: c.text } : undefined}
                    aria-pressed={active}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                    <span className="flex-1 truncate">{level === 'Moderate-to-High' ? 'Mod–High' : level}</span>
                    <span className="tabular-nums opacity-70">{riskCounts[level] || 0}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Layers */}
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Hazard Layers</div>
            <Toggle checked={showFlood} onChange={setShowFlood} label="Flood Hazard"
              swatch={{ background: '#3B82F6', opacity: 0.6 }} hint={emptyLayers.flood ? 'No dataset loaded' : null} />
            <Toggle checked={showLandslide} onChange={setShowLandslide} label="Landslide Hazard"
              swatch={{ background: '#EA580C', opacity: 0.6 }} hint={emptyLayers.landslide ? 'No dataset loaded' : null} />
            <Toggle checked={showBoundaries} onChange={setShowBoundaries} label="Barangay Boundaries"
              swatch={{ border: '1.5px dashed #2563EB' }} hint={emptyLayers.boundaries ? 'No dataset loaded' : null} />
          </div>

          {hasFilters && (
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <RotateCcw size={12} /> Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const isEmpty = (fc) => fc && !(fc.features?.length)

export default function MapPage() {
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [barangayId, setBarangayId] = useState('')
  const [riskLevel, setRiskLevel] = useState('')
  const [hazard, setHazard] = useState('overall')
  const [showFlood, setShowFlood] = useState(true)
  const [showLandslide, setShowLandslide] = useState(true)
  const [showBoundaries, setShowBoundaries] = useState(true)
  const { canEdit } = useAuth()
  const [assessMode, setAssessMode] = useState(false)
  const [site, setSite] = useState(null) // { lat, lng } of a potential (unbuilt) location
  const [outsideHint, setOutsideHint] = useState(false)
  const markerClickRef = useRef(false)

  const { data: geojson, isLoading } = useQuery({ queryKey: ['buildings-geojson'], queryFn: () => buildingService.geojson() })
  const { data: floodLayer } = useQuery({ queryKey: ['hazard-flood'], queryFn: () => hazardService.layers('flood'), enabled: showFlood })
  const { data: landslideLayer } = useQuery({ queryKey: ['hazard-landslide'], queryFn: () => hazardService.layers('landslide'), enabled: showLandslide })
  const { data: boundaries } = useQuery({ queryKey: ['barangay-boundaries'], queryFn: () => hazardService.barangayBoundaries(), enabled: showBoundaries })
  const { data: lookups } = useQuery({ queryKey: ['lookups'], queryFn: lookupService.all })

  const allFeatures = geojson?.features || []

  // Buildings in the selected barangay (before risk filter) — used for chip counts
  const inBarangay = useMemo(
    () => allFeatures.filter(f => !barangayId || String(f.properties.barangay_id) === String(barangayId)),
    [allFeatures, barangayId]
  )
  const riskCounts = useMemo(() => {
    const c = {}
    for (const f of inBarangay) { const l = levelOf(f, hazard); if (l) c[l] = (c[l] || 0) + 1 }
    return c
  }, [inBarangay, hazard])
  const filteredFeatures = inBarangay.filter(f => !riskLevel || levelOf(f, hazard) === riskLevel)

  const selectedId = selectedBuilding?.properties?.building_id

  // Clear the selection if the selected building gets filtered out
  useEffect(() => {
    if (selectedId && !filteredFeatures.some(f => f.properties.building_id === selectedId)) setSelectedBuilding(null)
  }, [filteredFeatures, selectedId])

  return (
    <div className="relative -m-6 h-[calc(100%+3rem)] min-h-[480px]">
      <MapContainer
        bounds={BOUNDARY_BOUNDS}
        boundsOptions={{ padding: [20, 20] }}
        {...RESTRICT_PROPS}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        {/* Top-right so the Layers & Filters panel (top-left) doesn't cover it */}
        <ZoomControl position="topright" />
        <FitToBarangay barangayId={barangayId} features={inBarangay} />
        <SitePicker
          active={assessMode}
          ignoreRef={markerClickRef}
          onPick={(p) => { setSite(p); setSelectedBuilding(null); setOutsideHint(false) }}
          onOutside={() => setOutsideHint(true)}
        />
        {site && <Marker position={[site.lat, site.lng]} icon={SITE_ICON} />}

        {showFlood && floodLayer && <HazardLayer data={floodLayer} />}
        {showLandslide && landslideLayer && <HazardLayer data={landslideLayer} />}
        {showBoundaries && boundaries && <BarangayLayer data={boundaries} />}

        {filteredFeatures.map(f => (
          <BuildingMarker
            key={f.properties.building_id}
            building={f}
            selected={f.properties.building_id === selectedId}
            showPopup={false}
            level={levelOf(f, hazard) ?? null}
            onClick={() => { markerClickRef.current = true; setSelectedBuilding(f); setSite(null) }}
          />
        ))}
      </MapContainer>

      <FilterPanel
        barangayId={barangayId} setBarangayId={setBarangayId}
        riskLevel={riskLevel} setRiskLevel={setRiskLevel}
        hazard={hazard} setHazard={setHazard}
        showFlood={showFlood} setShowFlood={setShowFlood}
        showLandslide={showLandslide} setShowLandslide={setShowLandslide}
        showBoundaries={showBoundaries} setShowBoundaries={setShowBoundaries}
        barangays={lookups?.barangays}
        riskCounts={riskCounts}
        loading={isLoading}
        shownCount={filteredFeatures.length}
        totalCount={allFeatures.length}
        emptyLayers={{ flood: isEmpty(floodLayer), landslide: isEmpty(landslideLayer), boundaries: isEmpty(boundaries) }}
        onReset={() => { setBarangayId(''); setRiskLevel(''); setHazard('overall') }}
      />

      {/* Loading / empty states */}
      {isLoading && (
        <SkeletonGroup label="Loading buildings…" className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-3 py-2 rounded-full bg-white shadow-lg border border-gray-200">
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <Skeleton className="h-2.5 w-24" />
        </SkeletonGroup>
      )}
      {!isLoading && allFeatures.length > 0 && filteredFeatures.length === 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1.5 rounded-full bg-white shadow-lg border border-gray-200 text-xs text-gray-600">
          No buildings match these filters
        </div>
      )}

      {/* Assess-location mode toggle (authorized MEO personnel) */}
      {canEdit && (
        <button
          onClick={() => { setAssessMode(m => !m); setOutsideHint(false) }}
          aria-pressed={assessMode}
          className={`absolute top-4 right-14 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-lg border text-xs font-semibold transition-colors ${
            assessMode ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Crosshair size={14} /> {assessMode ? 'Assessing location' : 'Assess Location'}
        </button>
      )}
      {assessMode && (
        <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1.5 rounded-full bg-white shadow-lg border text-xs whitespace-nowrap ${outsideHint ? 'border-red-200 text-red-600' : 'border-gray-200 text-gray-600'}`}>
          {outsideHint ? 'That point is outside Bongabong.' : 'Click any location in Bongabong to check its hazard exposure'}
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-[1000] space-y-2">
        <RiskLegend title={HAZARDS.find(h => h.key === hazard).legend} />
      </div>

      <SelectedPanel building={selectedBuilding} hazard={hazard} onClose={() => setSelectedBuilding(null)} />
      {site && !selectedBuilding && <SitePanel key={`${site.lat},${site.lng}`} site={site} boundaries={boundaries} onClose={() => setSite(null)} />}
    </div>
  )
}
