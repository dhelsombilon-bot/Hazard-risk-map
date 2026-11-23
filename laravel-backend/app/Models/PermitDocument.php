<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class PermitDocument extends Model {
    protected $primaryKey = 'permit_document_id';
    protected $fillable = ['permit_id','document_type_id','file_path','file_name','document_reference','date_submitted','verification_status','remarks','uploaded_by','uploaded_at'];
    protected $casts = ['date_submitted' => 'date', 'uploaded_at' => 'datetime'];
    public function documentType() { return $this->belongsTo(DocumentType::class, 'document_type_id', 'document_type_id'); }
    public function getDocumentTypeAttribute(): string { return $this->documentType?->document_name ?? ''; }
    public function getIsPresentAttribute(): bool { return !is_null($this->file_path); }
}
