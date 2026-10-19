<?php

namespace App\Http\Controllers;

use App\Models\Lgu;
use App\Models\Quarter;
use App\Models\ReportType;
use App\Models\ReportingPeriod;
use App\Services\HWPSC\HWPSCDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Services\HWPSC\HWPSCLguProfileService;
use App\Services\Reports\ReportDashboardService;
use App\Services\Reports\ReportLguProfileService;

class HWPSCDashboardController extends Controller
{
    public function __construct(
    private HWPSCDashboardService $dashboard,
    private HWPSCLguProfileService $lguProfile,
    private ReportDashboardService $genericDashboard,
    private ReportLguProfileService $genericLguProfile,
) {}


   

    public function index(Request $request, string $reportType) 
    {
        $year = (int) $request->input('year', now()->year);

        $quarterId = $request->filled('quarterId')
            ? (int) $request->input('quarterId')
            : null;

        $lguId = $request->filled('lguId')
            ? (int) $request->input('lguId')
            : null;

        $status = $request->input('status', 'all');

        if (! in_array(
            $status,
            ['all', 'draft', 'submitted', 'approved', 'rejected'],
            true
        )) {
            $status = 'all';
        }

        $reportTypeModel = ReportType::query()
            ->where('slug', $reportType)
            ->where('is_active', true)
            ->firstOrFail();

        /*
        |--------------------------------------------------------------------------
        | Use existing HWPSC dashboard
        |--------------------------------------------------------------------------
        */

        if ($reportTypeModel->code === 'HWPSC') {
            $dashboard = $this->dashboard->build(
                $reportTypeModel,
                $year,
                $quarterId,
                $lguId,
                $status
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Use generic dashboard for PBP / future report types
        |--------------------------------------------------------------------------
        */

        else {
            $dashboard = $this->genericDashboard->build(
                $reportTypeModel,
                $year,
                $quarterId,
                $lguId,
                $status
            );
        }

        return Inertia::render(
            'justine/reports/hwpsc/dashboard',
            [
                'dashboard' => $dashboard,

                'year' => $year,

                'reportType' => [
                    'id' => $reportTypeModel->id,
                    'code' => $reportTypeModel->code,
                    'name' => $reportTypeModel->name,
                    'slug' => $reportTypeModel->slug,
                ],

                'reportTypes' => ReportType::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get([
                        'id',
                        'code',
                        'name',
                        'slug',
                    ]),

                'lgus' => Lgu::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get([
                        'id',
                        'name',
                    ]),
            ]
        );
    }

    public function lguProfile(Request $request, Lgu $lgu)
    {
        $year = $request->integer('year') ?: now()->year;
        $type = strtoupper($request->input('type', 'HWPSC'));

        $reportType = ReportType::query()
            ->where('code', $type)
            ->where('is_active', true)
            ->firstOrFail();

        return Inertia::render(
            'justine/reports/hwpsc/lgu-profile',
            [
                'profile' => $this->genericLguProfile->build($reportType, $lgu, $year),
                'reportType' => [
                    'id' => $reportType->id,
                    'code' => $reportType->code,
                    'name' => $reportType->name,
                    'slug' => $reportType->slug,
                ],
                'reportTypes' => ReportType::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'code', 'name']),
                'year' => $year,
            ]
        );
    }

    public function genericLguProfile(Request $request, string $reportType, Lgu $lgu)
    {
        $year = $request->integer('year') ?: now()->year;

        $reportTypeModel = ReportType::query()
            ->where('slug', $reportType)
            ->where('is_active', true)
            ->firstOrFail();

        return Inertia::render(
            'justine/reports/hwpsc/lgu-profile',
            [
                'profile' => $this->genericLguProfile->build($reportTypeModel, $lgu, $year),
                'reportType' => [
                    'id' => $reportTypeModel->id,
                    'code' => $reportTypeModel->code,
                    'name' => $reportTypeModel->name,
                    'slug' => $reportTypeModel->slug,
                ],
                'reportTypes' => ReportType::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'code', 'name', 'slug']),
                'year' => $year,
            ]
        );
    }

    public function export(Request $request, string $reportType): StreamedResponse 
    {
        $year = $request->integer('year') ?: now()->year;

        $quarterId = $request->integer('quarterId') ?: null;

        $lguId = $request->integer('lguId') ?: null;

        $status = $request->input('status', 'all');

        if (! in_array(
            $status,
            ['all', 'draft', 'submitted', 'approved', 'rejected'],
            true
        )) {
            $status = 'all';
        }

        $reportTypeModel = ReportType::query()
            ->where('slug', $reportType)
            ->where('is_active', true)
            ->firstOrFail();

        /*
        |--------------------------------------------------------------------------
        | Build dashboard according to report type
        |--------------------------------------------------------------------------
        */

        if ($reportTypeModel->code === 'HWPSC') {
            $dashboard = $this->dashboard->build(
                $reportTypeModel,
                $year,
                $quarterId,
                $lguId,
                $status
            );
        } else {
            $dashboard = $this->genericDashboard->build(
                $reportTypeModel,
                $year,
                $quarterId,
                $lguId,
                $status
            );
        }

        $filename = strtolower($reportTypeModel->code)
            . '-dashboard-'
            . $year
            . ($quarterId ? '-q' . $quarterId : '')
            . '.csv';

        return response()->streamDownload(
            function () use ($dashboard, $reportTypeModel) {
                $out = fopen('php://output', 'w');

                /*
                * HWPSC export format
                */
                if ($reportTypeModel->code === 'HWPSC') {
                    fputcsv($out, [
                        'LGU',
                        'Target',
                        'Male Screened',
                        'Female Screened',
                        'Total Screened',
                        'Coverage %',
                        'Positive',
                        'ICP/Referred',
                        'Seen',
                        'Vaccinated',
                    ]);

                    foreach ($dashboard['lgus'] as $row) {
                        fputcsv($out, [
                            $row['lgu'],
                            $row['target'],
                            $row['male'],
                            $row['female'],
                            $row['screened'],
                            $row['coverage'],
                            $row['positive'],
                            $row['referred'],
                            $row['seen'],
                            $row['vaccinated'],
                        ]);
                    }
                }

                /*
                * Generic report export
                */
                else {
                    fputcsv($out, [
                        'LGU',
                        'Indicator',
                        'Male',
                        'Female',
                        'Total',
                    ]);

                    foreach ($dashboard['lgus'] ?? [] as $row) {
                        fputcsv($out, [
                            $row['lgu'] ?? '',
                            $row['indicator'] ?? '',
                            $row['male'] ?? '',
                            $row['female'] ?? '',
                            $row['total'] ?? '',
                        ]);
                    }
                }

                fclose($out);
            },
            $filename,
            [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]
        );
    }

    // private function percentageBasis(string $key): ?string
    // {
    //     return match ($key) {
    //         'screened' => 'target',
    //         'positive' => 'screened',

    //         'memory',
    //         'depression',
    //         'polypharmacy',
    //         'urinary_incontinence',
    //         'functional_capacity',
    //         'fall',
    //         'malnutrition',
    //         'hearing',
    //         'vision' => 'positive',

    //         'referred' => 'positive',

    //         'seen' => 'screened',
    //         'not_previously_ppv' => 'screened',

    //         'pneumococcal',
    //         'influenza',
    //         'other_vaccine' => 'vaccinated',

    //         default => null,
    //     };
    // }
}
