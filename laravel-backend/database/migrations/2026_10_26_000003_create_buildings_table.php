<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('buildings', function (Blueprint $table) {
            $table->id('building_id');
            $table->string('building_code', 20)->unique();
            $table->string('building_name');
            $table->foreignId('building_type_id')->constrained('building_types', 'building_type_id');
            $table->foreignId('building_status_id')->constrained('building_statuses', 'building_status_id');
            $table->foreignId('barangay_id')->constrained('barangays', 'barangay_id');
            $table->string('street_address')->nullable();
            $table->string('managing_office')->nullable();
            $table->smallInteger('year_built')->nullable();
            $table->text('description')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('elevation_m', 8, 2)->nullable();
            $table->string('coordinate_source', 50)->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('building_hazard_assessments', function (Blueprint $table) {
            $table->id('hazard_assessment_id');
            $table->foreignId('building_id')->constrained('buildings', 'building_id')->cascadeOnDelete();
            $table->foreignId('hazard_type_id')->constrained('hazard_types', 'hazard_type_id');
            $table->string('hazard_level', 50);
            $table->string('dataset_name')->nullable();
            $table->date('assessment_date')->nullable();
            $table->text('assessment_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('building_landscape_features', function (Blueprint $table) {
            $table->id('assessment_id');
            $table->foreignId('building_id')->constrained('buildings', 'building_id')->cascadeOnDelete();
            $table->string('feature_name');
            $table->string('feature_type', 100)->nullable();
            $table->integer('distance_m')->nullable();
            $table->text('assessment_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('building_activity_logs', function (Blueprint $table) {
            $table->id('log_id');
            $table->foreignId('building_id')->constrained('buildings', 'building_id')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->string('action');
            $table->string('entity_type', 50)->default('building');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('building_activity_logs');
        Schema::dropIfExists('building_landscape_features');
        Schema::dropIfExists('building_hazard_assessments');
        Schema::dropIfExists('buildings');
    }
};
