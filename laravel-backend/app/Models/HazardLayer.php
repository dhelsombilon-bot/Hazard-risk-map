<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HazardLayer extends Model {
    protected $primaryKey = 'layer_id';
    protected $fillable = ['hazard_type_id','dataset_name','source_agency','data_year','geojson','file_path','is_active'];
    protected $casts = ['is_active' => 'boolean'];
    public function hazardType() { return $this->belongsTo(HazardType::class, 'hazard_type_id', 'hazard_type_id'); }
}
