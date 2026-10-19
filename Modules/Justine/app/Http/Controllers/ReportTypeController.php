<?php

namespace Modules\Justine\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ReportType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ReportTypeController extends Controller
{
    public function index(): Response
    {
        $reportTypes = ReportType::query()
            ->withCount(['sections', 'reportSubmissions'])
            ->orderBy('name')
            ->get(['id','code','name','slug','description','is_active']);

        return Inertia::render('justine/report-types/index', [
            'reportTypes' => $reportTypes,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required','string','max:50','regex:/^[A-Za-z0-9_-]+$/','unique:report_types,code'],
            'name' => ['required','string','max:255'],
            'slug' => ['nullable','string','max:255','regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/','unique:report_types,slug'],
            'description' => ['nullable','string','max:5000'],
            'is_active' => ['boolean'],
        ]);

        ReportType::create([
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return back()->with('success', 'Report type created successfully.');
    }

    public function update(Request $request, ReportType $reportType): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required','string','max:50','regex:/^[A-Za-z0-9_-]+$/','unique:report_types,code,' . $reportType->id],
            'name' => ['required','string','max:255'],
            'slug' => ['nullable','string','max:255','regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/','unique:report_types,slug,' . $reportType->id],
            'description' => ['nullable','string','max:5000'],
            'is_active' => ['boolean'],
        ]);

        $reportType->update([
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? false,
        ]);

        return back()->with('success', 'Report type updated successfully.');
    }

    public function toggle(ReportType $reportType): RedirectResponse
    {
        $reportType->update(['is_active' => ! $reportType->is_active]);

        return back()->with('success', $reportType->is_active
            ? 'Report type activated.'
            : 'Report type deactivated.');
    }
}
