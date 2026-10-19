<?php

namespace Modules\Justine\Database\Seeders;

use App\Models\FhsisImportMapping;
use App\Models\Indicator;
use App\Models\ReportType;
use Illuminate\Database\Seeder;

class FhsisImportMappingSeeder extends Seeder
{
    public function run(): void
    {
        $reportType = ReportType::where('code', 'HWPSC')->firstOrFail();

        $maps = [
            'SENIOR_CITIZENS_SCREENED' => ['1. SCs screened using the Geriatric Screening Tool', 4, 5],
            'MEMORY' => ['2. Positive Geriatric Screening [Memory]', 8, 9],
            'DEPRESSION' => ['2. Positive Geriatric Screening [Depression]', 12, 13],
            'POLYPHARMACY' => ['2. Positive Geriatric Screening [Polypharmacy]', 16, 17],
            'URINARY_INCONTINENCE' => ['2. Positive Geriatric Screening [Urinary Incontinence]', 20, 21],
            'FUNCTIONAL_CAPACITY' => ['2. Positive Geriatric Screening [Functional Capacity]', 24, 25],
            'MALNUTRITION' => ['2. Positive Geriatric Screening [Malnutrition]', 28, 29],
            'HEARING' => ['2. Positive Geriatric Screening [Hearing]', 32, 33],
            'VISION' => ['2. Positive Geriatric Screening [Vision]', 36, 37],
            'FALL' => ['2. Positive Geriatric Screening [Fall Risk]', 40, 41],
            'SENIOR_CITIZENS_POSITIVE_SCREENING' => ['2. With at least one Positive Geriatric Screening', 44, 45],
            'SENIOR_CITIZENS_ICP_REFERRED' => ['3. Provided with a care plan or referred', 48, 49],
        ];

        foreach ($maps as $code => [$label, $maleColumn, $femaleColumn]) {
            $indicator = Indicator::where('code', $code)->whereHas('section', fn ($q) => $q->where('report_type_id', $reportType->id))->first();
            if (!$indicator) continue;

            FhsisImportMapping::updateOrCreate(
                ['report_type_id' => $reportType->id, 'indicator_id' => $indicator->id],
                [
                    'source_label' => $label,
                    'source_key' => $code,
                    'male_column' => $maleColumn,
                    'female_column' => $femaleColumn,
                    'is_active' => true,
                ]
            );
        }
    }
}
