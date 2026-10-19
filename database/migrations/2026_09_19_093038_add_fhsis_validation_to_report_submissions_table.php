<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_submissions', function (Blueprint $table) {
            $table->string('validation_status', 30)
                ->default('not_checked')
                ->after('status_id');

            $table->timestamp('validated_at')
                ->nullable()
                ->after('validation_status');

            $table->foreignId('validated_by')
                ->nullable()
                ->after('validated_at')
                ->constrained('users')
                ->nullOnDelete();

            $table->text('validation_remarks')
                ->nullable()
                ->after('validated_by');

            $table->index(
                ['validation_status', 'reporting_period_id'],
                'rs_validation_period_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('report_submissions', function (Blueprint $table) {
            $table->dropIndex('rs_validation_period_idx');

            $table->dropForeign(['validated_by']);

            $table->dropColumn([
                'validation_status',
                'validated_at',
                'validated_by',
                'validation_remarks',
            ]);
        });
    }
};