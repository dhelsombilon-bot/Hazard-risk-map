<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class BuildingActivityLog extends Model {
    protected $primaryKey = 'log_id';
    protected $fillable = ['building_id','user_id','action','entity_type','old_values','new_values'];
    protected $casts = ['old_values' => 'array', 'new_values' => 'array'];
    public function user() { return $this->belongsTo(User::class, 'user_id', 'user_id'); }
    public function getUserNameAttribute(): string { return $this->user ? $this->user->first_name.' '.$this->user->last_name : 'System'; }
}
