<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportType extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active',
    ];

    public function indicators(): HasMany 
    {
        return $this->hasMany(indicators::class);
    }

    public function reportSubmissions(): HasMany
    {
        return $this->hasMany(ReportSubmission::class);
    }
    public function sections(): HasMany
    {
        return $this->hasMany(ReportSection::class,'report_type_id')->orderBy('display_order');
    }
}
