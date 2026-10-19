<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_types', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('code');
        });

        // Populate existing report types.
        // DB::table('report_types')
        //     ->where('code', 'HWPSC')
        //     ->update([
        //         'slug' => 'hwpsc',
        //     ]);

        // Add slugs for the other existing report types.
        // Example:
        //
        // DB::table('report_types')
        //     ->where('code', 'OTHER')
        //     ->update(['slug' => 'other']);

        Schema::table('report_types', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('report_types', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};