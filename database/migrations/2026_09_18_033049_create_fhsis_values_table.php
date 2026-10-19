<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fhsis_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fhsis_report_id')->constrained('fhsis_reports')->cascadeOnDelete();
            $table->foreignId('lgu_id')->constrained('lgus')->cascadeOnDelete();
            $table->foreignId('indicator_id')->constrained('indicators')->cascadeOnDelete();
            $table->string('psgc_code', 30)->nullable();
            $table->decimal('male', 12, 2)->default(0);
            $table->decimal('female', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->timestamps();

            $table->unique(['fhsis_report_id', 'lgu_id', 'indicator_id'], 'fhsis_value_report_lgu_indicator_unique');
            $table->index(['lgu_id', 'indicator_id'], 'fhsis_value_lgu_indicator_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fhsis_values');
    }
};
