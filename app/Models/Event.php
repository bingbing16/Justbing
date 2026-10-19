<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Event extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'subject',
        'rpo_number',
        'start_date',
        'start_time',
        'end_date',
        'end_time',
        'all_day',
        'location',
        'priority',
        'reminder_minutes',
        'reminder_at',
        'notes',
        'color',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'all_day' => 'boolean',
        'reminder_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}