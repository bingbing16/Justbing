<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DashboardSection extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = [
        'report_type_id', 'code', 'name', 'description', 'display_order', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean', 'display_order' => 'integer'];

    public function reportType(): BelongsTo
    {
        return $this->belongsTo(ReportType::class);
    }

    public function widgets(): HasMany
    {
        return $this->hasMany(DashboardWidget::class)->orderBy('display_order');
    }
}
