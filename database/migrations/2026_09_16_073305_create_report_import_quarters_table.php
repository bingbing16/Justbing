<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_import_quarters', function (Blueprint $table) {
            $table->id();

            $table->foreignId('report_import_id')
                ->constrained('report_imports')
                ->cascadeOnDelete();

            $table->foreignId('report_submission_id')
                ->nullable()
                ->constrained('report_submissions')
                ->nullOnDelete();

            $table->foreignId('reporting_period_id')
                ->nullable()
                ->constrained('reporting_periods')
                ->nullOnDelete();

            $table->string('quarter_code', 10);

            $table->string('status', 30);
            /*
             * new
             * updated
             * unchanged
             * blocked
             * no_data
             */

            $table->text('reason')->nullable();

            $table->timestamps();

            $table->index(
                ['report_import_id', 'quarter_code'],
                'riq_import_quarter_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_import_quarters');
    }
};