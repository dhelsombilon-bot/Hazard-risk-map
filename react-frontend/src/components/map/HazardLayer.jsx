import { GeoJSON } from 'react-leaflet'
import { riskHex } from '../../utils/riskColors'

export default function HazardLayer({ data }) {
  if (!data?.features?.length) return null
  return (
    <GeoJSON
      key={JSON.stringify(data)}
      data={data}
      style={(feature) => ({
        fillColor: riskHex(feature.properties?.level),
        fillOpacity: 0.35,
        color: riskHex(feature.properties?.level),
        weight: 1,
      })}
    />
  )
}
