<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportValue extends Model
{
    protected $fillable = [
        'report_submission_id',
        'indicator_id',
        'male',
        'female',
        'total',
    ];

    protected $casts = [
        'male' => 'decimal:2',
        'female' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function reportSubmission(): BelongsTo
    {
        return $this->belongsTo(ReportSubmission::class,'report_submission_id');
    }

    public function indicator(): BelongsTo
    {
        return $this->belongsTo(Indicator::class);
    }
}