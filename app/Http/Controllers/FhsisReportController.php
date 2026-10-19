<?php

namespace App\Http\Controllers;

use App\Models\FhsisReport;
use App\Models\Quarter;
use App\Models\ReportingPeriod;
use App\Services\Fhsis\FhsisImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\ReportType;

class FhsisReportController extends Controller
{

    private function resolveReportType(string $slug): ReportType
    {
        return ReportType::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();
    }

    public function index(): Response
    {
        $reports = FhsisReport::with([
            'reportType:id,code,name,slug',
            'quarter:id,code,name',
            'importer:id,name',
        ])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $reportTypes = ReportType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'code',
                'name',
                'slug',
            ]);

        return Inertia::render('justine/Fhsis/index', [
            'reports' => $reports,
            'reportTypes' => $reportTypes,
        ]);
    }

    public function import(?string $reportType = null): Response
    {
        $reportTypes = ReportType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'code',
                'name',
                'slug',
            ]);

        $selectedReportType = $reportType
            ? $this->resolveReportType($reportType)
            : null;

        return Inertia::render('justine/Fhsis/import', [
            'reportType' => $selectedReportType,
            'reportTypes' => $reportTypes,

            'quarters' => Quarter::where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'code', 'name']),

            'years' => ReportingPeriod::select('year')
                ->distinct()
                ->orderByDesc('year')
                ->pluck('year')
                ->values(),
        ]);
    }

    public function preview(Request $request, string $reportType, FhsisImportService $service): Response|RedirectResponse 
    {

        $reportTypeModel = $this->resolveReportType($reportType);

        $data = $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:xlsx,xls',
                'max:10240',
            ],
            'year' => [
                'required',
                'integer',
                'min:2000',
                'max:2100',
            ],
            'quarter_id' => [
                'required',
                'exists:quarters,id',
            ],
        ]);

        try {
            $preview = $service->previewReplacement(
                $data['file'],
                (int) $data['year'],
                (int) $data['quarter_id'],
                $reportTypeModel
            );

            $sessionKey = "fhsis_import_preview_{$reportTypeModel->id}";

            $request->session()->put(
                $sessionKey,
                $preview
            );

            return Inertia::render('justine/Fhsis/import', [
                'reportType' => $reportTypeModel,

                'quarters' => Quarter::where('is_active', true)
                    ->orderBy('sort_order')
                    ->get(['id', 'code', 'name']),

                'years' => ReportingPeriod::select('year')
                    ->distinct()
                    ->orderByDesc('year')
                    ->pluck('year')
                    ->values(),

                'preview' => $preview,
            ]);

        } catch (\Throwable $e) {
            return back()
                ->withErrors([
                    'file' => 'Unable to read the FHSIS workbook: ' . $e->getMessage(),
                ])
                ->withInput();
        }
    }

    public function confirm(Request $request, string $reportType, FhsisImportService $service): RedirectResponse
    {
        $reportTypeModel = $this->resolveReportType($reportType);

        $sessionKey = "fhsis_import_preview_{$reportTypeModel->id}";

        $preview = $request->session()->get($sessionKey);

        if (!$preview) {
            return redirect()
                ->route(
                    'justine.fhsis.import',
                    ['reportType' => $reportTypeModel->slug]
                )
                ->withErrors([
                    'file' => 'The import preview has expired. Please upload the file again.',
                ]);
        }

        $service->import(
            $preview,
            (int) $request->user()->id
        );

        $request->session()->forget($sessionKey);

        return redirect()
            ->route('justine.fhsis.index')
            ->with(
                'success',
                "{$reportTypeModel->name} FHSIS report imported successfully."
            );
    }

    public function show(FhsisReport $fhsisReport): Response
    {
        $fhsisReport->load([
            'reportType',
            'quarter',
            'importer',
            'values.lgu',
            'values.indicator',
        ]);

        return Inertia::render('justine/Fhsis/show', [
            'report' => $fhsisReport,
        ]);
    }

    public function replace(Request $request, string $reportType, FhsisImportService $service): RedirectResponse
    {
        $reportTypeModel = $this->resolveReportType($reportType);

        $data = $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:xlsx,xls',
                'max:10240',
            ],

            'year' => [
                'required',
                'integer',
                'min:2000',
                'max:2100',
            ],

            'quarter_id' => [
                'required',
                'exists:quarters,id',
            ],
        ]);

        try {
            $report = $service->replace(
                $data['file'],
                (int) $data['year'],
                (int) $data['quarter_id'],
                auth()->id(),
                $reportTypeModel
            );

            return redirect()
                ->route(
                    'justine.fhsis.show',
                    $report
                )
                ->with(
                    'success',
                    "{$reportTypeModel->name} FHSIS {$report->year} "
                    . "{$report->quarter->code} was updated to version "
                    . "{$report->version}."
                );

        } catch (\Throwable $e) {
            return back()
                ->withErrors([
                    'file' =>
                        'Unable to replace FHSIS data: '
                        . $e->getMessage(),
                ])
                ->withInput();
        }
    }
}