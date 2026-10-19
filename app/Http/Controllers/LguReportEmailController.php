<?php

namespace App\Http\Controllers;

use App\Models\Lgu;
use App\Models\LguReportEmail;
use App\Models\ReportType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LguReportEmailController extends Controller
{
    public function index(Request $request)
    {
        $emails = LguReportEmail::with([
            'lgu:id,name',
            'reportType:id,code,name',
        ])
            ->when(
                $request->search,
                fn ($query, $search) =>
                    $query
                        ->whereHas('lgu', fn ($q) =>
                            $q->where('name', 'like', "%{$search}%")
                        )
                        ->orWhere('email', 'like', "%{$search}%")
            )
            ->orderBy('lgu_id')
            ->orderBy('report_type_id')
            ->orderBy('email')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('justine/LguReportEmails/index', [
            'emails' => $emails,
            'lgus' => Lgu::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),

            'reportTypes' => ReportType::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name']),

            'filters' => [
                'search' => $request->search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lgu_id' => ['required', 'integer', 'exists:lgus,id'],
            'report_type_id' => [
                'required',
                'integer',
                'exists:report_types,id',
            ],
            'email' => [
                'required',
                'email',
                'max:255',
            ],
            'contact_name' => [
                'nullable',
                'string',
                'max:255',
            ],
            'is_active' => ['boolean'],
        ]);

        $exists = LguReportEmail::where('lgu_id', $validated['lgu_id'])
            ->where(
                'report_type_id',
                $validated['report_type_id']
            )
            ->where('email', $validated['email'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'email' => 'This email is already configured for this LGU and report type.',
            ]);
        }

        LguReportEmail::create($validated);

        return back()->with(
            'success',
            'Report email configuration added.'
        );
    }

    public function update(
        Request $request,
        LguReportEmail $lguReportEmail
    ) {
        $validated = $request->validate([
            'lgu_id' => ['required', 'integer', 'exists:lgus,id'],
            'report_type_id' => [
                'required',
                'integer',
                'exists:report_types,id',
            ],
            'email' => [
                'required',
                'email',
                'max:255',
            ],
            'contact_name' => [
                'nullable',
                'string',
                'max:255',
            ],
            'is_active' => ['boolean'],
        ]);

        $exists = LguReportEmail::where('lgu_id', $validated['lgu_id'])
            ->where('report_type_id', $validated['report_type_id'])
            ->where('email', $validated['email'])
            ->where('id', '!=', $lguReportEmail->id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'email' => 'This email is already configured for this LGU and report type.',
            ]);
        }

        $lguReportEmail->update($validated);

        return back()->with(
            'success',
            'Report email configuration updated.'
        );
    }

    public function destroy(LguReportEmail $lguReportEmail)
    {
        $lguReportEmail->delete();

        return back()->with(
            'success',
            'Report email configuration removed.'
        );
    }
}