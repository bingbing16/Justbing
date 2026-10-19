<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dashboard_widgets', function (Blueprint $table) {
            $table->string('layout')
                ->default('default')
                ->after('config');

            $table->unsignedInteger('col_span')
                ->default(1)
                ->after('layout');
        });
    }

    public function down(): void
    {
        Schema::table('dashboard_widgets', function (Blueprint $table) {
            $table->dropColumn([
                'layout',
                'col_span',
            ]);
        });
    }
};