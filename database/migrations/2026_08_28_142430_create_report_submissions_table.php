<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('report_submissions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('lgu_id')->constrained('lgus')->cascadeOnDelete();

            $table->foreignId('report_type_id')->constrained('report_types')->restrictOnDelete();

            $table->foreignId('reporting_period_id')->constrained('reporting_periods')->restrictOnDelete();

            $table->foreignId('status_id')->constrained('submission_statuses')->restrictOnDelete();

            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('submitted_at')->nullable();
            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->unique( ['lgu_id', 'report_type_id', 'reporting_period_id'],'submission_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_submissions');
    }
};
