<?php

namespace Database\Seeders;

use App\Models\Quarter;
use App\Models\ReportingPeriod;
use Illuminate\Database\Seeder;

class ReportingPeriodSeeder extends Seeder
{
    public function run(): void
    {
        $quarters = Quarter::whereIn('code', [
            'Q1',
            'Q2',
            'Q3',
            'Q4',
        ])->get()->keyBy('code');

        $year = 2026;

        ReportingPeriod::updateOrCreate(
            [
                'year' => $year,
                'quarter_id' => $quarters['Q1']->id,
            ],
            [
                'start_date' => '2026-01-01',
                'end_date' => '2026-03-31',
            ]
        );

        ReportingPeriod::updateOrCreate(
            [
                'year' => $year,
                'quarter_id' => $quarters['Q2']->id,
            ],
            [
                'start_date' => '2026-04-01',
                'end_date' => '2026-06-30',
            ]
        );

        ReportingPeriod::updateOrCreate(
            [
                'year' => $year,
                'quarter_id' => $quarters['Q3']->id,
            ],
            [
                'start_date' => '2026-07-01',
                'end_date' => '2026-09-30',
            ]
        );

        ReportingPeriod::updateOrCreate(
            [
                'year' => $year,
                'quarter_id' => $quarters['Q4']->id,
            ],
            [
                'start_date' => '2026-10-01',
                'end_date' => '2026-12-31',
            ]
        );
    }
}