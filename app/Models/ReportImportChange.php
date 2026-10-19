<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportImportChange extends Model
{
    protected $fillable = [
        'report_import_id',
        'report_import_quarter_id',
        'report_submission_id',
        'indicator_id',
        'indicator_code',
        'indicator_name',
        'old_male',
        'old_female',
        'old_total',
        'new_male',
        'new_female',
        'new_total',
        'status',
        'reason',
    ];

    protected $casts = [
        'old_male' => 'decimal:2',
        'old_female' => 'decimal:2',
        'old_total' => 'decimal:2',
        'new_male' => 'decimal:2',
        'new_female' => 'decimal:2',
        'new_total' => 'decimal:2',
    ];

    public function import(): BelongsTo
    {
        return $this->belongsTo(ReportImport::class, 'report_import_id');
    }

    public function quarter(): BelongsTo
    {
        return $this->belongsTo(
            ReportImportQuarter::class,
            'report_import_quarter_id'
        );
    }

    public function importQuarter(): BelongsTo
    {
        return $this->belongsTo(
            ReportImportQuarter::class,
            'report_import_quarter_id'
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