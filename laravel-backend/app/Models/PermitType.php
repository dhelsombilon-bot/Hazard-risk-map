<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class PermitType extends Model {
    protected $primaryKey = 'permit_type_id';
    protected $fillable = ['type_name'];
}
