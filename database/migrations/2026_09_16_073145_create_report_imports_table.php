<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_imports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('lgu_id')
                ->nullable()
                ->constrained('lgus')
                ->nullOnDelete();

            $table->foreignId('report_type_id')
                ->nullable()
                ->constrained('report_types')
                ->nullOnDelete();

            $table->unsignedSmallInteger('year');

            $table->string('file_name');
            $table->string('file_extension', 10)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();

            $table->unsignedInteger('new_quarters_count')->default(0);
            $table->unsignedInteger('updated_quarters_count')->default(0);
            $table->unsignedInteger('unchanged_quarters_count')->default(0);
            $table->unsignedInteger('blocked_quarters_count')->default(0);

            $table->unsignedInteger('changed_indicators_count')->default(0);
            $table->unsignedInteger('blocked_changes_count')->default(0);

            $table->timestamps();

            $table->index(['lgu_id', 'year']);
            $table->index(['report_type_id', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_imports');
    }
};