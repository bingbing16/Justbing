<?php

namespace Database\Seeders;

use App\Models\Indicator;
use App\Models\ReportImportMapping;
use App\Models\ReportType;
use Illuminate\Database\Seeder;

class ReportImportMappingSeeder extends Seeder
{
    public function run(): void
    {
        $reportType = ReportType::query()
            ->where('code', 'HWPSC')
            ->firstOrFail();

        $mappings = [
            'GERIATRIC_SCREENING_TARGET' => 'Target or Geriatric Screening (based on Total Eligible Population)',

            'SENIOR_CITIZENS_SCREENED' => 'Total No. of Senior Citizens Screened',

            'SENIOR_CITIZENS_POSITIVE_SCREENING' => 'Total No. of Senior Citizens with at least one Positive (+) Screening',

            'MEMORY' => 'A. Memory',

            'DEPRESSION' => 'B. Depression',

            'POLYPHARMACY' => 'C. Polypharmacy',

            'URINARY_INCONTINENCE' => 'D. Urinary Incontinence',

            'FUNCTIONAL_CAPACITY' => 'E. Functional Capacity',

            'FALL' => 'F. Fall (History and Screening Test)',

            'MALNUTRITION' => 'G. Malnutrition',

            'HEARING' => 'H. Hearing',

            'VISION' => 'I. Vision',

            'SENIOR_CITIZENS_ICP_REFERRED' => 'Total No. of Senior Citizens with ICP AND/OR Referred',

            'SENIOR_CITIZENS_SEEN' => 'Total No. of Senior Citizens Seen at the health facility (who availed of any health service) *Seen does NOT equal Visits',

            'SENIOR_CITIZENS_NOT_PREVIOUSLY_PPV' => 'Total No. of Senior Citizens Seen who had NOT previously received PPV upon reaching 60 years old',

            'SENIOR_CITIZENS_VACCINATED_TOTAL' => 'Total No. of Senior Citizens Vaccinated',

            'ANTI_PNEUMOCOCCAL_VACCINE' => 'Anti-Pneumococcal Vaccine',

            'ANTI_INFLUENZA_VACCINE' => 'Anti-Influenza Vaccine',

            'OTHER_VACCINE' => 'Others (Specify:______)',
        ];

        foreach ($mappings as $indicatorCode => $sourceLabel) {
            $indicator = Indicator::query()
                ->where('code', $indicatorCode)
                ->whereHas('section', function ($query) use ($reportType) {
                    $query->where(
                        'report_type_id',
                        $reportType->id
                    );
                })
                ->first();

            if (!$indicator) {
                continue;
            }

            ReportImportMapping::updateOrCreate(
                [
                    'report_type_id' => $reportType->id,
                    'indicator_id' => $indicator->id,
                ],
                [
                    'source_label' => $sourceLabel,
                    'source_key' => $indicatorCode,
                    'is_active' => true,
                ]
            );
        }
    }
}