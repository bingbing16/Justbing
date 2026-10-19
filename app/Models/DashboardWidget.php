<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DashboardWidget extends \Illuminate\Database\Eloquent\Model
{
    protected $fillable = [
        'dashboard_section_id', 'type', 'key', 'title', 'description',
        'config', 'display_order', 'is_active',
    ];

    protected $casts = [
        'config' => 'array',
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(DashboardSection::class, 'dashboard_section_id');
    }
}
