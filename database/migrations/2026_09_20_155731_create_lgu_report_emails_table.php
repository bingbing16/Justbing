<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lgu_report_emails', function (Blueprint $table) {
            $table->id();

            $table->foreignId('lgu_id')
                ->constrained('lgus')
                ->cascadeOnDelete();

            $table->foreignId('report_type_id')
                ->constrained('report_types')
                ->cascadeOnDelete();

            $table->string('email');

            $table->string('contact_name')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->unique(
                ['lgu_id', 'report_type_id', 'email'],
                'lgu_report_email_unique'
            );

            $table->index(
                ['lgu_id', 'report_type_id'],
                'lgu_report_email_type_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lgu_report_emails');
    }
};