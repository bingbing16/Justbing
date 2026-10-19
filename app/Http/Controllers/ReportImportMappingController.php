<?php

namespace App\Http\Controllers;

use App\Models\Indicator;
use App\Models\ReportImportMapping;
use App\Models\ReportType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportImportMappingController extends Controller
{
    public function index(): Response
    {
        $mappings = ReportImportMapping::query()
            ->with([
                'reportType:id,code,name',
                'indicator:id,report_section_id,code,name',
                'indicator.section:id,report_type_id,code,name',
            ])
            ->orderBy('report_type_id')
            ->orderBy('indicator_id')
            ->get();

        return Inertia::render('ReportImportMappings/index', [
            'mappings' => $mappings,
        ]);
    }

    public function create(): Response
    {
        $reportTypes = ReportType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'code',
                'name',
            ]);

        $indicators = Indicator::query()
            ->with('section:id,report_type_id,code,name')
            ->where('is_active', true)
            ->orderBy('report_section_id')
            ->orderBy('display_order')
            ->get([
                'id',
                'report_section_id',
                'code',
                'name',
                'display_order',
            ]);

        return Inertia::render('ReportImportMappings/create', [
            'reportTypes' => $reportTypes,
            'indicators' => $indicators,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'report_type_id' => [
                'required',
                'exists:report_types,id',
            ],

            'indicator_id' => [
                'required',
                'exists:indicators,id',
            ],

            'source_label' => [
                'required',
                'string',
                'max:255',
            ],

            'source_key' => [
                'nullable',
                'string',
                'max:255',
            ],

            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        /*
         * Make sure the indicator belongs to the selected
         * report type.
         */
        $indicatorBelongsToReportType = Indicator::query()
            ->where('indicators.id', $validated['indicator_id'])
            ->whereHas('section', function ($query) use ($validated) {
                $query->where(
                    'report_type_id',
                    $validated['report_type_id']
                );
            })
            ->exists();

        if (!$indicatorBelongsToReportType) {
            return back()
                ->withErrors([
                    'indicator_id' =>
                        'The selected indicator does not belong to the selected report type.',
                ])
                ->withInput();
        }

        $exists = ReportImportMapping::query()
            ->where(
                'report_type_id',
                $validated['report_type_id']
            )
            ->where(
                'indicator_id',
                $validated['indicator_id']
            )
            ->exists();

        if ($exists) {
            return back()
                ->withErrors([
                    'indicator_id' =>
                        'An import mapping already exists for this report type and indicator.',
                ])
                ->withInput();
        }

        ReportImportMapping::create($validated);

        return redirect()
            ->route('report-import-mappings.index')
            ->with(
                'success',
                'Report import mapping created successfully.'
            );
    }

    public function edit(
        ReportImportMapping $reportImportMapping
    ): Response {
        $reportTypes = ReportType::query()
            ->where(function ($query) use ($reportImportMapping) {
                $query
                    ->where('is_active', true)
                    ->orWhere(
                        'id',
                        $reportImportMapping->report_type_id
                    );
            })
            ->orderBy('name')
            ->get([
                'id',
                'code',
                'name',
            ]);

        $indicators = Indicator::query()
            ->with('section:id,report_type_id,code,name')
            ->where(function ($query) use ($reportImportMapping) {
                $query
                    ->where('is_active', true)
                    ->orWhere(
                        'id',
                        $reportImportMapping->indicator_id
                    );
            })
            ->orderBy('report_section_id')
            ->orderBy('display_order')
            ->get([
                'id',
                'report_section_id',
                'code',
                'name',
                'display_order',
            ]);

        return Inertia::render(
            'ReportImportMappings/edit',
            [
                'mapping' => $reportImportMapping->load([
                    'reportType:id,code,name',
                    'indicator:id,report_section_id,code,name',
                    'indicator.section:id,report_type_id,code,name',
                ]),
                'reportTypes' => $reportTypes,
                'indicators' => $indicators,
            ]
        );
    }

    public function update(
        Request $request,
        ReportImportMapping $reportImportMapping
    ): RedirectResponse {
        $validated = $request->validate([
            'report_type_id' => [
                'required',
                'exists:report_types,id',
            ],

            'indicator_id' => [
                'required',
                'exists:indicators,id',
            ],

            'source_label' => [
                'required',
                'string',
                'max:255',
            ],

            'source_key' => [
                'nullable',
                'string',
                'max:255',
            ],

            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $indicatorBelongsToReportType = Indicator::query()
            ->where('indicators.id', $validated['indicator_id'])
            ->whereHas('section', function ($query) use ($validated) {
                $query->where(
                    'report_type_id',
                    $validated['report_type_id']
                );
            })
            ->exists();

        if (!$indicatorBelongsToReportType) {
            return back()
                ->withErrors([
                    'indicator_id' =>
                        'The selected indicator does not belong to the selected report type.',
                ])
                ->withInput();
        }

        $exists = ReportImportMapping::query()
            ->where(
                'report_type_id',
                $validated['report_type_id']
            )
            ->where(
                'indicator_id',
                $validated['indicator_id']
            )
            ->where(
                'id',
                '!=',
                $reportImportMapping->id
            )
            ->exists();

        if ($exists) {
            return back()
                ->withErrors([
                    'indicator_id' =>
                        'An import mapping already exists for this report type and indicator.',
                ])
                ->withInput();
        }

        $reportImportMapping->update($validated);

        return redirect()
            ->route('report-import-mappings.index')
            ->with(
                'success',
                'Report import mapping updated successfully.'
            );
    }

    public function updateStatus(
        Request $request,
        ReportImportMapping $reportImportMapping
    ): RedirectResponse {
        $validated = $request->validate([
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $reportImportMapping->update([
            'is_active' => $validated['is_active'],
        ]);

        $status = $validated['is_active']
            ? 'activated'
            : 'deactivated';

        return redirect()
            ->route('report-import-mappings.index')
            ->with(
                'success',
                "Report import mapping {$status} successfully."
            );
    }
}