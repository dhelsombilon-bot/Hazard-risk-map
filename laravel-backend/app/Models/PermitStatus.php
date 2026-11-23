<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class PermitStatus extends Model {
    protected $primaryKey = 'permit_status_id';
    protected $fillable = ['status_name'];
}
