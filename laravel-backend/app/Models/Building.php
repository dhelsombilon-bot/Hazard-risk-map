<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Building extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'building_id';

    protected $fillable = [
        'building_code', 'building_name', 'building_type_id', 'building_status_id',
        'barangay_id', 'street_address', 'managing_office', 'year_built', 'description',
        'latitude', 'longitude', 'elevation_m', 'coordinate_source',
        'verified_at', 'verified_by', 'created_by',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'elevation_m' => 'float',
        'year_built' => 'integer',
        'verified_at' => 'datetime',
    ];

    public function barangay()
    {
        return $this->belongsTo(Barangay::class, 'barangay_id', 'barangay_id');
    }

    public function buildingType()
    {
        return $this->belongsTo(BuildingType::class, 'building_type_id', 'building_type_id');
    }

    public function buildingStatus()
    {
        return $this->belongsTo(BuildingStatus::class, 'building_status_id', 'building_status_id');
    }

    public function hazardAssessments()
    {
        return $this->hasMany(BuildingHazardAssessment::class, 'building_id', 'building_id');
    }

    public function landscapeFeatures()
    {
        return $this->hasMany(BuildingLandscapeFeature::class, 'building_id', 'building_id');
    }

    public function activityLogs()
    {
        return $this->hasMany(BuildingActivityLog::class, 'building_id', 'building_id');
    }

    public function permits()
    {
        return $this->hasMany(Permit::class, 'building_id', 'building_id');
    }

    public function getRiskLevelAttribute(): string
    {
        $levels = $this->hazardAssessments->pluck('hazard_level');
        $priority = ['High', 'Moderate-to-High', 'Moderate', 'Low'];
        foreach ($priority as $p) {
            if ($levels->contains($p)) return $p;
        }
        return 'Low';
    }
}
