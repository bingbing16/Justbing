<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fhsis_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_type_id')->constrained('report_types')->restrictOnDelete();
            $table->foreignId('quarter_id')->constrained('quarters')->restrictOnDelete();
            $table->unsignedSmallInteger('year');
            $table->string('file_name');
            $table->string('file_extension', 10)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('imported_at')->nullable();
            $table->timestamps();

            $table->unique(['report_type_id', 'year', 'quarter_id'], 'fhsis_report_type_year_quarter_unique');
            $table->index(['year', 'quarter_id'], 'fhsis_year_quarter_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fhsis_reports');
    }
};
