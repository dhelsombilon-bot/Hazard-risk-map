import { MapContainer, TileLayer } from 'react-leaflet'
import { BOUNDARY_BOUNDS, RESTRICT_PROPS } from './BongabongBoundary'

// Town proper (Bongabong Municipal Hall) — used when picking a building location
export const BONGABONG_CENTER = [12.7474, 121.4886]
// Whole municipality
export const MUNICIPALITY_CENTER = BOUNDARY_BOUNDS.getCenter()
export const BONGABONG_ZOOM = 12

/**
 * Leaflet map limited to Bongabong. With no `center`, it frames the whole municipality.
 */
export default function BaseMap({ center, zoom = BONGABONG_ZOOM, children, style }) {
  const view = center
    ? { center, zoom }
    : { bounds: BOUNDARY_BOUNDS, boundsOptions: { padding: [10, 10] } }
  return (
    <MapContainer {...view} {...RESTRICT_PROPS} style={{ height: '100%', width: '100%', ...style }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  )
}
