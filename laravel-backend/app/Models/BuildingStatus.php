<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class BuildingStatus extends Model {
    protected $primaryKey = 'building_status_id';
    protected $fillable = ['status_name'];
}
