<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FhsisImportMapping extends Model
{
    protected $fillable = [
        'report_type_id', 'indicator_id', 'source_label', 'source_key',
        'male_column', 'female_column', 'is_active',
    ];

    protected $casts = [
        'male_column' => 'integer', 'female_column' => 'integer', 'is_active' => 'boolean',
    ];

    public function reportType(): BelongsTo { return $this->belongsTo(ReportType::class); }
    public function indicator(): BelongsTo { return $this->belongsTo(Indicator::class); }
}
