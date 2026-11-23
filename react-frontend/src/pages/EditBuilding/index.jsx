import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import HazardRiskFields, { validateHazards, hazardsPayload } from '../../components/HazardRiskFields'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { FormSkeleton } from '../../components/ui/Skeleton'
import { buildingService } from '../../services/buildings'
import { lookupService } from '../../services/lookups'
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

export default function EditBuildingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})

  const { data: building, isLoading } = useQuery({
    queryKey: ['building', id],
    queryFn: () => buildingService.get(id),
  })

  const { data: lookups, isLoading: lookupsLoading } = useQuery({ queryKey: ['lookups'], queryFn: lookupService.all })

  useEffect(() => {
    // Initialise once both the building and lookups are loaded; don't clobber edits on refetch
    if (building && lookups && !form) {
      setForm({
        building_name: building.building_name || '',
        building_type_id: building.building_type_id || '',
        building_status_id: building.building_status_id || '',
        barangay_id: building.barangay_id || '',
        street_address: building.street_address || '',
        managing_office: building.managing_office || '',
        year_built: building.year_built || '',
        description: building.description || '',
        latitude: building.latitude || '',
        longitude: building.longitude || '',
        elevation_m: building.elevation_m || '',
        coordinate_source: building.coordinate_source || '',
        hazards: (building.hazards || []).map(h => ({
          hazard_assessment_id: h.hazard_assessment_id ?? null,
          // Older payloads/mocks may only carry the type name
          hazard_type_id: String(h.hazard_type_id ?? lookups?.hazard_types?.find(t => t.hazard_name === h.hazard_type)?.hazard_type_id ?? ''),
          hazard_level: h.hazard_level || '',
          dataset_name: h.dataset_name || '',
          assessment_date: h.assessment_date ? String(h.assessment_date).slice(0, 10) : '',
          assessment_notes: h.assessment_notes || '',
        })),
      })
    }
  }, [building, lookups])

  const mutation = useMutation({
    mutationFn: (data) => buildingService.update(id, data),
    onSuccess: (updated) => {
      // The save response is the full updated record (incl. hazards) → show it instantly, no refetch
      if (updated?.hazards) queryClient.setQueryData(['building', id], updated)
      else queryClient.invalidateQueries({ queryKey: ['building', id] })
      // Mark list + map/overview data stale (marker colors); they reload in the background when opened
      queryClient.invalidateQueries({ queryKey: ['buildings'] })
      queryClient.invalidateQueries({ queryKey: ['buildings-geojson'] })
      toast({ message: 'Building record updated.' })
      navigate(`/buildings/${id}`)
    },
    onError: (err) => {
      if (err?.response?.status === 422) setErrors(err.response.data.errors || {})
      else toast({ message: 'Failed to update building.', type: 'error' })
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
    if ((form.latitude || form.longitude) && !isInsideBongabong(form.latitude, form.longitude)) errs.latitude = ['Location must be inside Bongabong, Oriental Mindoro.']
    Object.assign(errs, validateHazards(form.hazards))
    if (Object.keys(errs).length) { setErrors(errs); return }
    mutation.mutate({ ...form, hazards: hazardsPayload(form.hazards) })
  }

  if (isLoading || lookupsLoading || !form) return <FormSkeleton sections={BUILDING_FORM_SKELETON} />

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
              {lookups?.building_types?.map(t => <option key={t.building_type_id} value={String(t.building_type_id)}>{t.type_name}</option>)}
            </select>
          </Field>
          <Field label="Record Status" error={errors.building_status_id?.[0]}>
            <select className={inputCls} value={form.building_status_id} onChange={e => set('building_status_id', e.target.value)}>
              {lookups?.building_statuses?.map(s => <option key={s.building_status_id} value={String(s.building_status_id)}>{s.status_name}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card title="Location">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Barangay" required error={errors.barangay_id?.[0]}>
            <select className={inputCls} value={form.barangay_id} onChange={e => set('barangay_id', e.target.value)}>
              <option value="">Select barangay…</option>
              {lookups?.barangays?.map(b => <option key={b.barangay_id} value={String(b.barangay_id)}>{b.barangay_name}</option>)}
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
            <input className={inputCls} type="number" step="0.000001" value={form.latitude} onChange={e => set('latitude', e.target.value)} />
          </Field>
          <Field label="Longitude" error={errors.longitude?.[0]}>
            <input className={inputCls} type="number" step="0.000001" value={form.longitude} onChange={e => set('longitude', e.target.value)} />
          </Field>
          <Field label="Elevation (m)">
            <input className={inputCls} type="number" value={form.elevation_m} onChange={e => set('elevation_m', e.target.value)} />
          </Field>
          <Field label="Coordinate Source">
            <input className={inputCls} value={form.coordinate_source} onChange={e => set('coordinate_source', e.target.value)} />
          </Field>
        </div>
        <p className="text-xs text-gray-400 mb-2">Click on the map to reposition the building marker.</p>
        <LocationPicker lat={Number(form.latitude) || null} lng={Number(form.longitude) || null} onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng) }} />
      </Card>

      <HazardRiskFields hazards={form.hazards} onChange={h => set('hazards', h)} lookups={lookups} errors={errors} />

      <Card title="Other">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Year Built" error={errors.year_built?.[0]}>
            <input className={inputCls} type="number" min="1900" max="2099" value={form.year_built} onChange={e => set('year_built', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea className={inputCls} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
            </Field>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save Changes'}</Button>
        <Button type="button" variant="secondary" onClick={() => navigate(`/buildings/${id}`)}>Cancel</Button>
      </div>
    </form>
  )
}
