<?php

namespace App\Http\Controllers;

use App\Models\Lgu;
use App\Http\Requests\StoreLguRequest;
use App\Http\Requests\UpdateLguRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LguController extends Controller
{
    /**
     * Display a listing of LGUs.
     */
    public function index(): Response
    {
        $lgus = Lgu::query()
            ->orderBy('name')
            ->get();

        return Inertia::render('LGUs/index', [
            'lgus' => $lgus,
        ]);
    }

    /**
     * Show the form for creating a new LGU.
     */
    public function create(): Response
    {
        return Inertia::render('LGUs/create');
    }

    /**
     * Store a newly created LGU.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:255', 'unique:lgus,code'],
            'province' => ['nullable', 'string', 'max:255'],
            'municipality' => ['nullable', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ]);

        Lgu::create($validated);

        return redirect()
            ->route('lgus.index')
            ->with('success', 'LGU created successfully.');
    }

    /**
     * Show the form for editing an LGU.
     */
    public function edit(Lgu $lgu): Response
    {
        return Inertia::render('LGUs/edit', [
            'lgu' => $lgu,
        ]);
    }

    /**
     * Update an existing LGU.
     */
    public function update(Request $request, Lgu $lgu): RedirectResponse 
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'nullable',
                'string',
                'max:255',
                'unique:lgus,code,' . $lgu->id,
            ],
            'province' => ['nullable', 'string', 'max:255'],
            'municipality' => ['nullable', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ]);

        $lgu->update($validated);

        return redirect()
            ->route('lgus.index')
            ->with('success', 'LGU updated successfully.');
    }

    /**
     * Activate or deactivate an LGU.
     */
    public function updateStatus(
        Request $request,
        Lgu $lgu
    ): RedirectResponse {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $lgu->update([
            'is_active' => $validated['is_active'],
        ]);

        $status = $validated['is_active']
            ? 'activated'
            : 'deactivated';

        return redirect()
            ->route('lgus.index')
            ->with('success', "LGU {$status} successfully.");
    }
}
