<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_sections', function (Blueprint $table) {
            $table->id();

            $table->foreignId('report_type_id')
                ->constrained('report_types')
                ->cascadeOnDelete();

            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('report_sections')
                ->nullOnDelete();

            $table->string('code', 100);

            $table->string('name');

            $table->text('description')
                ->nullable();

            $table->unsignedInteger('display_order')
                ->default(0);

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->unique(
                ['report_type_id', 'code'],
                'rs_report_type_code_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_sections');
    }
};