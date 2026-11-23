<?php

namespace Database\Seeders;

use App\Models\Barangay;
use App\Models\Building;
use App\Models\BuildingActivityLog;
use App\Models\BuildingHazardAssessment;
use App\Models\BuildingLandscapeFeature;
use App\Models\BuildingStatus;
use App\Models\BuildingType;
use App\Models\HazardType;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Real public buildings in Bongabong, Oriental Mindoro.
 *
 * - Coordinates: OpenStreetMap feature centroids (see 'osm' id), retrieved 2026-11-14.
 *   Every point was checked to lie on land against the OSM coastline.
 * - Elevation: SRTM 30 m (OpenTopoData).
 * - Hazard levels are a GeoPermit ESTIMATE, not an official MGB / PAGASA / NOAH map:
 *     Flood:     High              elev <= 6 m and (coast <= 300 m or river <= 150 m)
 *                Moderate-to-High  elev <= 10 m and (coast <= 600 m or river <= 300 m)
 *                Moderate          elev <= 15 m or river <= 500 m
 *                Low               otherwise
 *     Landslide: max slope to points 150 m N/S/E/W — >=30% High, >=20% Mod-to-High, >=10% Moderate, else Low
 *   Replace with official hazard-map values once those datasets are loaded.
 */
class BuildingSeeder extends Seeder
{
    private const DATASET = 'GeoPermit estimate (SRTM 30m + OSM water features)';

