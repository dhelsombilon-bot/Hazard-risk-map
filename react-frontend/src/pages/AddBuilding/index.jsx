import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, TriangleAlert } from 'lucide-react'
import HazardRiskFields, { emptyHazardRow, validateHazards, hazardsPayload } from '../../components/HazardRiskFields'
import { RiskBadge } from '../../components/ui/Badge'
import { hazardService } from '../../services/hazards'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { buildingService } from '../../services/buildings'
import { lookupService } from '../../services/lookups'
import { FormSkeleton } from '../../components/ui/Skeleton'
import { BONGABONG_CENTER } from '../../components/map/BaseMap'
import { isInsideBongabong, RESTRICT_PROPS } from '../../components/map/BongabongBoundary'

// Mirrors the Basic Information / Location / Coordinates / Other cards below
const BUILDING_FORM_SKELETON = [{ fields: 3 }, { fields: 3 }, { fields: 4, map: true }, { fields: 1, textarea: true }]

function LocationPicker({ lat, lng, onChange }) {
  const [outside, setOutside] = useState(false)
  function MapClicker() {
    useMapEvents({
      click: (e) => {
        // Only accept points inside the Bongabong municipal boundary
        if (!isInsideBongabong(e.latlng.lat, e.latlng.lng)) { setOutside(true); return }
        setOutside(false)
        onChange(+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6))
      },
    })
    return null
  }
  return (
    <div>
      <div style={{ height: 260, borderRadius: 8, overflow: 'hidden' }}>
        <MapContainer center={lat ? [lat, lng] : BONGABONG_CENTER} zoom={13} {...RESTRICT_PROPS} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <MapClicker />
          {lat && <Marker position={[lat, lng]} />}
        </MapContainer>
      </div>
      <p className={outside ? 'text-[11px] mt-1 text-red-500' : 'text-[11px] mt-1 text-gray-400'}>
        {outside ? 'That point is outside Bongabong. Pick a point within Bongabong.' : 'Click on the map to set the location (must be within Bongabong).'}
      </p>
    </div>
  )
}

