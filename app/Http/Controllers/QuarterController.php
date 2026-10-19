<?php

namespace App\Http\Controllers;

use App\Models\Quarter;
use App\Http\Requests\StoreQuarterRequest;
use App\Http\Requests\UpdateQuarterRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuarterController extends Controller
{
    public function index(): Response
    {
        $quarters = Quarter::query()
            ->withCount('reportingPeriods')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Quarters/index', [
            'quarters' => $quarters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Quarters/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:10',
                'unique:quarters,code',
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'sort_order' => [
                'required',
                'integer',
                'min:1',
            ],
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        Quarter::create($validated);

        return redirect()
            ->route('quarters.index')
            ->with(
                'success',
                'Quarter created successfully.'
            );
    }

    public function edit(Quarter $quarter): Response
    {
        return Inertia::render('Quarters/edit', [
            'quarter' => $quarter,
        ]);
    }

    public function update(
        Request $request,
        Quarter $quarter
    ): RedirectResponse {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:10',
                'unique:quarters,code,' . $quarter->id,
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'sort_order' => [
                'required',
                'integer',
                'min:1',
            ],
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $quarter->update($validated);

        return redirect()
            ->route('quarters.index')
            ->with(
                'success',
                'Quarter updated successfully.'
            );
    }

    public function updateStatus(
        Request $request,
        Quarter $quarter
    ): RedirectResponse {
        $validated = $request->validate([
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $quarter->update([
            'is_active' => $validated['is_active'],
        ]);

        $status = $validated['is_active']
            ? 'activated'
            : 'deactivated';

        return redirect()
            ->route('quarters.index')
            ->with(
                'success',
                "Quarter {$status} successfully."
            );
    }
}