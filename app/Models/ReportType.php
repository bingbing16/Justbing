<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class ReportType extends Model
{
    protected $fillable = [
        'code',
        'name',
        'slug',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function indicators(): HasMany 
    {
        return $this->hasMany(Indicator::class);
    }

    public function reportSubmissions(): HasMany
    {
        return $this->hasMany(ReportSubmission::class);
    }
    public function sections(): HasMany
    {
        return $this->hasMany(ReportSection::class,'report_type_id')->orderBy('display_order');
    }
    public function formulas(): HasMany
    {
        return $this->hasMany(ReportIndicatorFormula::class);
    }

    public function dashboardSections(): HasMany
    {
        return $this->hasMany(
            DashboardSection::class,
            'report_type_id'
        )->orderBy('display_order');
    }
}
