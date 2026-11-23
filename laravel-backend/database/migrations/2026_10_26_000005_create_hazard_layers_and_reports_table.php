<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hazard_layers', function (Blueprint $table) {
            $table->id('layer_id');
            $table->foreignId('hazard_type_id')->constrained('hazard_types', 'hazard_type_id');
            $table->string('dataset_name');
            $table->string('source_agency')->nullable();
            $table->year('data_year')->nullable();
            $table->longText('geojson')->nullable();
            $table->string('file_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->id('report_id');
            $table->string('report_type', 100);
            $table->foreignId('generated_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->timestamp('generated_at')->useCurrent();
            $table->string('file_path')->nullable();
            $table->string('file_url')->nullable();
            $table->json('parameters')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
        Schema::dropIfExists('hazard_layers');
    }
};
