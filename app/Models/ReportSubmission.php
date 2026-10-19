<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\ReportingPeriod;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

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

        'validation_status',
        'validated_at',
        'validated_by',
        'validation_remarks',
        'validation_details',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'validated_at' => 'datetime',
        'validation_details' => 'array',
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
        return $this->belongsTo(ReportingPeriod::class, 'reporting_period_id');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(SubmissionStatus::class, 'status_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function values(): HasMany
    {
        return $this->hasMany(ReportValue::class, 'report_submission_id');
    }

    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}