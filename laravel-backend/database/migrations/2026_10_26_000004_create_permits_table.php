<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('permits', function (Blueprint $table) {
            $table->id('permit_id');
            $table->string('permit_number', 50)->unique();
            $table->foreignId('building_id')->constrained('buildings', 'building_id');
            $table->foreignId('permit_type_id')->constrained('permit_types', 'permit_type_id');
            $table->foreignId('permit_status_id')->constrained('permit_statuses', 'permit_status_id');
            $table->date('issue_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('issuing_authority')->nullable();
            $table->decimal('permit_fee_amount', 12, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('permit_documents', function (Blueprint $table) {
            $table->id('permit_document_id');
            $table->foreignId('permit_id')->constrained('permits', 'permit_id')->cascadeOnDelete();
            $table->foreignId('document_type_id')->constrained('document_types', 'document_type_id');
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('document_reference', 100)->nullable();
            $table->date('date_submitted')->nullable();
            $table->string('verification_status', 50)->default('Pending');
            $table->text('remarks')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamps();
        });

        Schema::create('permit_compliance_checks', function (Blueprint $table) {
            $table->id('check_id');
            $table->foreignId('permit_id')->constrained('permits', 'permit_id')->cascadeOnDelete();
            $table->string('check_type', 100)->nullable();
            $table->string('result', 50)->default('Pending');
            $table->foreignId('checked_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->timestamp('checked_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('permit_findings', function (Blueprint $table) {
            $table->id('finding_id');
            $table->foreignId('permit_id')->constrained('permits', 'permit_id')->cascadeOnDelete();
            $table->foreignId('check_id')->nullable()->constrained('permit_compliance_checks', 'check_id')->nullOnDelete();
            $table->string('severity', 50)->default('Minor');
            $table->text('description');
            $table->string('status', 50)->default('Open');
            $table->foreignId('reported_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->timestamp('reported_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permit_findings');
        Schema::dropIfExists('permit_compliance_checks');
        Schema::dropIfExists('permit_documents');
        Schema::dropIfExists('permits');
    }
};
