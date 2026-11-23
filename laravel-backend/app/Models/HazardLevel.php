<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HazardLevel extends Model {
    protected $primaryKey = 'hazard_level_id';
    protected $fillable = ['level_name','color_code','severity_order'];
}
