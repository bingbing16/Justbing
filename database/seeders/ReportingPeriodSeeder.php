<?php

namespace Database\Seeders;

use App\Models\Quarter;
use App\Models\ReportingPeriod;
use Illuminate\Database\Seeder;

class ReportingPeriodSeeder extends Seeder
{
    public function run(): void
    {
        $quarters = Quarter::all();

        foreach ($quarters as $quarter) {
            ReportingPeriod::create([
                'year' => 2026,
                'quarter_id' => $quarter->id,
                'start_date' => match ($quarter->code) {
                    'Q1' => '2026-01-01',
                    'Q2' => '2026-04-01',
                    'Q3' => '2026-07-01',
                    'Q4' => '2026-10-01',
                },
                'end_date' => match ($quarter->code) {
                    'Q1' => '2026-03-31',
                    'Q2' => '2026-06-30',
                    'Q3' => '2026-09-30',
                    'Q4' => '2026-12-31',
                },
            ]);
        }
    }
}