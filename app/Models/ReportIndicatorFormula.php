<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportIndicatorFormula extends Model
{
    protected $fillable = [
        'report_type_id','indicator_id','formula_type','expression',
        'display_formula','decimal_places','is_active','created_by','updated_by',
    ];

    protected $casts = [
        'expression' => 'array',
        'decimal_places' => 'integer',
        'is_active' => 'boolean',
    ];

    public function reportType(): BelongsTo { return $this->belongsTo(ReportType::class); }
    public function indicator(): BelongsTo { return $this->belongsTo(Indicator::class); }
}
