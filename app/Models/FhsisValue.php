<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FhsisValue extends Model
{
    protected $fillable = [
        'fhsis_report_id', 'lgu_id', 'indicator_id', 'psgc_code', 'male', 'female', 'total',
    ];

    protected $casts = [
        'male' => 'decimal:2', 'female' => 'decimal:2', 'total' => 'decimal:2',
    ];

    public function report(): BelongsTo { return $this->belongsTo(FhsisReport::class, 'fhsis_report_id'); }
    public function lgu(): BelongsTo { return $this->belongsTo(Lgu::class); }
    public function indicator(): BelongsTo { return $this->belongsTo(Indicator::class); }
}
