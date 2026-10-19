<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('report_indicator_formulas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_type_id')->constrained('report_types')->cascadeOnDelete();
            $table->foreignId('indicator_id')->constrained('indicators')->cascadeOnDelete();
            $table->string('formula_type', 30)->default('percentage');
            $table->json('expression')->nullable();
            $table->string('display_formula', 1000)->nullable();
            $table->unsignedTinyInteger('decimal_places')->default(2);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['report_type_id', 'indicator_id'], 'rif_report_type_indicator_unique');
            $table->index(['report_type_id', 'is_active'], 'rif_report_type_active_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_indicator_formulas');
    }
};
