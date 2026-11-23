<?php

namespace Database\Seeders;

use App\Models\Barangay;
use App\Models\BuildingStatus;
use App\Models\BuildingType;
use App\Models\DocumentType;
use App\Models\HazardLevel;
use App\Models\HazardType;
use App\Models\PermitStatus;
use App\Models\PermitType;
use Illuminate\Database\Seeder;

class LookupSeeder extends Seeder
{
    public function run(): void
    {
        // The 36 barangays of Bongabong (PSGC 1705203000)
        foreach (['Anilao', 'Aplaya', 'Bagumbayan I', 'Bagumbayan II', 'Batangan', 'Bukal', 'Camantigue', 'Carmundo', 'Cawayan', 'Dayhagan', 'Formon', 'Hagan', 'Hagupit', 'Ipil', 'Kaligtasan', 'Labasan', 'Labonan', 'Libertad', 'Lisap', 'Luna', 'Malitbog', 'Mapang', 'Masaguisi', 'Mina de Oro', 'Morente', 'Ogbot', 'Orconuma', 'Poblacion', 'Polusahi', 'Sagana', 'San Isidro', 'San Jose', 'San Juan', 'Santa Cruz', 'Sigange', 'Tawas'] as $name) {
            Barangay::firstOrCreate(['barangay_name' => $name]);
        }

        foreach (['Health Facility','Market','Government Office','Education','Emergency Facility','Sports Facility','Multipurpose Hall'] as $name) {
            BuildingType::firstOrCreate(['type_name' => $name]);
        }

        foreach (['Verified','Needs review','For review'] as $name) {
            BuildingStatus::firstOrCreate(['status_name' => $name]);
        }

        foreach (['Building Permit','Occupancy Permit','Renovation Permit'] as $name) {
            PermitType::firstOrCreate(['type_name' => $name]);
        }

        foreach (['Compliant','For review','Incomplete','No permit record'] as $name) {
            PermitStatus::firstOrCreate(['status_name' => $name]);
        }

        foreach (['Building Permit','Occupancy Permit','Fire Safety Certificate','Sanitary Permit'] as $name) {
            DocumentType::firstOrCreate(['document_name' => $name], ['document_name' => $name, 'is_required' => true]);
        }

        foreach (['Flood','Landslide'] as $name) {
            HazardType::firstOrCreate(['hazard_name' => $name]);
        }

        $levels = [
            ['level_name' => 'High', 'color_code' => '#DC2626', 'severity_order' => 1],
            ['level_name' => 'Moderate-to-High', 'color_code' => '#EA580C', 'severity_order' => 2],
            ['level_name' => 'Moderate', 'color_code' => '#EAB308', 'severity_order' => 3],
            ['level_name' => 'Low', 'color_code' => '#22C55E', 'severity_order' => 4],
        ];
        foreach ($levels as $level) {
            HazardLevel::firstOrCreate(['level_name' => $level['level_name']], $level);
        }
    }
}
