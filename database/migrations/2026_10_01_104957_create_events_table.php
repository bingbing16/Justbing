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
        Schema::create('events', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('type', 50)
                ->default('event');

            $table->string('subject');

            $table->string('rpo_number')
                ->nullable();

            $table->date('start_date');

            $table->time('start_time')
                ->nullable();

            $table->date('end_date')
                ->nullable();

            $table->time('end_time')
                ->nullable();

            $table->boolean('all_day')
                ->default(false);

            $table->string('location')
                ->nullable();

            $table->string('priority', 20)
                ->default('normal');

            $table->integer('reminder_minutes')
                ->nullable();

            $table->timestamp('reminder_at')
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->string('color', 30)
                ->nullable();

            $table->string('status', 20)
                ->default('scheduled');

            $table->timestamps();

            $table->index([
                'user_id',
                'start_date',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
