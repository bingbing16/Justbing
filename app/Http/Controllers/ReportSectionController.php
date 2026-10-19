<?php

namespace App\Http\Controllers;

use App\Models\ReportSection;
use App\Models\ReportType;
use App\Http\Requests\StoreReportSectionRequest;
use App\Http\Requests\UpdateReportSectionRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportSectionController extends Controller
{
    public function index(): Response
    {
        $sections = ReportSection::query()
            ->with([
                'reportType:id,code,name',
                'parent:id,name',
            ])
            ->withCount('indicators')
            ->orderBy('report_type_id')
            ->orderBy('display_order')
            ->get();

        return Inertia::render('ReportSections/index', [
            'sections' => $sections,
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

        $sections = ReportSection::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->get([
                'id',
                'report_type_id',
                'parent_id',
                'code',
                'name',
            ]);

        return Inertia::render('ReportSections/create', [
            'reportTypes' => $reportTypes,
            'sections' => $sections,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'report_type_id' => [
                'required',
                'exists:report_types,id',
            ],
            'parent_id' => [
                'nullable',
                'exists:report_sections,id',
            ],
            'code' => [
                'required',
                'string',
                'max:100',
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'display_order' => [
                'required',
                'integer',
                'min:0',
            ],
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $exists = ReportSection::query()
            ->where('report_type_id', $validated['report_type_id'])
            ->where('code', $validated['code'])
            ->exists();

        if ($exists) {
            return back()
                ->withErrors([
                    'code' => 'This section code already exists for the selected report type.',
                ])
                ->withInput();
        }

        ReportSection::create($validated);

        return redirect()
            ->route('report-sections.index')
            ->with('success', 'Report section created successfully.');
    }

    public function edit(ReportSection $reportSection): Response
    {
        $reportTypes = ReportType::query()
            ->where('is_active', true)
            ->orWhere('id', $reportSection->report_type_id)
            ->orderBy('name')
            ->get([
                'id',
                'code',
                'name',
            ]);

        $sections = ReportSection::query()
            ->where('is_active', true)
            ->where('id', '!=', $reportSection->id)
            ->orderBy('display_order')
            ->get([
                'id',
                'report_type_id',
                'parent_id',
                'code',
                'name',
            ]);

        return Inertia::render('ReportSections/edit', [
            'section' => $reportSection,
            'reportTypes' => $reportTypes,
            'sections' => $sections,
        ]);
    }

    public function update(Request $request, ReportSection $reportSection): RedirectResponse 
    {
        $validated = $request->validate([
            'report_type_id' => [
                'required',
                'exists:report_types,id',
            ],
            'parent_id' => [
                'nullable',
                'exists:report_sections,id',
            ],
            'code' => [
                'required',
                'string',
                'max:100',
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'display_order' => [
                'required',
                'integer',
                'min:0',
            ],
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $exists = ReportSection::query()
            ->where('report_type_id', $validated['report_type_id'])
            ->where('code', $validated['code'])
            ->where('id', '!=', $reportSection->id)
            ->exists();

        if ($exists) {
            return back()
                ->withErrors([
                    'code' => 'This section code already exists for the selected report type.',
                ])
                ->withInput();
        }

        $reportSection->update($validated);

        return redirect()
            ->route('report-sections.index')
            ->with('success', 'Report section updated successfully.');
    }

    public function updateStatus(Request $request, ReportSection $reportSection): RedirectResponse 
    {
        $validated = $request->validate([
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $reportSection->update([
            'is_active' => $validated['is_active'],
        ]);

        $status = $validated['is_active']
            ? 'activated'
            : 'deactivated';

        return redirect()
            ->route('report-sections.index')
            ->with('success', "Report section {$status} successfully.");
    }
}