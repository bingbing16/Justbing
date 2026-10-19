<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_import_changes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('report_import_id')
                ->constrained('report_imports')
                ->cascadeOnDelete();

            $table->foreignId('report_import_quarter_id')
                ->nullable()
                ->constrained('report_import_quarters')
                ->cascadeOnDelete();

            $table->foreignId('report_submission_id')
                ->nullable()
                ->constrained('report_submissions')
                ->nullOnDelete();

            $table->foreignId('indicator_id')
                ->nullable()
                ->constrained('indicators')
                ->nullOnDelete();

            $table->string('indicator_code')->nullable();
            $table->string('indicator_name');

            $table->decimal('old_male', 12, 2)->nullable();
            $table->decimal('old_female', 12, 2)->nullable();
            $table->decimal('old_total', 12, 2)->nullable();

            $table->decimal('new_male', 12, 2)->nullable();
            $table->decimal('new_female', 12, 2)->nullable();
            $table->decimal('new_total', 12, 2)->nullable();

            $table->string('status', 30);
            /*
             * changed
             * blocked
             */

            $table->text('reason')->nullable();

            $table->timestamps();

            $table->index(
                ['report_import_id', 'report_import_quarter_id'],
                'ric_import_quarter_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_import_changes');
    }
};