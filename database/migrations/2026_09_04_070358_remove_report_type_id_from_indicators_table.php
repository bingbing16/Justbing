<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('indicators', function (Blueprint $table) {
            // Remove old foreign key
            $table->dropForeign(['report_type_id']);

            // Remove old unique index
            $table->dropUnique(
                'indicators_report_type_id_code_unique'
            );

            // Remove old column
            $table->dropColumn('report_type_id');

            // New unique constraint
            $table->unique(
                ['report_section_id', 'code'],
                'indicator_section_code_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('indicators', function (Blueprint $table) {
            $table->foreignId('report_type_id')
                ->nullable()
                ->after('id')
                ->constrained('report_types')
                ->cascadeOnDelete();

            $table->dropUnique(
                'indicator_section_code_unique'
            );

            $table->unique(
                ['report_type_id', 'code'],
                'indicators_report_type_id_code_unique'
            );
        });
    }
};