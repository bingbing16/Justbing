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
        Schema::create('reporting_periods', function (Blueprint $table) {
            $table->id();

            $table->unsignedSmallInteger('year');

            $table->foreignId('quarter_id')->constrained('quarters')->restrictOnDelete();

            $table->date('start_date');
            $table->date('end_date');

            $table->timestamps();

            $table->unique(['year', 'quarter_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reporting_periods');
    }
};
