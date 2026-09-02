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
        Schema::create('indicators', function (Blueprint $table) {
            $table->id(); 
            $table->foreignId('report_type_id')->constrained()->cascadeOnDelete(); 
            $table->string('code'); 
            $table->string('name'); 
            $table->integer('display_order')->default(0); 
            $table->boolean('is_active')->default(true); 
            $table->timestamps(); 
            $table->unique(['report_type_id','code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('indicators');
    }
};
