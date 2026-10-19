<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fhsis_reports', function (Blueprint $table) {
            $table->unsignedInteger('version')
                ->default(1)
                ->after('quarter_id');

            $table->boolean('is_current')
                ->default(true)
                ->after('version');

            $table->timestamp('superseded_at')
                ->nullable()
                ->after('imported_at');

            $table->index(
                ['report_type_id', 'year', 'quarter_id', 'is_current'],
                'fhsis_current_report_idx'
            );

            $table->unique(
                ['report_type_id', 'year', 'quarter_id', 'version'],
                'fhsis_report_version_unique'
            );
        });

        Schema::table('fhsis_reports', function (Blueprint $table) {
            $table->dropUnique(
                'fhsis_report_type_year_quarter_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('fhsis_reports', function (Blueprint $table) {
            $table->dropUnique(
                'fhsis_report_version_unique'
            );

            $table->dropIndex(
                'fhsis_current_report_idx'
            );

            $table->dropColumn([
                'version',
                'is_current',
                'superseded_at',
            ]);
        });

        Schema::table('fhsis_reports', function (Blueprint $table) {
            $table->unique(
                ['report_type_id', 'year', 'quarter_id'],
                'fhsis_report_type_year_quarter_unique'
            );
        });
    }
};