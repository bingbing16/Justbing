<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportSubmission extends Model
{
    protected $fillable = [
        'lgu_id',
        'report_type_id',
        'reporting_period_id',
        'status_id',
        'submitted_by',
        'submitted_at',
        'remarks',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function lgu(): BelongsTo
    {
        return $this->belongsTo(Lgu::class);
    }

    public function reportType(): BelongsTo
    {
        return $this->belongsTo(ReportType::class);
    }

    public function reportingPeriod(): BelongsTo
    {
        return $this->belongsTo(ReportingPeriod::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(SubmissionStatus::class,'status_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class,'submitted_by');
    }

    public function reportValues(): HasMany
    {
        return $this->hasMany(ReportValue::class);
    }
}