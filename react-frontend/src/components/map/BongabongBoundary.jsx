import L from 'leaflet'
import boundary from '../../data/bongabong-boundary.json'

/*
 * Official municipal boundary of Bongabong, Oriental Mindoro
 * (geoBoundaries PHL ADM3 — NAMRIA / PSA / OCHA, 2020).
 * Used to frame/limit the maps and to check that locations are inside Bongabong.
 * Nothing is drawn on the map.
 */

// GeoJSON is [lng, lat]; Leaflet wants [lat, lng]
const RING = boundary.geometry.coordinates[0].map(([lng, lat]) => [lat, lng])

export const BOUNDARY_BOUNDS = L.latLngBounds(RING)
// A little slack so the edge of the municipality isn't jammed against the viewport
export const MAX_BOUNDS = BOUNDARY_BOUNDS.pad(0.15)

/** Map props that keep the user looking at Bongabong only */
export const RESTRICT_PROPS = {
  maxBounds: MAX_BOUNDS,
  maxBoundsViscosity: 1.0,
  minZoom: 11,
}

/** Ray-casting point-in-polygon test against the municipal boundary */
export function isInsideBongabong(lat, lng) {
  if (lat == null || lng == null || lat === '' || lng === '' || isNaN(lat) || isNaN(lng)) return false
  const y = Number(lat), x = Number(lng)
  let inside = false
  for (let i = 0, j = RING.length - 1; i < RING.length; j = i++) {
    const [yi, xi] = RING[i]
    const [yj, xj] = RING[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
