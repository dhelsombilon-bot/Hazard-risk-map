<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HazardType extends Model {
    protected $primaryKey = 'hazard_type_id';
    protected $fillable = ['hazard_name'];
}
