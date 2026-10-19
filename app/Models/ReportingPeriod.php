<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportingPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'year',
        'quarter_id',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'year' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function quarter(): BelongsTo
    {
        return $this->belongsTo(Quarter::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(
            ReportSubmission::class
        );
    }
}