function Field({ label, required, children, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

const today = () => new Date().toISOString().slice(0, 10)

/** Turn a /hazards/assess result into editable hazard rows */
function rowsFromAssessment(result, lookups) {
  return Object.entries(result?.hazards || {})
    .filter(([, h]) => h.level)
    .map(([name, h]) => {
      const inp = h.inputs
      const detail = inp ? ` Elevation ${inp.elevation_m} m, max slope ${inp.max_slope_pct}%, coast ${inp.coast_distance_m ?? '—'} m, river ${inp.river_distance_m ?? '—'} m.` : ''
      return {
        ...emptyHazardRow(),
        hazard_type_id: String(lookups?.hazard_types?.find(t => t.hazard_name === name)?.hazard_type_id ?? ''),
        hazard_level: h.level,
        dataset_name: h.dataset?.dataset_name || '',
        assessment_date: today(),
        assessment_notes: ((h.dataset?.notes || `Detected from ${h.dataset?.dataset_name || 'hazard map'}.`) + detail).trim(),
      }
    })
}

/** Status strip above the hazard rows: what was detected at the chosen location */
function DetectionStatus({ coords, query, touched, onApply }) {
  if (!coords) {
    return <div className="mb-3 p-3 rounded-lg bg-gray-50 text-xs text-gray-500">Set the building location (map, GPS or coordinates) to detect its hazard risk automatically.</div>
  }
  if (query.isLoading) {
    return <div className="mb-3 p-3 rounded-lg bg-blue-50 text-xs text-blue-700 flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Detecting hazard risk at this location…</div>
  }
  if (query.isError) {
    return <div className="mb-3 p-3 rounded-lg bg-red-50 text-xs text-red-600">Could not check hazard data for this location. You can still add hazards manually.</div>
  }
  const hazards = Object.entries(query.data?.hazards || {})
  const detected = hazards.filter(([, h]) => h.level)
  if (!detected.length) {
    return <div className="mb-3 p-3 rounded-lg bg-gray-50 text-xs text-gray-600"><b>No Available Hazard Data</b> for this location. Add hazards manually if you have an assessment.</div>
  }
  const overall = query.data.overall
  const isEstimate = detected.some(([, h]) => h.source === 'estimate')
  const highish = ['High', 'Moderate-to-High'].includes(overall?.level)
  return (
    <div className={`mb-3 p-3 rounded-lg border text-xs ${highish ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-center gap-1.5 font-semibold text-gray-800">
        <TriangleAlert size={13} className={highish ? 'text-red-600' : 'text-amber-600'} />
        Hazard risk detected at this location
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
        {hazards.map(([name, h]) => (
          <span key={name} className="flex items-center gap-1.5 text-gray-600">{name}: {h.level ? <RiskBadge level={h.level} /> : <span className="text-gray-400">No Available Hazard Data</span>}</span>
        ))}
        {overall?.level && <span className="flex items-center gap-1.5 text-gray-600">Overall: <RiskBadge level={overall.level} /></span>}
      </div>
      <p className="mt-2 text-[11px] text-gray-500">
        {isEstimate ? 'Source: GeoPermit estimate (SRTM elevation + OpenStreetMap coast/rivers) — not an official hazard map.' : 'Source: official hazard map loaded in GeoPermit.'}
        {' '}Values are filled in below; review them before saving.
      </p>
      {touched && (
        <button type="button" onClick={onApply} className="mt-2 text-[11px] font-semibold text-primary hover:underline">Replace the rows below with the detected values</button>
      )}
    </div>
  )
}

export default function AddBuildingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ building_name: '', building_type_id: '', building_status_id: '2', barangay_id: '', street_address: '', managing_office: '', year_built: '', description: '', latitude: '', longitude: '', elevation_m: '', coordinate_source: 'GPS', hazards: [] })
  const [errors, setErrors] = useState({})
  const [hazardsTouched, setHazardsTouched] = useState(false) // user edited rows → don't overwrite on re-detect
  const [coords, setCoords] = useState(null) // debounced, valid location to assess

  const { data: lookups, isLoading: lookupsLoading } = useQuery({ queryKey: ['lookups'], queryFn: lookupService.all })

  // Detect hazards shortly after the location stops changing (only for points inside Bongabong)
  useEffect(() => {
    const lat = Number(form.latitude), lng = Number(form.longitude)
    if (form.latitude === '' || form.longitude === '' || !isInsideBongabong(lat, lng)) { setCoords(null); return }
    const t = setTimeout(() => setCoords({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) }), 500)
    return () => clearTimeout(t)
  }, [form.latitude, form.longitude])

  const assess = useQuery({
    queryKey: ['hazard-assess', coords?.lat, coords?.lng],
    queryFn: () => hazardService.assess(coords.lat, coords.lng),
    enabled: !!coords && !!lookups,
    staleTime: Infinity,
  })

  const applyDetected = () => {
    setForm(f => ({
      ...f,
      hazards: rowsFromAssessment(assess.data, lookups),
      // Fill elevation from SRTM only if the user hasn't entered one
      elevation_m: f.elevation_m === '' && assess.data?.hazards?.Flood?.inputs ? assess.data.hazards.Flood.inputs.elevation_m : f.elevation_m,
    }))
    setHazardsTouched(false)
  }

  useEffect(() => {
    if (assess.data && !hazardsTouched) applyDetected()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assess.data])

  const mutation = useMutation({
    mutationFn: buildingService.create,
    onSuccess: (data) => {
      // New building must appear in the list and on the map (with its hazard color) right away
      queryClient.invalidateQueries({ queryKey: ['buildings'] })
      queryClient.invalidateQueries({ queryKey: ['buildings-geojson'] })
      toast({ message: 'Building record created successfully.' })
      navigate(`/buildings/${data.building_id}`)
    },
    onError: (err) => {
      if (err?.response?.status === 422) setErrors(err.response.data.errors || {})
      else toast({ message: 'Failed to save building record.', type: 'error' })
    },
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleGPS = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => { set('latitude', pos.coords.latitude); set('longitude', pos.coords.longitude); set('coordinate_source', 'Device GPS') },
      () => toast({ message: 'Could not get device location.', type: 'error' })
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    const errs = {}
    if (!form.building_name) errs.building_name = ['Building name is required.']
    if (!form.building_type_id) errs.building_type_id = ['Building type is required.']
    if (!form.barangay_id) errs.barangay_id = ['Barangay is required.']
    if (form.latitude && (isNaN(form.latitude) || Number(form.latitude) < -90 || Number(form.latitude) > 90)) errs.latitude = ['Invalid latitude.']
    if ((form.latitude || form.longitude) && !isInsideBongabong(form.latitude, form.longitude)) errs.latitude = ['Location must be inside Bongabong, Oriental Mindoro.']
    if (form.year_built && (isNaN(form.year_built) || String(form.year_built).length !== 4)) errs.year_built = ['Enter a 4-digit year.']
    Object.assign(errs, validateHazards(form.hazards))
    if (Object.keys(errs).length) { setErrors(errs); return }
    mutation.mutate({ ...form, hazards: hazardsPayload(form.hazards) })
  }

  const E = (key) => errors[key]?.[0] ? <p className="text-xs text-red-500 mt-0.5">{errors[key][0]}</p> : null

  if (lookupsLoading) return <FormSkeleton sections={BUILDING_FORM_SKELETON} />

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
      <Card title="Basic Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Building Name" required error={errors.building_name?.[0]}>
            <input className={inputCls} value={form.building_name} onChange={e => set('building_name', e.target.value)} />
          </Field>
          <Field label="Building Type" required error={errors.building_type_id?.[0]}>
            <select className={inputCls} value={form.building_type_id} onChange={e => set('building_type_id', e.target.value)}>
              <option value="">Select type…</option>
              {lookups?.building_types?.map(t => <option key={t.building_type_id} value={t.building_type_id}>{t.type_name}</option>)}
            </select>
          </Field>
          <Field label="Record Status" error={errors.building_status_id?.[0]}>
            <select className={inputCls} value={form.building_status_id} onChange={e => set('building_status_id', e.target.value)}>
              {lookups?.building_statuses?.map(s => <option key={s.building_status_id} value={s.building_status_id}>{s.status_name}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card title="Location">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Barangay" required error={errors.barangay_id?.[0]}>
            <select className={inputCls} value={form.barangay_id} onChange={e => set('barangay_id', e.target.value)}>
              <option value="">Select barangay…</option>
              {lookups?.barangays?.map(b => <option key={b.barangay_id} value={b.barangay_id}>{b.barangay_name}</option>)}
            </select>
          </Field>
          <Field label="Street Address" error={errors.street_address?.[0]}>
            <input className={inputCls} value={form.street_address} onChange={e => set('street_address', e.target.value)} />
          </Field>
          <Field label="Managing Office" error={errors.managing_office?.[0]}>
            <input className={inputCls} value={form.managing_office} onChange={e => set('managing_office', e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Coordinates" actions={<Button type="button" variant="secondary" size="sm" onClick={handleGPS}>Use Device GPS</Button>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Latitude" error={errors.latitude?.[0]}>
            <input className={inputCls} type="number" step="0.000001" value={form.latitude} onChange={e => set('latitude', e.target.value)} placeholder="12.7520" />
          </Field>
          <Field label="Longitude" error={errors.longitude?.[0]}>
            <input className={inputCls} type="number" step="0.000001" value={form.longitude} onChange={e => set('longitude', e.target.value)} placeholder="121.4880" />
          </Field>
          <Field label="Elevation (m)" error={errors.elevation_m?.[0]}>
            <input className={inputCls} type="number" value={form.elevation_m} onChange={e => set('elevation_m', e.target.value)} />
          </Field>
          <Field label="Coordinate Source" error={errors.coordinate_source?.[0]}>
            <input className={inputCls} value={form.coordinate_source} onChange={e => set('coordinate_source', e.target.value)} />
          </Field>
        </div>
        <p className="text-xs text-gray-400 mb-2">Click on the map to place the building marker.</p>
        <LocationPicker lat={Number(form.latitude) || null} lng={Number(form.longitude) || null} onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng) }} />
      </Card>

      <HazardRiskFields
        hazards={form.hazards}
        onChange={h => { set('hazards', h); setHazardsTouched(true) }}
        lookups={lookups}
        errors={errors}
      >
        <DetectionStatus coords={coords} query={assess} touched={hazardsTouched} onApply={applyDetected} />
      </HazardRiskFields>

      <Card title="Other">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Year Built" error={errors.year_built?.[0]}>
            <input className={inputCls} type="number" min="1900" max="2099" value={form.year_built} onChange={e => set('year_built', e.target.value)} placeholder="2020" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description" error={errors.description?.[0]}>
              <textarea className={inputCls} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
            </Field>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save Building'}</Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/buildings')}>Cancel</Button>
      </div>
    </form>
  )
}
