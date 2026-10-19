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
        | Report Type
        |--------------------------------------------------------------------------
        */

        $reportType = ReportType::updateOrCreate(
            ['code' => 'HWPSC'],
            [
                'name' => 'HWPSC',
                'description' => 'Health and Wellness Program for Senior Citizens',
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Sections
        |--------------------------------------------------------------------------
        */

        $geriatricScreening = ReportSection::updateOrCreate(
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

        $screened = ReportSection::updateOrCreate(
            [
                'report_type_id' => $reportType->id,
                'code' => 'SCREENED',
            ],
            [
                'parent_id' => $geriatricScreening->id,
                'name' => 'Screened using the Geriatric Screening Tool',
                'description' => null,
                'display_order' => 1,
                'is_active' => true,
            ]
        );

        $positiveScreening = ReportSection::updateOrCreate(
            [
                'report_type_id' => $reportType->id,
                'code' => 'POSITIVE_SCREENING',
            ],
            [
                'parent_id' => $geriatricScreening->id,
                'name' => 'With atleast one Positive (+) Screening',
                'description' => null,
                'display_order' => 2,
                'is_active' => true,
            ]
        );

        $icpReferred = ReportSection::updateOrCreate(
            [
                'report_type_id' => $reportType->id,
                'code' => 'ICP_REFERRED',
            ],
            [
                'parent_id' => $geriatricScreening->id,
                'name' => 'Provided with an Individualized Care Plan (ICP) AND/OR Referred to Appropriate Specialist / Service Provider',
                'description' => null,
                'display_order' => 3,
                'is_active' => true,
            ]
        );

        $immunization = ReportSection::updateOrCreate(
            [
                'report_type_id' => $reportType->id,
                'code' => 'IMMUNIZATION',
            ],
            [
                'parent_id' => null,
                'name' => 'Immunization',
                'description' => null,
                'display_order' => 2,
                'is_active' => true,
            ]
        );

        $vaccinated = ReportSection::updateOrCreate(
            [
                'report_type_id' => $reportType->id,
                'code' => 'VACCINATED',
            ],
            [
                'parent_id' => $immunization->id,
                'name' => 'Senior Citizens Vaccinated',
                'description' => null,
                'display_order' => 2,
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Indicators
        |--------------------------------------------------------------------------
        */

        $indicators = [

            // Geriatric Screening
            [
                'section' => $geriatricScreening,
                'code' => 'GERIATRIC_SCREENING_TARGET',
                'name' => 'Target for Geriatric Screening (based on the Total Eligible Population)',
                'order' => 1,
            ],

            [
                'section' => $screened,
                'code' => 'SENIOR_CITIZENS_SCREENED',
                'name' => 'Total No. of Senior Citizens Screened',
                'order' => 1,
            ],

            // Positive screening
            [
                'section' => $positiveScreening,
                'code' => 'SENIOR_CITIZENS_POSITIVE_SCREENING',
                'name' => 'Total No. of Senior Citizens with at least one Positive (+) Screening',
                'order' => 1,
            ],

            [
                'section' => $positiveScreening,
                'code' => 'MEMORY',
                'name' => 'A. Memory',
                'order' => 2,
            ],

            [
                'section' => $positiveScreening,
                'code' => 'DEPRESSION',
                'name' => 'B. Depression',
                'order' => 3,
            ],

            [
                'section' => $positiveScreening,
                'code' => 'POLYPHARMACY',
                'name' => 'C. Polypharmacy',
                'order' => 4,
            ],

            [
                'section' => $positiveScreening,
                'code' => 'URINARY_INCONTINENCE',
                'name' => 'D. Urinary Incontinence',
                'order' => 5,
            ],

            [
                'section' => $positiveScreening,
                'code' => 'FUNCTIONAL_CAPACITY',
                'name' => 'E. Functional Capacity',
                'order' => 6,
            ],

            [
                'section' => $positiveScreening,
                'code' => 'FALL',
                'name' => 'F. Fall (History and Screening Test)',
                'order' => 7,
            ],

            [
                'section' => $positiveScreening,
                'code' => 'MALNUTRITION',
                'name' => 'G. Malnutrition',
                'order' => 8,
            ],

            [
                'section' => $positiveScreening,
                'code' => 'HEARING',
                'name' => 'H. Hearing',
                'order' => 9,
            ],

            [
                'section' => $positiveScreening,
                'code' => 'VISION',
                'name' => 'I. Vision',
                'order' => 10,
            ],

            // ICP / Referral
            [
                'section' => $icpReferred,
                'code' => 'SENIOR_CITIZENS_ICP_REFERRED',
                'name' => 'Total No. of Senior Citizens with ICP AND/OR Referred',
                'order' => 1,
            ],

            // Immunization
            [
                'section' => $immunization,
                'code' => 'SENIOR_CITIZENS_SEEN',
                'name' => 'Total No. of Senior Citizens Seen at the health facility (who availed of any health service) *Seen does NOT equal Visits',
                'order' => 1,
            ],

            [
                'section' => $immunization,
                'code' => 'SENIOR_CITIZENS_NOT_PREVIOUSLY_PPV',
                'name' => 'Total No. of Senior Citizens Seen who had NOT previously received PPV upon reaching 60 years old',
                'order' => 2,
            ],

            // Vaccination
            [
                'section' => $vaccinated,
                'code' => 'SENIOR_CITIZENS_VACCINATED_TOTAL',
                'name' => 'Total No. of Senior Citizens Vaccinated',
                'order' => 1,
            ],

            [
                'section' => $vaccinated,
                'code' => 'ANTI_PNEUMOCOCCAL_VACCINE',
                'name' => 'Anti-Pneumococcal Vaccine',
                'order' => 2,
            ],

            [
                'section' => $vaccinated,
                'code' => 'ANTI_INFLUENZA_VACCINE',
                'name' => 'Anti-Influenza Vaccine',
                'order' => 3,
            ],

            [
                'section' => $vaccinated,
                'code' => 'OTHER_VACCINE',
                'name' => 'Others',
                'order' => 4,
            ],
        ];

        foreach ($indicators as $indicator) {
            Indicator::updateOrCreate(
                [
                    'report_section_id' => $indicator['section']->id,
                    'code' => $indicator['code'],
                ],
                [
                    'name' => $indicator['name'],
                    'display_order' => $indicator['order'],
                    'is_active' => true,
                ]
            );
        }
    }
}