<?php

namespace App\Http\Controllers;

use App\Models\Indicator;
use App\Models\ReportSection;
use App\Http\Requests\StoreIndicatorRequest;
use App\Http\Requests\UpdateIndicatorRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IndicatorController extends Controller
{
    public function index(): Response
    {
        $indicators = Indicator::query()
            ->with([
                'section:id,report_type_id,name,code',
                'section.reportType:id,code,name',
            ])
            ->orderBy('report_section_id')
            ->orderBy('display_order')
            ->get();
        
        $sections = ReportSection::query()
            ->where('is_active', true)
            ->get();

        return Inertia::render('Indicators/index', [
            'indicators' => $indicators,
            'sections' => $sections,
        ]);
    }

    public function create(): Response
    {
        $sections = ReportSection::query()
            ->with('reportType:id,code,name')
            ->where('is_active', true)
            ->orderBy('report_type_id')
            ->orderBy('display_order')
            ->get([
                'id',
                'report_type_id',
                'parent_id',
                'code',
                'name',
            ]);

        return Inertia::render('Indicators/create', [
            'sections' => $sections,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'report_section_id' => [
                'required',
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

        $exists = Indicator::query()
            ->where(
                'report_section_id',
                $validated['report_section_id']
            )
            ->where('code', $validated['code'])
            ->exists();

        if ($exists) {
            return back()
                ->withErrors([
                    'code' => 'This indicator code already exists in the selected section.',
                ])
                ->withInput();
        }

        Indicator::create($validated);

        return redirect()
            ->route('indicators.index')
            ->with(
                'success',
                'Indicator created successfully.'
            );
    }

    public function edit(Indicator $indicator): Response
    {
        $sections = ReportSection::query()
            ->with('reportType:id,code,name')
            ->where(function ($query) use ($indicator) {
                $query
                    ->where('is_active', true)
                    ->orWhere('id', $indicator->report_section_id);
            })
            ->orderBy('report_type_id')
            ->orderBy('display_order')
            ->get([
                'id',
                'report_type_id',
                'parent_id',
                'code',
                'name',
            ]);

        return Inertia::render('Indicators/edit', [
            'indicator' => $indicator,
            'sections' => $sections,
        ]);
    }

    public function update(
        Request $request,
        Indicator $indicator
    ): RedirectResponse {
        $validated = $request->validate([
            'report_section_id' => [
                'required',
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

        $exists = Indicator::query()
            ->where(
                'report_section_id',
                $validated['report_section_id']
            )
            ->where('code', $validated['code'])
            ->where('id', '!=', $indicator->id)
            ->exists();

        if ($exists) {
            return back()
                ->withErrors([
                    'code' => 'This indicator code already exists in the selected section.',
                ])
                ->withInput();
        }

        $indicator->update($validated);

        return redirect()
            ->route('indicators.index')
            ->with(
                'success',
                'Indicator updated successfully.'
            );
    }

    public function updateStatus(
        Request $request,
        Indicator $indicator
    ): RedirectResponse {
        $validated = $request->validate([
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $indicator->update([
            'is_active' => $validated['is_active'],
        ]);

        $status = $validated['is_active']
            ? 'activated'
            : 'deactivated';

        return redirect()
            ->route('indicators.index')
            ->with(
                'success',
                "Indicator {$status} successfully."
            );
    }
}