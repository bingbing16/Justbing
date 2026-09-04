<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('indicators', function (Blueprint $table) {
            $table->foreignId('report_section_id')
                ->nullable()
                ->after('id')
                ->constrained('report_sections')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('indicators', function (Blueprint $table) {
            $table->dropForeign(['report_section_id']);
            $table->dropColumn('report_section_id');
        });
    }
};