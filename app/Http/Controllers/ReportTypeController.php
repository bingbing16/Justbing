<?php

namespace App\Http\Controllers;

use App\Models\ReportType;
use Illuminate\Http\RedirectResponse;
use App\Http\Requests\StoreReportTypeRequest;
use App\Http\Requests\UpdateReportTypeRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportTypeController extends Controller
{
    public function index(): Response
    {
        $reportTypes = ReportType::query()
            ->withCount('sections')
            ->orderBy('name')
            ->get();

        return Inertia::render('ReportTypes/index', [
            'reportTypes' => $reportTypes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('ReportTypes/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:100',
                'unique:report_types,code',
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'slug' => [
                'required', 
                'string', 
                'max:255'
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        ReportType::create($validated);

        return redirect()
            ->route('report-types.index')
            ->with(
                'success',
                'Report type created successfully.'
            );
    }

    public function edit(ReportType $reportType): Response
    {
        return Inertia::render('ReportTypes/edit', [
            'reportType' => $reportType,
        ]);
    }

    public function update(Request $request, ReportType $reportType): RedirectResponse 
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:100',
                'unique:report_types,code,' . $reportType->id,
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'slug' => [
                'required', 
                'string', 
                'max:255'
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $reportType->update($validated);

        return redirect()
            ->route('report-types.index')
            ->with(
                'success',
                'Report type updated successfully.'
            );
    }

    public function updateStatus(Request $request, ReportType $reportType): RedirectResponse 
    {
        $validated = $request->validate([
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $reportType->update([
            'is_active' => $validated['is_active'],
        ]);

        $status = $validated['is_active']
            ? 'activated'
            : 'deactivated';

        return redirect()
            ->route('report-types.index')
            ->with(
                'success',
                "Report type {$status} successfully."
            );
    }
    
}