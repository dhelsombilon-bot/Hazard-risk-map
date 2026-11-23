<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class PermitFinding extends Model {
    protected $primaryKey = 'finding_id';
    protected $fillable = ['permit_id','check_id','severity','description','status','reported_by','reported_at','resolved_by','resolved_at','resolution_notes'];
    protected $casts = ['reported_at' => 'datetime', 'resolved_at' => 'datetime'];
    public function permit() { return $this->belongsTo(Permit::class, 'permit_id', 'permit_id'); }
    public function reporter() { return $this->belongsTo(User::class, 'reported_by', 'user_id'); }
    public function resolver() { return $this->belongsTo(User::class, 'resolved_by', 'user_id'); }
    // Note: no `reported_by` accessor — it would shadow the FK column and break reporter().
}
