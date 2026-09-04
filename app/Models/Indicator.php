<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Indicator extends Model
{
    protected $fillable = [
        'report_section_id',
        'code',
        'name',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'display_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(
            ReportSection::class,
            'report_section_id'
        );
    }

    public function reportValues(): HasMany
    {
        return $this->hasMany(
            ReportValue::class,
            'indicator_id'
        );
    }
}