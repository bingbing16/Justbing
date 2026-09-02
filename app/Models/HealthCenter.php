<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HealthCenter extends Model
{
    protected $fillable = [
        'lgu_id',
        'name',
        'code',
        'is_active',
    ];

    public function lgu(): BelongsTo
    {
        return $this->belongsTo(Lgu::class);
    }
}
