<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('report_submission_id')
                ->nullable()
                ->constrained('report_submissions')
                ->nullOnDelete();

            $table->foreignId('lgu_report_email_id')
                ->nullable()
                ->constrained('lgu_report_emails')
                ->nullOnDelete();

            $table->foreignId('sent_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('recipient_email');

            $table->string('recipient_name')
                ->nullable();

            $table->string('subject');

            $table->longText('message');

            $table->string('status', 30)
                ->default('sent');

            $table->timestamp('sent_at')
                ->nullable();

            $table->text('error_message')
                ->nullable();

            $table->timestamps();

            $table->index(
                ['report_submission_id', 'created_at'],
                'email_logs_submission_created_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};