    public function run(): void
    {
        $admin = User::where('email', 'admin@geopermit.test')->first();

        $barangay = fn($name) => Barangay::firstOrCreate(['barangay_name' => $name])->barangay_id;
        $type = fn($name) => BuildingType::where('type_name', $name)->value('building_type_id');
        $needsReview = BuildingStatus::where('status_name', 'Needs review')->value('building_status_id');

        $buildings = [
            ['building_code'=>'GP-0001','building_name'=>'Bongabong Municipal Hall','type'=>'Government Office','barangay'=>'Poblacion','street_address'=>'M. Y. Hernandez Street, Poblacion','managing_office'=>'Office of the Municipal Mayor','latitude'=>12.74737,'longitude'=>121.488579,'elevation_m'=>11,'osm'=>'way/760091152','hazards'=>[['type'=>'Flood','level'=>'Moderate'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Ipil Creek','type'=>'River','distance_m'=>143],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>347]]],
            ['building_code'=>'GP-0002','building_name'=>'Bongabong Public Market','type'=>'Market','barangay'=>'Poblacion','street_address'=>'Magsaysay Street, Poblacion','managing_office'=>'Office of the Municipal Treasurer','latitude'=>12.747855,'longitude'=>121.487955,'elevation_m'=>9,'osm'=>'way/760091142','hazards'=>[['type'=>'Flood','level'=>'Moderate-to-High'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Ipil Creek','type'=>'River','distance_m'=>226],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>354]]],
            ['building_code'=>'GP-0003','building_name'=>'Bongabong Municipal Police Station','type'=>'Emergency Facility','barangay'=>'Poblacion','street_address'=>'Lapu Lapu Street, Poblacion','managing_office'=>'Philippine National Police','latitude'=>12.74868,'longitude'=>121.487885,'elevation_m'=>11,'osm'=>'node/14026285917','hazards'=>[['type'=>'Flood','level'=>'Moderate'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Ipil Creek','type'=>'River','distance_m'=>268],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>292]]],
            ['building_code'=>'GP-0004','building_name'=>'Municipal Trial Court - Bongabong','type'=>'Government Office','barangay'=>'Poblacion','street_address'=>'Lapu Lapu Street, Poblacion','managing_office'=>'Supreme Court - Office of the Court Administrator','latitude'=>12.749019,'longitude'=>121.487429,'elevation_m'=>11,'osm'=>'way/986124033','hazards'=>[['type'=>'Flood','level'=>'Moderate'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Ipil Creek','type'=>'River','distance_m'=>328],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>299]]],
            ['building_code'=>'GP-0005','building_name'=>'Bongabong Post Office','type'=>'Government Office','barangay'=>'Poblacion','street_address'=>'Plaridel Street, Poblacion','managing_office'=>'PHLPost','latitude'=>12.74829,'longitude'=>121.488242,'elevation_m'=>10,'osm'=>'node/6717678378','hazards'=>[['type'=>'Flood','level'=>'Moderate-to-High'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Ipil Creek','type'=>'River','distance_m'=>215],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>297]]],
            ['building_code'=>'GP-0006','building_name'=>'Aplaya Barangay Hall','type'=>'Government Office','barangay'=>'Aplaya','street_address'=>'Lapu Lapu Street, Aplaya','managing_office'=>'Barangay Council','latitude'=>12.751571,'longitude'=>121.487752,'elevation_m'=>5,'osm'=>'way/1540712073','hazards'=>[['type'=>'Flood','level'=>'High'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Ipil Creek','type'=>'River','distance_m'=>467],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>73]]],
            ['building_code'=>'GP-0007','building_name'=>'Bagong Bayan II Barangay Hall','type'=>'Government Office','barangay'=>'Bagumbayan II','street_address'=>'Jose P. Rizal Street, Bagumbayan II','managing_office'=>'Barangay Council','latitude'=>12.751464,'longitude'=>121.482873,'elevation_m'=>8,'osm'=>'way/1540712042','hazards'=>[['type'=>'Flood','level'=>'Moderate-to-High'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Unnamed river','type'=>'River','distance_m'=>372],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>453]]],
            ['building_code'=>'GP-0008','building_name'=>'Aplaya Elementary School','type'=>'Education','barangay'=>'Aplaya','street_address'=>'Lapu Lapu Street, Aplaya','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.749855,'longitude'=>121.487012,'elevation_m'=>9,'osm'=>'way/760091145','hazards'=>[['type'=>'Flood','level'=>'Moderate-to-High'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Ipil Creek','type'=>'River','distance_m'=>408],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>265]]],
            ['building_code'=>'GP-0009','building_name'=>'Bagong Bayan Central School','type'=>'Education','barangay'=>'Bagumbayan II','street_address'=>'Jose P. Rizal Street, Bagumbayan II','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.750821,'longitude'=>121.483064,'elevation_m'=>7,'osm'=>'way/671988035','hazards'=>[['type'=>'Flood','level'=>'Moderate-to-High'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Unnamed river','type'=>'River','distance_m'=>436],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>489]]],
            ['building_code'=>'GP-0010','building_name'=>'Magdalena Umali Suyon Memorial School','type'=>'Education','barangay'=>'Poblacion','street_address'=>'Umali Street, Poblacion','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.745741,'longitude'=>121.486699,'elevation_m'=>7,'osm'=>'way/760091134','hazards'=>[['type'=>'Flood','level'=>'Moderate'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Ipil Creek','type'=>'River','distance_m'=>309],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>618]]],
            ['building_code'=>'GP-0011','building_name'=>'Labasan National High School','type'=>'Education','barangay'=>'Labasan','street_address'=>'Calapan South Road, Labasan','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.778758,'longitude'=>121.474522,'elevation_m'=>7,'osm'=>'way/784979072','hazards'=>[['type'=>'Flood','level'=>'Moderate-to-High'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Unnamed river','type'=>'River','distance_m'=>869],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>169]]],
            ['building_code'=>'GP-0012','building_name'=>'Catalino Lopez Memorial Elementary School','type'=>'Education','barangay'=>'Libertad','street_address'=>'Calapan South Road, Libertad','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.773884,'longitude'=>121.442655,'elevation_m'=>22,'osm'=>'node/7155342305','hazards'=>[['type'=>'Flood','level'=>'Low'],['type'=>'Landslide','level'=>'Moderate']],'landscape'=>[['name'=>'Unnamed river','type'=>'River','distance_m'=>1770],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>3607]]],
            ['building_code'=>'GP-0013','building_name'=>'Formon Elementary School','type'=>'Education','barangay'=>'Formon','street_address'=>'Calapan South Road, Formon','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.688179,'longitude'=>121.412076,'elevation_m'=>205,'osm'=>'way/766127971','hazards'=>[['type'=>'Flood','level'=>'Low'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Bongabong River','type'=>'River','distance_m'=>2031],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>10843]]],
            ['building_code'=>'GP-0014','building_name'=>'Masaguisi Elementary School','type'=>'Education','barangay'=>'Masaguisi','street_address'=>'Western Nautical Highway, Masaguisi','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.681158,'longitude'=>121.540146,'elevation_m'=>7,'osm'=>'way/765969596','hazards'=>[['type'=>'Flood','level'=>'Moderate-to-High'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Unnamed river','type'=>'River','distance_m'=>1167],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>169]]],
            ['building_code'=>'GP-0015','building_name'=>'Camantigue Elementary School','type'=>'Education','barangay'=>'Camantigue','street_address'=>'Bongabong – Sagana – Roxas – San Aquilino Road, Camantigue','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.637277,'longitude'=>121.538412,'elevation_m'=>9,'osm'=>'way/784980818','hazards'=>[['type'=>'Flood','level'=>'Moderate'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Unnamed river','type'=>'River','distance_m'=>1516],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>1176]]],
            ['building_code'=>'GP-0016','building_name'=>'Cawayan National High School','type'=>'Education','barangay'=>'Cawayan','street_address'=>'Bongabong – Sagana – Roxas – San Aquilino Road, Cawayan','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.649183,'longitude'=>121.534737,'elevation_m'=>10,'osm'=>'way/765969066','hazards'=>[['type'=>'Flood','level'=>'Moderate'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Unnamed river','type'=>'River','distance_m'=>604],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>1426]]],
            ['building_code'=>'GP-0017','building_name'=>'Vicente B. Ylagan National High School','type'=>'Education','barangay'=>'Luna','street_address'=>'Western Nautical Highway, Luna','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.701043,'longitude'=>121.485014,'elevation_m'=>10,'osm'=>'way/784979261','hazards'=>[['type'=>'Flood','level'=>'Moderate'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Unnamed river','type'=>'River','distance_m'=>1623],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>4428]]],
            ['building_code'=>'GP-0018','building_name'=>'Orconuma Elementary School','type'=>'Education','barangay'=>'Orconuma','street_address'=>'Western Nautical Highway, Orconuma','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.671819,'longitude'=>121.492305,'elevation_m'=>30,'osm'=>'way/761167001','hazards'=>[['type'=>'Flood','level'=>'Moderate'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Bongabong River','type'=>'River','distance_m'=>313],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>5382]]],
            ['building_code'=>'GP-0019','building_name'=>'Morente Barangay Health Station','type'=>'Health Facility','barangay'=>'Morente','street_address'=>'Morente, Bongabong','managing_office'=>'Municipal Health Office','latitude'=>12.677587,'longitude'=>121.386098,'elevation_m'=>129,'osm'=>'node/7100487382','hazards'=>[['type'=>'Flood','level'=>'Moderate'],['type'=>'Landslide','level'=>'Moderate']],'landscape'=>[['name'=>'Unnamed river','type'=>'River','distance_m'=>131],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>13748]]],
            ['building_code'=>'GP-0020','building_name'=>'Batangan Mangyan Elementary School','type'=>'Education','barangay'=>'Batangan','street_address'=>'Batangan, Bongabong','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.661014,'longitude'=>121.360399,'elevation_m'=>199,'osm'=>'way/784976556','hazards'=>[['type'=>'Flood','level'=>'Moderate'],['type'=>'Landslide','level'=>'High']],'landscape'=>[['name'=>'Unnamed river','type'=>'River','distance_m'=>55],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>17076]]],
            ['building_code'=>'GP-0021','building_name'=>'Kaligtasan National High School','type'=>'Education','barangay'=>'Kaligtasan','street_address'=>'Western Nautical Highway, Kaligtasan','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.651036,'longitude'=>121.481027,'elevation_m'=>35,'osm'=>'way/761167270','hazards'=>[['type'=>'Flood','level'=>'Low'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Unnamed river','type'=>'River','distance_m'=>1796],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>7219]]],
            ['building_code'=>'GP-0022','building_name'=>'Santa Cruz Elementary School','type'=>'Education','barangay'=>'Santa Cruz','street_address'=>'Calapan South Road, Santa Cruz','managing_office'=>'DepEd - Schools Division of Oriental Mindoro','latitude'=>12.756138,'longitude'=>121.442909,'elevation_m'=>68,'osm'=>'node/7155324040','hazards'=>[['type'=>'Flood','level'=>'Low'],['type'=>'Landslide','level'=>'Low']],'landscape'=>[['name'=>'Unnamed river','type'=>'River','distance_m'=>1062],['name'=>'Tablas Strait coastline','type'=>'Coastline','distance_m'=>3991]]],
        ];

        foreach ($buildings as $bd) {
            $building = Building::firstOrCreate(['building_code' => $bd['building_code']], [
                'building_name' => $bd['building_name'],
                'building_type_id' => $type($bd['type']),
                'building_status_id' => $needsReview,
                'barangay_id' => $barangay($bd['barangay']),
                'street_address' => $bd['street_address'],
                'managing_office' => $bd['managing_office'],
                'description' => 'Location from OpenStreetMap ('.$bd['osm'].'). Needs field verification.',
                'latitude' => $bd['latitude'],
                'longitude' => $bd['longitude'],
                'elevation_m' => $bd['elevation_m'],
                'coordinate_source' => 'OpenStreetMap',
                'created_by' => $admin->user_id,
            ]);

            if (! $building->wasRecentlyCreated) {
                continue;
            }

            foreach ($bd['hazards'] as $h) {
                BuildingHazardAssessment::create([
                    'building_id' => $building->building_id,
                    'hazard_type_id' => HazardType::where('hazard_name', $h['type'])->value('hazard_type_id'),
                    'hazard_level' => $h['level'],
                    'dataset_name' => self::DATASET,
                    'assessment_date' => '2026-11-14',
                    'assessment_notes' => 'Estimated from elevation, slope and distance to coast/rivers. Not an official hazard map.',
                ]);
            }

            foreach ($bd['landscape'] as $f) {
                BuildingLandscapeFeature::create([
                    'building_id' => $building->building_id,
                    'feature_name' => $f['name'],
                    'feature_type' => $f['type'],
                    'distance_m' => $f['distance_m'],
                ]);
            }

            BuildingActivityLog::create([
                'building_id' => $building->building_id,
                'user_id' => $admin->user_id,
                'action' => 'Created building record',
            ]);
        }
    }
}
