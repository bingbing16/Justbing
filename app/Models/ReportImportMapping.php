<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportImportMapping extends Model
{
    protected $fillable = [
        'report_type_id',
        'indicator_id',
        'source_label',
        'source_key',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function reportType(): BelongsTo
    {
        return $this->belongsTo(
            ReportType::class,
            'report_type_id'
        );
    }

    public function indicator(): BelongsTo
    {
        return $this->belongsTo(
            Indicator::class,
            'indicator_id'
        );
    }
}