import { CircleMarker, Popup, Tooltip } from 'react-leaflet'
import { riskHex } from '../../utils/riskColors'
import { Link } from 'react-router-dom'
import { RiskBadge } from '../ui/Badge'

// `level` overrides the color (e.g. the Flood or Landslide level); defaults to the overall risk
export default function BuildingMarker({ building, onClick, selected = false, showPopup = true, level }) {
  const props = building.properties || building
  const color = riskHex(level !== undefined ? level : props.risk_level)
  const [lng, lat] = building.geometry?.coordinates || [building.longitude, building.latitude]

  return (
    <>
      {/* Halo ring behind the selected marker */}
      {selected && (
        <CircleMarker
          center={[lat, lng]}
          radius={16}
          interactive={false}
          pathOptions={{ fillColor: color, fillOpacity: 0.2, color, weight: 2, opacity: 0.6 }}
        />
      )}
      <CircleMarker
        center={[lat, lng]}
        radius={selected ? 10 : 8}
        pathOptions={{ fillColor: color, color: '#fff', weight: selected ? 3 : 2, fillOpacity: 0.95 }}
        eventHandlers={{
          click: () => onClick && onClick(building),
          mouseover: (e) => e.target.setStyle({ weight: 3 }),
          mouseout: (e) => e.target.setStyle({ weight: selected ? 3 : 2 }),
        }}
      >
        <Tooltip direction="top" offset={[0, -8]} opacity={1}>
          <span className="font-medium">{props.name || props.building_name}</span>
        </Tooltip>
        {showPopup && (
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{props.name || props.building_name}</div>
              <div className="text-gray-500 text-xs">{props.barangay || props.barangay_name}</div>
              <div className="mt-1"><RiskBadge level={props.risk_level} /></div>
              <Link to={`/buildings/${props.id || props.building_id}`} className="text-blue-600 text-xs mt-1 block hover:underline">Open record →</Link>
            </div>
          </Popup>
        )}
      </CircleMarker>
    </>
  )
}
