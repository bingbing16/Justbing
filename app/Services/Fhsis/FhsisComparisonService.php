<?php

namespace App\Services\Fhsis;

use App\Models\FhsisImportMapping;
use App\Models\FhsisReport;
use App\Models\Lgu;
use App\Models\Quarter;
use App\Models\ReportSubmission;
use App\Models\ReportType;

class FhsisComparisonService
{
public function compare(ReportType $reportType, int $year, int $quarterId, ?int $lguId = null): array 
    {

        /*
        |--------------------------------------------------------------------------
        | Get CURRENT FHSIS version
        |--------------------------------------------------------------------------
        |
        | If Q1 was imported more than once:
        |
        | Version 1 = old data
        | Version 2 = updated data
        |
        | Only the current version should be used for comparison.
        |
        */

        $fhsis = FhsisReport::with([
            'quarter',
            'values.indicator',
        ])
        ->where('report_type_id', $reportType->id)
        ->where('year', $year)
        ->where('quarter_id', $quarterId)
        ->where('is_current', true)
        ->orderByDesc('version')
        ->first();

        /*
        |--------------------------------------------------------------------------
        | Get LGUs
        |--------------------------------------------------------------------------
        */
        $lgus = Lgu::where('is_active', true)
            ->when(
                $lguId,
                fn ($q) => $q->whereKey($lguId)
            )
            ->orderBy('name')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Get active FHSIS mappings
        |--------------------------------------------------------------------------
        */
        $mappings = FhsisImportMapping::with(
                'indicator:id,code,name'
            )
            ->where('report_type_id', $reportType->id)
            ->where('is_active', true)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | No FHSIS report
        |--------------------------------------------------------------------------
        */
        if (!$fhsis) {
            return [
                'year' => $year,
                'quarter' => $this->quarter($quarterId),

                'fhsis_report' => null,

                'summary' => [
                    'compared' => 0,
                    'match' => 0,
                    'discrepancy' => 0,
                    'not_comparable' => 0,
                ],

                'rows' => [],
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Get APPROVED LGU report
        |--------------------------------------------------------------------------
        */
        $submissions = ReportSubmission::with([
            'values',
            'status',
            'reportingPeriod',
        ])
        ->where('report_type_id', $reportType->id)
        ->where(
            'reporting_period_id',
            function ($q) use ($year, $quarterId) {
                $q->select('id')
                    ->from('reporting_periods')
                    ->where('year', $year)
                    ->where('quarter_id', $quarterId)
                    ->limit(1);
            }
        )
        ->when(
            $lguId,
            fn ($q) => $q->where('lgu_id', $lguId)
        )
        ->get()
        ->keyBy('lgu_id');

        /*
        |--------------------------------------------------------------------------
        | Index CURRENT FHSIS values
        |--------------------------------------------------------------------------
        */
        $fhsisValues = $fhsis->values
            ->groupBy(
                fn ($value) =>
                    $value->lgu_id . ':' . $value->indicator_id
            );

        $rows = [];

        $summary = [
            'compared' => 0,
            'match' => 0,
            'discrepancy' => 0,
            'not_comparable' => 0,
        ];

        /*
        |--------------------------------------------------------------------------
        | Compare LGU vs CURRENT FHSIS
        |--------------------------------------------------------------------------
        */
        foreach ($lgus as $lgu) {
            $submission = $submissions->get($lgu->id);

            foreach ($mappings as $mapping) {

                /*
                |--------------------------------------------------------------------------
                | FHSIS value
                |--------------------------------------------------------------------------
                */
                $fhsisValue = $fhsisValues
                    ->get(
                        $lgu->id . ':' . $mapping->indicator_id
                    )
                    ?->first();

                /*
                |--------------------------------------------------------------------------
                | LGU value
                |--------------------------------------------------------------------------
                */
                $lguValue = $submission?->values
                    ?->firstWhere(
                        'indicator_id',
                        $mapping->indicator_id
                    );

                $diffMale = null;
                $diffFemale = null;
                $diffTotal = null;

                /*
                |--------------------------------------------------------------------------
                | Missing data
                |--------------------------------------------------------------------------
                |
                | Missing is NOT treated as zero.
                |
                */
                if (!$fhsisValue || !$lguValue) {

                    $status = 'not_comparable';

                    $summary['not_comparable']++;

                } else {

                    /*
                    |--------------------------------------------------------------------------
                    | Calculate differences
                    |--------------------------------------------------------------------------
                    |
                    | LGU - FHSIS
                    |
                    */
                    $diffMale =
                        (float) $lguValue->male -
                        (float) $fhsisValue->male;

                    $diffFemale =
                        (float) $lguValue->female -
                        (float) $fhsisValue->female;

                    $diffTotal =
                        (float) $lguValue->total -
                        (float) $fhsisValue->total;

                    $summary['compared']++;

                    /*
                    |--------------------------------------------------------------------------
                    | Determine status
                    |--------------------------------------------------------------------------
                    */
                    $status = (
                        $diffMale == 0.0 &&
                        $diffFemale == 0.0 &&
                        $diffTotal == 0.0
                    )
                        ? 'match'
                        : 'discrepancy';

                    $summary[$status]++;
                }

                /*
                |--------------------------------------------------------------------------
                | Comparison row
                |--------------------------------------------------------------------------
                */
                $rows[] = [
                    'lgu_id' => $lgu->id,

                    'lgu_name' => $lgu->name,

                    'indicator_id' => $mapping->indicator_id,

                    'indicator_code' =>
                        $mapping->indicator->code,

                    'indicator_name' =>
                        $mapping->indicator->name,

                    'lgu' => [
                        'male' => $lguValue?->male,
                        'female' => $lguValue?->female,
                        'total' => $lguValue?->total,
                    ],

                    'fhsis' => [
                        'male' => $fhsisValue?->male,
                        'female' => $fhsisValue?->female,
                        'total' => $fhsisValue?->total,
                    ],

                    'difference' => [
                        'male' => $diffMale,
                        'female' => $diffFemale,
                        'total' => $diffTotal,
                    ],

                    'status' => $status,
                ];
            }
        }

        return [
            'year' => $year,

            'quarter' => $this->quarter($quarterId),

            'fhsis_report' => $fhsis,

            'summary' => $summary,

            'rows' => $rows,
        ];
    }

    private function quarter(int $id): ?array
    {
        $quarter = Quarter::find($id);

        return $quarter
            ? [
                'id' => $quarter->id,
                'code' => $quarter->code,
                'name' => $quarter->name,
            ]
            : null;
    }
}