<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportImportQuarter extends Model
{
    protected $fillable = [
        'report_import_id',
        'report_submission_id',
        'reporting_period_id',
        'quarter_code',
        'status',
        'reason',
    ];

    public function import(): BelongsTo
    {
        return $this->belongsTo(ReportImport::class, 'report_import_id');
    }


    public function reportingPeriod(): BelongsTo
    {
        return $this->belongsTo(
            ReportingPeriod::class,
            'reporting_period_id'
        );
    }

    public function reportImport(): BelongsTo
    {
        return $this->belongsTo(
            ReportImport::class,
            'report_import_id'
        );
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(
            ReportSubmission::class,
            'report_submission_id'
        );
    }

    public function changes(): HasMany
    {
        return $this->hasMany(
            ReportImportChange::class,
            'report_import_quarter_id'
        );
    }
}