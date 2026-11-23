<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class DocumentType extends Model {
    protected $primaryKey = 'document_type_id';
    protected $fillable = ['document_name','is_required'];
    protected $casts = ['is_required' => 'boolean'];
}
