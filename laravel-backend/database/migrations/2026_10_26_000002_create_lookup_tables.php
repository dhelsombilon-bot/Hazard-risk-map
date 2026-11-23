<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('barangays', function (Blueprint $table) {
            $table->id('barangay_id');
            $table->string('barangay_name', 100)->unique();
            $table->timestamps();
        });

        Schema::create('building_types', function (Blueprint $table) {
            $table->id('building_type_id');
            $table->string('type_name', 100)->unique();
            $table->timestamps();
        });

        Schema::create('building_statuses', function (Blueprint $table) {
            $table->id('building_status_id');
            $table->string('status_name', 100)->unique();
            $table->timestamps();
        });

        Schema::create('permit_types', function (Blueprint $table) {
            $table->id('permit_type_id');
            $table->string('type_name', 100)->unique();
            $table->timestamps();
        });

        Schema::create('permit_statuses', function (Blueprint $table) {
            $table->id('permit_status_id');
            $table->string('status_name', 100)->unique();
            $table->timestamps();
        });

        Schema::create('document_types', function (Blueprint $table) {
            $table->id('document_type_id');
            $table->string('document_name', 100)->unique();
            $table->boolean('is_required')->default(true);
            $table->timestamps();
        });

        Schema::create('hazard_types', function (Blueprint $table) {
            $table->id('hazard_type_id');
            $table->string('hazard_name', 100)->unique();
            $table->timestamps();
        });

        Schema::create('hazard_levels', function (Blueprint $table) {
            $table->id('hazard_level_id');
            $table->string('level_name', 100)->unique();
            $table->string('color_code', 20)->nullable();
            $table->unsignedTinyInteger('severity_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hazard_levels');
        Schema::dropIfExists('hazard_types');
        Schema::dropIfExists('document_types');
        Schema::dropIfExists('permit_statuses');
        Schema::dropIfExists('permit_types');
        Schema::dropIfExists('building_statuses');
        Schema::dropIfExists('building_types');
        Schema::dropIfExists('barangays');
    }
};
