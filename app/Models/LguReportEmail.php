<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LguReportEmail extends Model
{
    protected $fillable = [
        'lgu_id',
        'report_type_id',
        'email',
        'contact_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function lgu(): BelongsTo
    {
        return $this->belongsTo(Lgu::class);
    }

    public function reportType(): BelongsTo
    {
        return $this->belongsTo(ReportType::class);
    }
}