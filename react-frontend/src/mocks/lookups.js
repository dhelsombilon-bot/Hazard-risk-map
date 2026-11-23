export const barangays = [
  { barangay_id: 1, barangay_name: 'Poblacion' },
  { barangay_id: 2, barangay_name: 'Libertad' },
  { barangay_id: 3, barangay_name: 'San Isidro' },
  { barangay_id: 4, barangay_name: 'Masaguisi' },
  { barangay_id: 5, barangay_name: 'Camantigue' },
  { barangay_id: 6, barangay_name: 'Formon' },
  { barangay_id: 7, barangay_name: 'Batangan' },
  { barangay_id: 8, barangay_name: 'Caminawit' },
  { barangay_id: 9, barangay_name: 'Banus' },
  { barangay_id: 10, barangay_name: 'Labasan' },
]

export const buildingTypes = [
  { building_type_id: 1, type_name: 'Health Facility' },
  { building_type_id: 2, type_name: 'Market' },
  { building_type_id: 3, type_name: 'Government Office' },
  { building_type_id: 4, type_name: 'Education' },
  { building_type_id: 5, type_name: 'Emergency Facility' },
  { building_type_id: 6, type_name: 'Sports Facility' },
  { building_type_id: 7, type_name: 'Multipurpose Hall' },
]

export const buildingStatuses = [
  { building_status_id: 1, status_name: 'Verified' },
  { building_status_id: 2, status_name: 'Needs review' },
  { building_status_id: 3, status_name: 'For review' },
]

export const permitTypes = [
  { permit_type_id: 1, type_name: 'Building Permit' },
  { permit_type_id: 2, type_name: 'Occupancy Permit' },
  { permit_type_id: 3, type_name: 'Renovation Permit' },
]

export const permitStatuses = [
  { permit_status_id: 1, status_name: 'Compliant' },
  { permit_status_id: 2, status_name: 'For review' },
  { permit_status_id: 3, status_name: 'Incomplete' },
  { permit_status_id: 4, status_name: 'No permit record' },
]

export const documentTypes = [
  { document_type_id: 1, document_name: 'Building Permit' },
  { document_type_id: 2, document_name: 'Occupancy Permit' },
  { document_type_id: 3, document_name: 'Fire Safety Certificate' },
  { document_type_id: 4, document_name: 'Sanitary Permit' },
]

export const hazardTypes = [
  { hazard_type_id: 1, hazard_name: 'Flood' },
  { hazard_type_id: 2, hazard_name: 'Landslide' },
]

export const hazardLevels = [
  { hazard_level_id: 1, level_name: 'High', color_code: '#DC2626' },
  { hazard_level_id: 2, level_name: 'Moderate-to-High', color_code: '#EA580C' },
  { hazard_level_id: 3, level_name: 'Moderate', color_code: '#EAB308' },
  { hazard_level_id: 4, level_name: 'Low', color_code: '#22C55E' },
]

export const roles = [
  { role_id: 1, role_name: 'System Administrator', description: 'Full access including user management' },
  { role_id: 2, role_name: 'MEO Personnel', description: 'Add, edit, and review building and permit records' },
  { role_id: 3, role_name: 'MEO Management', description: 'View-only access to dashboard, maps, and reports' },
]
