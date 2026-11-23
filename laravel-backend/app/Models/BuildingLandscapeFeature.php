<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class BuildingLandscapeFeature extends Model {
    protected $primaryKey = 'assessment_id';
    protected $fillable = ['building_id','feature_name','feature_type','distance_m','assessment_notes'];
}
