import { GeoJSON } from 'react-leaflet'

export default function BarangayLayer({ data }) {
  if (!data?.features?.length) return null
  return (
    <GeoJSON
      key={JSON.stringify(data)}
      data={data}
      style={{ fillColor: '#3B82F6', fillOpacity: 0.05, color: '#2563EB', weight: 1.5, dashArray: '4' }}
    />
  )
}
