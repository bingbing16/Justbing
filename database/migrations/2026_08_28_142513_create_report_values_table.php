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
        Schema::create('report_values', function (Blueprint $table) {
            $table->id(); 
            $table->foreignId('report_submission_id')->constrained('report_submissions')->cascadeOnDelete(); 
            $table->foreignId('indicator_id')->constrained('indicators')->cascadeOnDelete(); 
            $table->decimal('male', 12, 2)->default(0); 
            $table->decimal('female', 12, 2)->default(0); 
            $table->decimal('total', 12, 2)->default(0); 
            $table->timestamps(); 
            $table->unique([ 'report_submission_id','indicator_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_values');
    }
};
