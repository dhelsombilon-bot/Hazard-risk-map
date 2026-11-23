<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Barangay extends Model {
    protected $primaryKey = 'barangay_id';
    protected $fillable = ['barangay_name'];
}
