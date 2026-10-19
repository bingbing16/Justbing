<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportValidationHistory extends Model
{
    protected $fillable = [
        'report_submission_id',
        'fhsis_report_id',
        'validation_status',
        'validated_by',
        'validated_at',
        'remarks',
        'details',
    ];

    protected $casts = [
        'validated_at' => 'datetime',
        'details' => 'array',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(ReportSubmission::class, 'report_submission_id');
    }

    public function fhsisReport(): BelongsTo
    {
        return $this->belongsTo(FhsisReport::class, 'fhsis_report_id');
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}