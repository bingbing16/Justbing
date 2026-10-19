<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_validation_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_submission_id')
                ->constrained('report_submissions')
                ->cascadeOnDelete();
            $table->foreignId('fhsis_report_id')
                ->nullable()
                ->constrained('fhsis_reports')
                ->nullOnDelete();
            $table->string('validation_status', 30);
            $table->foreignId('validated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->text('remarks')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();

            $table->index(
                ['report_submission_id', 'created_at'],
                'rvh_submission_created_idx'
            );
            $table->index(
                ['fhsis_report_id', 'validation_status'],
                'rvh_fhsis_status_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_validation_histories');
    }
};
