<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lgu extends Model
{
    protected $fillable = [
        'name',
        'code',
        'province',
        'municipality',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];


    public function healthCenters(): HasMany
    {
        return $this->hasMany(HealthCenter::class);
    }
    public function reportSubmissions(): HasMany
    {
        return $this->hasMany(ReportSubmission::class);
    }
    public function reportEmails(): HasMany
    {
        return $this->hasMany(LguReportEmail::class);
    }
    public function activeReportEmails(): HasMany
    {
        return $this->hasMany(LguReportEmail::class)
            ->where('is_active', true);
    }
    }
