<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportImport extends Model
{
    protected $fillable = [
        'user_id',
        'lgu_id',
        'report_type_id',
        'year',
        'file_name',
        'file_extension',
        'file_size',
        'new_quarters_count',
        'updated_quarters_count',
        'unchanged_quarters_count',
        'blocked_quarters_count',
        'changed_indicators_count',
        'blocked_changes_count',
    ];

    protected $casts = [
        'year' => 'integer',
        'file_size' => 'integer',
        'new_quarters_count' => 'integer',
        'updated_quarters_count' => 'integer',
        'unchanged_quarters_count' => 'integer',
        'blocked_quarters_count' => 'integer',
        'changed_indicators_count' => 'integer',
        'blocked_changes_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lgu(): BelongsTo
    {
        return $this->belongsTo(Lgu::class);
    }

    public function reportType(): BelongsTo
    {
        return $this->belongsTo(ReportType::class);
    }

    public function quarters(): HasMany
    {
        return $this->hasMany(
            ReportImportQuarter::class,
            'report_import_id'
        );
    }

    public function changes(): HasMany
    {
        return $this->hasMany(ReportImportChange::class);
    }
}