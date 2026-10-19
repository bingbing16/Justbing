<?php

namespace App\Http\Controllers;

use App\Models\Quarter;
use App\Models\ReportingPeriod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportingPeriodController extends Controller
{
    public function index(): Response
    {
        $reportingPeriods = ReportingPeriod::query()
            ->with('quarter:id,code,name')
            ->withCount('submissions')
            ->orderByDesc('year')
            ->orderBy('quarter_id')
            ->get();

        return Inertia::render('ReportingPeriods/index', [
            'reportingPeriods' => $reportingPeriods,
        ]);
    }

    public function create(): Response
    {
        $quarters = Quarter::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get([
                'id',
                'code',
                'name',
                'sort_order',
            ]);

        return Inertia::render('ReportingPeriods/create', [
            'quarters' => $quarters,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
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

            'start_date' => [
                'required',
                'date',
            ],

            'end_date' => [
                'required',
                'date',
                'after_or_equal:start_date',
            ],

            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $exists = ReportingPeriod::query()
            ->where('year', $validated['year'])
            ->where('quarter_id', $validated['quarter_id'])
            ->exists();

        if ($exists) {
            return back()
                ->withErrors([
                    'quarter_id' =>
                        'A reporting period already exists for this year and quarter.',
                ])
                ->withInput();
        }

        ReportingPeriod::create($validated);

        return redirect()
            ->route('reporting-periods.index')
            ->with(
                'success',
                'Reporting period created successfully.'
            );
    }

    public function edit(
        ReportingPeriod $reportingPeriod
    ): Response {
        $quarters = Quarter::query()
            ->where(function ($query) use ($reportingPeriod) {
                $query
                    ->where('is_active', true)
                    ->orWhere(
                        'id',
                        $reportingPeriod->quarter_id
                    );
            })
            ->orderBy('sort_order')
            ->get([
                'id',
                'code',
                'name',
                'sort_order',
            ]);

        return Inertia::render('ReportingPeriods/edit', [
            'reportingPeriod' => $reportingPeriod->load(
                'quarter:id,code,name'
            ),
            'quarters' => $quarters,
        ]);
    }

    public function update(
        Request $request,
        ReportingPeriod $reportingPeriod
    ): RedirectResponse {
        $validated = $request->validate([
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

            'start_date' => [
                'required',
                'date',
            ],

            'end_date' => [
                'required',
                'date',
                'after_or_equal:start_date',
            ],

            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $exists = ReportingPeriod::query()
            ->where('year', $validated['year'])
            ->where('quarter_id', $validated['quarter_id'])
            ->where(
                'id',
                '!=',
                $reportingPeriod->id
            )
            ->exists();

        if ($exists) {
            return back()
                ->withErrors([
                    'quarter_id' =>
                        'A reporting period already exists for this year and quarter.',
                ])
                ->withInput();
        }

        $reportingPeriod->update($validated);

        return redirect()
            ->route('reporting-periods.index')
            ->with(
                'success',
                'Reporting period updated successfully.'
            );
    }

    public function updateStatus(
        Request $request,
        ReportingPeriod $reportingPeriod
    ): RedirectResponse {
        $validated = $request->validate([
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $reportingPeriod->update([
            'is_active' => $validated['is_active'],
        ]);

        $status = $validated['is_active']
            ? 'activated'
            : 'deactivated';

        return redirect()
            ->route('reporting-periods.index')
            ->with(
                'success',
                "Reporting period {$status} successfully."
            );
    }
}