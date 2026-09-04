<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportSection extends Model
{
    protected $fillable = [
        'report_type_id',
        'parent_id',
        'code',
        'name',
        'description',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'display_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function reportType(): BelongsTo
    {
        return $this->belongsTo(
            ReportType::class,
            'report_type_id'
        );
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(
            ReportSection::class,
            'parent_id'
        );
    }

    public function children(): HasMany
    {
        return $this->hasMany(
            ReportSection::class,
            'parent_id'
        )->orderBy('display_order');
    }

    public function indicators(): HasMany
    {
        return $this->hasMany(
            Indicator::class,
            'report_section_id'
        )->orderBy('display_order');
    }
}