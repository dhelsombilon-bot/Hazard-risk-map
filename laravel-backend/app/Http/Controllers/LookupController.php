<?php

namespace App\Http\Controllers;

use App\Models\Barangay;
use App\Models\BuildingStatus;
use App\Models\BuildingType;
use App\Models\DocumentType;
use App\Models\HazardLevel;
use App\Models\HazardType;
use App\Models\PermitStatus;
use App\Models\PermitType;
use App\Models\Role;

class LookupController extends Controller
{
    public function all()
    {
        return response()->json([
            'barangays' => Barangay::orderBy('barangay_name')->get(['barangay_id', 'barangay_name']),
            'building_types' => BuildingType::orderBy('type_name')->get(['building_type_id', 'type_name']),
            'building_statuses' => BuildingStatus::get(['building_status_id', 'status_name']),
            'permit_types' => PermitType::get(['permit_type_id', 'type_name']),
            'permit_statuses' => PermitStatus::get()->pluck('status_name'),
            'document_types' => DocumentType::get(['document_type_id', 'document_name', 'is_required']),
            'hazard_types' => HazardType::get(['hazard_type_id', 'hazard_name']),
            'hazard_levels' => HazardLevel::orderBy('severity_order')->get(['hazard_level_id', 'level_name', 'color_code']),
            'roles' => Role::get(['role_id', 'role_name']),
        ]);
    }
}
