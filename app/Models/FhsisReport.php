<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FhsisReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_type_id',
        'quarter_id',
        'year',
        'version',
        'is_current',
        'file_name',
        'file_extension',
        'file_size',
        'imported_by',
        'imported_at',
        'superseded_at',
    ];

    protected $casts = [
        'year' => 'integer',
        'version' => 'integer',
        'is_current' => 'boolean',
        'file_size' => 'integer',
        'imported_at' => 'datetime',
        'superseded_at' => 'datetime',
    ];

    public function reportType(): BelongsTo { return $this->belongsTo(ReportType::class); }
    public function quarter(): BelongsTo { return $this->belongsTo(Quarter::class); }
    public function importer(): BelongsTo { return $this->belongsTo(User::class, 'imported_by'); }
    public function values(): HasMany { return $this->hasMany(FhsisValue::class); }
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }
}
