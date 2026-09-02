<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubmissionStatus extends Model
{
    protected $fillable = [
        'code',
        'name',
        'sort_order',
        'is_active',
    ];

    public function reportSubmissions(): HasMany
    {
        return $this->hasMany(ReportSubmission::class,'status_id');
    }
}