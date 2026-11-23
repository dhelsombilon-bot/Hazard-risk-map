// No mock polygons: the old placeholder rectangles were not real hazard or
// barangay boundary data. Load official GeoJSON through the backend instead.
export const mockHazardLayers = {
  flood: { type: 'FeatureCollection', features: [] },
  landslide: { type: 'FeatureCollection', features: [] },
}

export const mockBarangayBoundaries = { type: 'FeatureCollection', features: [] }
