<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reporting_periods', function (Blueprint $table) {
            $table->id();

            $table->unsignedSmallInteger('year');

            $table->foreignId('quarter_id')
                ->constrained('quarters')
                ->restrictOnDelete();

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->timestamps();

            $table->unique(
                ['year', 'quarter_id'],
                'reporting_period_year_quarter_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reporting_periods');
    }
};