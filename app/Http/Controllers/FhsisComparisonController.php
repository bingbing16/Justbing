<?php

namespace App\Http\Controllers;

use App\Models\Lgu;
use App\Models\Quarter;
use App\Models\ReportingPeriod;
use App\Services\Fhsis\FhsisComparisonService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Models\ReportType;

class FhsisComparisonController extends Controller
{
    public function index(Request $request, string $reportType, FhsisComparisonService $service): Response 
    {
        $reportTypeModel = ReportType::query()
            ->where('slug', $reportType)
            ->where('is_active', true)
            ->firstOrFail();

        $year = (int) $request->input(
            'year',
            ReportingPeriod::max('year') ?? now()->year
        );

        $quarterId = (int) $request->input(
            'quarter_id',
            Quarter::where('code', 'Q1')->value('id') ?? 1
        );

        $lguId = $request->filled('lgu_id')
            ? (int) $request->input('lgu_id')
            : null;

        $comparison = $service->compare(
            $reportTypeModel,
            $year,
            $quarterId,
            $lguId
        );

        return Inertia::render('justine/Fhsis/comparison', [
            'reportType' => $reportTypeModel,

            'rows' => $comparison['rows'],

            'summary' => [
                'total' => $comparison['summary']['compared'],
                'matching' => $comparison['summary']['match'],
                'discrepancies' => $comparison['summary']['discrepancy'],
                'not_comparable' => $comparison['summary']['not_comparable'],
            ],

            'lgus' => Lgu::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),

            'quarters' => Quarter::where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'code', 'name']),

            'years' => ReportingPeriod::select('year')
                ->distinct()
                ->orderByDesc('year')
                ->pluck('year')
                ->values(),

            'filters' => [
                'year' => $year,
                'quarter_id' => $quarterId,
                'lgu_id' => $lguId,
            ],
        ]);
    }

    public function discrepancyReport(Request $request, string $reportType, FhsisComparisonService $service): Response 
    {
        $reportTypeModel = ReportType::query()
            ->where('slug', $reportType)
            ->where('is_active', true)
            ->firstOrFail();

        $year = (int) $request->input('year', now()->year);

        $quarterId = (int) $request->input('quarter_id');

        $lguId = $request->filled('lgu_id')
            ? (int) $request->input('lgu_id')
            : null;

        $comparison = $service->compare(
            $reportTypeModel,
            $year,
            $quarterId,
            $lguId
        );

        $discrepancies = collect($comparison['rows'])
            ->filter(
                fn ($row) =>
                    ($row['status'] ?? null) === 'discrepancy'
            )
            ->values();

        $grouped = $discrepancies
            ->groupBy('lgu_id')
            ->map(function ($rows) {
                $first = $rows->first();

                return [
                    'lgu_id' => $first['lgu_id'],
                    'lgu_name' => $first['lgu_name'],
                    'discrepancy_count' => $rows->count(),
                    'rows' => $rows->values()->all(),
                ];
            })
            ->values();

        return Inertia::render(
            'justine/Fhsis/discrepancyReport',
            [
                
                'reportType' => $reportTypeModel,

                'year' => $year,

                'quarter' => Quarter::find($quarterId),

                'lgu' => $lguId
                    ? Lgu::find($lguId)
                    : null,

                'groups' => $grouped,

                'total_discrepancies' => $discrepancies->count(),

                'total_lgus' => $grouped->count(),
            ]
        );
    }

    public function exportDiscrepancyReport(Request $request, string $reportType, FhsisComparisonService $service): StreamedResponse
    {

        $reportTypeModel = ReportType::query()
            ->where('slug', $reportType)
            ->where('is_active', true)
            ->firstOrFail();

        $year = (int) $request->input('year', now()->year);
        $quarterId = (int) $request->input('quarter_id');

        $lguId = $request->filled('lgu_id')
            ? (int) $request->input('lgu_id')
            : null;

        $comparison = $service->compare(
            $reportTypeModel,
            $year,
            $quarterId,
            $lguId
        );

        $rows = collect($comparison['rows'])
            ->filter(
                fn ($row) =>
                    ($row['status'] ?? null) === 'discrepancy'
            )
            ->values();

        $quarter = Quarter::find($quarterId);

        $filename =
            'FHSIS_Discrepancy_Report_' .
            $year . '_' .
            ($quarter?->code ?? 'Quarter') .
            '.csv';

        return response()->streamDownload(
            function () use ($rows) {

                $handle = fopen('php://output', 'w');

                /*
                * CSV header
                */
                fputcsv($handle, [
                    'LGU',
                    'Indicator',
                    'Indicator Code',

                    'LGU Male',
                    'LGU Female',
                    'LGU Total',

                    'FHSIS Male',
                    'FHSIS Female',
                    'FHSIS Total',

                    'Difference Male',
                    'Difference Female',
                    'Difference Total',

                    'Status',
                ]);

                foreach ($rows as $row) {

                    fputcsv($handle, [
                        $row['lgu_name'],
                        $row['indicator_name'],
                        $row['indicator_code'],

                        $row['lgu']['male'],
                        $row['lgu']['female'],
                        $row['lgu']['total'],

                        $row['fhsis']['male'],
                        $row['fhsis']['female'],
                        $row['fhsis']['total'],

                        $row['difference']['male'],
                        $row['difference']['female'],
                        $row['difference']['total'],

                        'Discrepancy',
                    ]);
                }

                fclose($handle);
            },
            $filename,
            [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]
        );
    }
}
