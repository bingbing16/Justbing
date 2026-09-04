<?php

namespace Modules\Justine\Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ReportType;
use App\Models\ReportSection;
use App\Models\Indicator;

class HWPSCSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | HWPSC Report Type
        |--------------------------------------------------------------------------
        */

        $reportType = ReportType::firstOrCreate(
            ['code' => 'HWPSC'],
            [
                'name' => 'HWPSC',
                'description' => 'HWPSC LGU Quarterly Report',
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | GERIATRIC SCREENING
        |--------------------------------------------------------------------------
        */

        $geriatric = ReportSection::updateOrCreate(
            [
                'report_type_id' => $reportType->id,
                'code' => 'GERIATRIC_SCREENING',
            ],
            [
                'parent_id' => null,
                'name' => 'Geriatric Screening',
                'description' => null,
                'display_order' => 1,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Target for Geriatric Screening
        |--------------------------------------------------------------------------
        */

        Indicator::updateOrCreate(
            [
                'report_section_id' => $geriatric->id,
                'code' => 'GERIATRIC_SCREENING_TARGET',
            ],
            [
                'name' => 'Target for Geriatric Screening (based on the Total Eligible Population)',
                'display_order' => 1,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Screened using the Geriatric Screening Tool
        |--------------------------------------------------------------------------
        */

        $screened = ReportSection::updateOrCreate(
            [
                'report_type_id' => $reportType->id,
                'code' => 'GERIATRIC_SCREENED',
            ],
            [
                'parent_id' => $geriatric->id,
                'name' => 'Screened using the Geriatric Screening Tool',
                'display_order' => 2,
                'is_active' => true,
            ]
        );

        Indicator::updateOrCreate(
            [
                'report_section_id' => $screened->id,
                'code' => 'SENIOR_CITIZENS_SCREENED',
            ],
            [
                'name' => 'Total No. of Senior Citizens Screened',
                'display_order' => 1,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | With at least one Positive (+) Screening
        |--------------------------------------------------------------------------
        */

        $positive = ReportSection::updateOrCreate(
            [
                'report_type_id' => $reportType->id,
                'code' => 'POSITIVE_SCREENING',
            ],
            [
                'parent_id' => $geriatric->id,
                'name' => 'With at least one Positive (+) Screening',
                'display_order' => 3,
                'is_active' => true,
            ]
        );

        Indicator::updateOrCreate(
            [
                'report_section_id' => $positive->id,
                'code' => 'SENIOR_CITIZENS_POSITIVE_SCREENING',
            ],
            [
                'name' => 'Total No. of Senior Citizens with at least one Positive (+) Screening',
                'display_order' => 1,
                'is_active' => true,
            ]
        );

        $positiveIndicators = [
            [
                'code' => 'MEMORY',
                'name' => 'A. Memory',
            ],
            [
                'code' => 'DEPRESSION',
                'name' => 'B. Depression',
            ],
            [
                'code' => 'POLYPHARMACY',
                'name' => 'C. Polypharmacy',
            ],
            [
                'code' => 'URINARY_INCONTINENCE',
                'name' => 'D. Urinary Incontinence',
            ],
            [
                'code' => 'FUNCTIONAL_CAPACITY',
                'name' => 'E. Functional Capacity',
            ],
            [
                'code' => 'FALL',
                'name' => 'F. Fall (History and Screening Test)',
            ],
            [
                'code' => 'MALNUTRITION',
                'name' => 'G. Malnutrition',
            ],
            [
                'code' => 'HEARING',
                'name' => 'H. Hearing',
            ],
            [
                'code' => 'VISION',
                'name' => 'I. Vision',
            ],
        ];

        foreach ($positiveIndicators as $index => $indicator) {
            Indicator::updateOrCreate(
                [
                    'report_section_id' => $positive->id,
                    'code' => $indicator['code'],
                ],
                [
                    'name' => $indicator['name'],
                    'display_order' => $index + 2,
                    'is_active' => true,
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | ICP / REFERRED
        |--------------------------------------------------------------------------
        */

        $icp = ReportSection::updateOrCreate(
            [
                'report_type_id' => $reportType->id,
                'code' => 'ICP_REFERRED',
            ],
            [
                'parent_id' => $geriatric->id,
                'name' => 'Provided with an Individualized Care Plan (ICP) AND/OR Referred to Appropriate Specialist / Service Provider',
                'display_order' => 4,
                'is_active' => true,
            ]
        );

        Indicator::updateOrCreate(
            [
                'report_section_id' => $icp->id,
                'code' => 'SENIOR_CITIZENS_ICP_REFERRED',
            ],
            [
                'name' => 'Total No. of Senior Citizens with ICP AND/OR Referred',
                'display_order' => 1,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | IMMUNIZATION
        |--------------------------------------------------------------------------
        */

        $immunization = ReportSection::updateOrCreate(
            [
                'report_type_id' => $reportType->id,
                'code' => 'IMMUNIZATION',
            ],
            [
                'parent_id' => null,
                'name' => 'Immunization',
                'display_order' => 2,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Senior Citizens Seen
        |--------------------------------------------------------------------------
        */

        Indicator::updateOrCreate(
            [
                'report_section_id' => $immunization->id,
                'code' => 'SENIOR_CITIZENS_SEEN',
            ],
            [
                'name' => 'Total No. of Senior Citizens Seen at the health facility (who availed of any health service)',
                'display_order' => 1,
                'is_active' => true,
            ]
        );

        Indicator::updateOrCreate(
            [
                'report_section_id' => $immunization->id,
                'code' => 'SENIOR_CITIZENS_NOT_PREVIOUSLY_PPV',
            ],
            [
                'name' => 'Total No. of Senior Citizens Seen who had NOT previously received PPV upon reaching 60 years old',
                'display_order' => 2,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Senior Citizens Vaccinated
        |--------------------------------------------------------------------------
        */

        $vaccinated = ReportSection::updateOrCreate(
            [
                'report_type_id' => $reportType->id,
                'code' => 'SENIOR_CITIZENS_VACCINATED',
            ],
            [
                'parent_id' => $immunization->id,
                'name' => 'Senior Citizens Vaccinated',
                'display_order' => 3,
                'is_active' => true,
            ]
        );

        Indicator::updateOrCreate(
            [
                'report_section_id' => $vaccinated->id,
                'code' => 'SENIOR_CITIZENS_VACCINATED_TOTAL',
            ],
            [
                'name' => 'Total No. of Senior Citizens Vaccinated',
                'display_order' => 1,
                'is_active' => true,
            ]
        );

        Indicator::updateOrCreate(
            [
                'report_section_id' => $vaccinated->id,
                'code' => 'ANTI_PNEUMOCOCCAL_VACCINE',
            ],
            [
                'name' => 'Anti-Pneumococcal Vaccine',
                'display_order' => 2,
                'is_active' => true,
            ]
        );

        Indicator::updateOrCreate(
            [
                'report_section_id' => $vaccinated->id,
                'code' => 'ANTI_INFLUENZA_VACCINE',
            ],
            [
                'name' => 'Anti-Influenza Vaccine',
                'display_order' => 3,
                'is_active' => true,
            ]
        );

        Indicator::updateOrCreate(
            [
                'report_section_id' => $vaccinated->id,
                'code' => 'OTHER_VACCINE',
            ],
            [
                'name' => 'Others (Specify)',
                'display_order' => 4,
                'is_active' => true,
            ]
        );
    }
}