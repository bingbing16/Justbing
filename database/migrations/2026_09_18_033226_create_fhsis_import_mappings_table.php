<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fhsis_import_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_type_id')->constrained('report_types')->cascadeOnDelete();
            $table->foreignId('indicator_id')->constrained('indicators')->cascadeOnDelete();
            $table->string('source_label');
            $table->string('source_key', 100)->nullable();
            $table->unsignedTinyInteger('male_column')->nullable();
            $table->unsignedTinyInteger('female_column')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['report_type_id', 'indicator_id'], 'fim_report_type_indicator_unique');
            $table->index(['report_type_id', 'source_label'], 'fim_report_type_source_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fhsis_import_mappings');
    }
};
