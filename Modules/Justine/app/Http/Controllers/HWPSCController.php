<?php

namespace Modules\Justine\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Lgu;
use App\Models\Quarter;
use App\Models\ReportingPeriod;
use App\Models\ReportSection;
use App\Models\ReportSubmission;
use App\Models\ReportType;
use App\Models\ReportValue;
use App\Models\SubmissionStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Modules\Justine\Services\Imports\HWPSC\HWPSCImportService;
use App\Models\ReportImport;
use App\Models\ReportImportChange;
use App\Models\ReportImportQuarter;
use App\Services\Fhsis\FhsisComparisonService;

use App\Mail\ReportNotificationMail;
use App\Models\EmailLog;
use App\Models\LguReportEmail;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use App\Http\Controllers\FhsisReportController;

class HWPSCController extends Controller
{

    private function reportType(string $slug): ReportType
    {
        return ReportType::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();
    }

    private function resolveReportType(string $slug): ReportType
    {
        return ReportType::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();
    }


    /**
     * Create new HWPSC report.
     */
    public function create(?string $reportTypeSlug = null): Response
    {
        $slug = $reportTypeSlug ?? 'hwpsc';

        $reportType = $this->reportType($slug);

        $sections = ReportSection::query()
            ->where('report_type_id', $reportType->id)
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->with([
                'indicators' => function ($query) {
                    $query->where('is_active', true)
                        ->orderBy('display_order');
                },
                'children' => function ($query) {
                    $query->where('is_active', true)
                        ->orderBy('display_order')
                        ->with([
                            'indicators' => function ($query) {
                                $query->where('is_active', true)
                                    ->orderBy('display_order');
                            },
                        ]);
                },
            ])
            ->orderBy('display_order')
            ->get();

        $lgus = Lgu::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
            ]);

        $reportingPeriods = ReportingPeriod::query()
            ->with('quarter')
            ->orderByDesc('year')
            ->orderBy('quarter_id')
            ->get();

        $quarters = Quarter::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get([
                'id',
                'code',
                'name',
            ]);

        $existingSubmissions = ReportSubmission::query()
            ->where('report_type_id', $reportType->id)
            ->get([
                'id',
                'lgu_id',
                'reporting_period_id',
            ]);

        return Inertia::render('justine/reports/hwpsc/create', [
            'reportType' => $reportType,
            'sections' => $sections,
            'lgus' => $lgus,
            'reportingPeriods' => $reportingPeriods,
            'quarters' => $quarters,
            'existingSubmissions' => $existingSubmissions,
        ]);
    }


    /**
     * Store new HWPSC report.
     */
    public function store(Request $request, ?string $reportTypeSlug = null): RedirectResponse 
    {
        $slug = $reportTypeSlug ?? 'hwpsc';

        $reportType = $this->reportType($slug);

        $validated = $request->validate([
            'lgu_id' => ['required', 'integer', 'exists:lgus,id'],
            'reporting_period_id' => [
                'required',
                'integer',
                'exists:reporting_periods,id',
            ],
            'values' => ['required', 'array'],
            'values.*.indicator_id' => [
                'required',
                'integer',
                'exists:indicators,id',
            ],
            'values.*.male' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'values.*.female' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Prevent Duplicate Submission
        |--------------------------------------------------------------------------
        */

        $existingSubmission = ReportSubmission::query()
            ->where('lgu_id', $validated['lgu_id'])
            ->where('report_type_id', $reportType->id)
            ->where('reporting_period_id', $validated['reporting_period_id'])
            ->first();

        if ($existingSubmission) {
            return back()
                ->withErrors([
                    'reporting_period_id' =>
                        "A {$reportType->name} report already exists for this LGU and reporting period. Please edit the existing report instead.",
                ])
                ->withInput();
        }

        /*
        |--------------------------------------------------------------------------
        | Create Submission
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use ($validated, $reportType) {

            $draftStatus = SubmissionStatus::where('code', 'draft')
                ->firstOrFail();

            $submission = ReportSubmission::create([
                'lgu_id' => $validated['lgu_id'],
                'report_type_id' => $reportType->id,
                'reporting_period_id' => $validated['reporting_period_id'],
                'status_id' => $draftStatus->id,
            ]);

            foreach ($validated['values'] as $value) {

                $male = (float) ($value['male'] ?? 0);
                $female = (float) ($value['female'] ?? 0);

                ReportValue::create([
                    'report_submission_id' => $submission->id,
                    'indicator_id' => $value['indicator_id'],
                    'male' => $male,
                    'female' => $female,
                    'total' => $male + $female,
                ]);
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Redirect
        |--------------------------------------------------------------------------
        |
        | HWPSC uses the explicit route.
        | Other report types use the generic route.
        |
        */

        if ($slug === 'hwpsc') {
            return redirect()
                ->route('justine.reports.hwpsc.index')
                ->with(
                    'success',
                    "{$reportType->name} report created successfully."
                );
        }

        return redirect()
            ->route('justine.reports.index', [
                'reportType' => $slug,
            ])
            ->with(
                'success',
                "{$reportType->name} report created successfully."
            );
    }


    /**
     * List HWPSC reports.
     */
    public function index(Request $request, ?string $reportType = null): Response
    {
        $slug = $reportType ?? 'hwpsc';

        $reportType = $this->reportType($slug);

        $submissions = ReportSubmission::with([
            'lgu',
            'reportingPeriod.quarter',
            'status',
            'validator:id,name',
        ])
            ->where('report_type_id', $reportType->id)
            ->latest()
            ->get();

        $years = ReportingPeriod::query()
            ->select('year')
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year')
            ->values();

        $quarters = Quarter::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get([
                'id',
                'code',
                'name',
            ]);

        $statuses = SubmissionStatus::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get([
                'id',
                'code',
                'name',
            ]);

        return Inertia::render(
            'justine/reports/hwpsc/index',
            [
                'reportType' => $reportType,
                'submissions' => $submissions,
                'years' => $years,
                'quarters' => $quarters,
                'statuses' => $statuses,
            ]
        );
    }


    /**
     * Edit an existing HWPSC report.
     */
    public function edit(Request $request)
    {
        $routeReportType = $request->route('reportType');

        $reportTypeSlug = is_string($routeReportType)
            ? $routeReportType
            : 'hwpsc';

        $reportType = $this->reportType($reportTypeSlug);

        $routeSubmission = $request->route('submission');

        $submissionId = $routeSubmission instanceof ReportSubmission
            ? $routeSubmission->id
            : $routeSubmission;

        abort_unless(
            is_numeric($submissionId),
            404,
            'Invalid report submission.'
        );

        $submission = ReportSubmission::query()
            ->where('id', $submissionId)
            ->where('report_type_id', $reportType->id)
            ->with([
                'lgu',
                'reportingPeriod.quarter',
                'status',
                'values',
            ])
            ->firstOrFail();

        $sections = ReportSection::query()
            ->where('report_type_id', $reportType->id)
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->with([
                'indicators' => function ($query) {
                    $query
                        ->where('is_active', true)
                        ->orderBy('display_order');
                },

                'children' => function ($query) {
                    $query
                        ->where('is_active', true)
                        ->orderBy('display_order')
                        ->with([
                            'indicators' => function ($query) {
                                $query
                                    ->where('is_active', true)
                                    ->orderBy('display_order');
                            },
                        ]);
                },
            ])
            ->orderBy('display_order')
            ->get();

        return Inertia::render(
            'justine/reports/hwpsc/edit',
            [
                'reportType' => $reportType,
                'submission' => $submission,
                'sections' => $sections,
            ]
        );
    }


    /**
     * Update existing HWPSC report.
     */
    public function update(Request $request)
    {
        $routeReportType = $request->route('reportType');

        $reportTypeSlug = is_string($routeReportType)
            ? $routeReportType
            : 'hwpsc';

        $reportType = $this->reportType($reportTypeSlug);

        $routeSubmission = $request->route('submission');

        $submissionId = $routeSubmission instanceof ReportSubmission
            ? $routeSubmission->id
            : $routeSubmission;

        $submission = ReportSubmission::query()
            ->where('id', $submissionId)
            ->where('report_type_id', $reportType->id)
            ->firstOrFail();

        $submission->load('status');

        abort_unless(
            in_array(
                $submission->status?->code,
                ['draft', 'rejected']
            ),
            403
        );

        $validated = $request->validate([
            'values' => ['required', 'array'],

            'values.*.indicator_id' => [
                'required',
                'integer',
                'exists:indicators,id',
            ],

            'values.*.male' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'values.*.female' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ]);

        DB::transaction(function () use (
            $validated,
            $submission
        ) {
            foreach ($validated['values'] as $value) {
                $male = (float) ($value['male'] ?? 0);
                $female = (float) ($value['female'] ?? 0);

                ReportValue::updateOrCreate(
                    [
                        'report_submission_id' => $submission->id,
                        'indicator_id' => $value['indicator_id'],
                    ],
                    [
                        'male' => $male,
                        'female' => $female,
                        'total' => $male + $female,
                    ]
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Editing invalidates previous validation
            |--------------------------------------------------------------------------
            */

            $submission->update([
                'validation_status' => 'not_checked',
                'validated_at' => null,
                'validated_by' => null,
                'validation_remarks' => null,
                'validation_details' => null,
            ]);
        });

        return redirect()
            ->route(
                $reportTypeSlug === 'hwpsc'
                    ? 'justine.reports.hwpsc.index'
                    : 'justine.reports.index',
                $reportTypeSlug === 'hwpsc'
                    ? []
                    : ['reportType' => $reportTypeSlug]
            )
            ->with(
                'success',
                "{$reportType->name} report updated successfully."
            );
    }


    /**
     * Preview HWPSC report.
     */
    public function preview(string $reportType, ReportSubmission $submission) 
    {
        $reportType = $this->resolveReportType($reportType);

        abort_unless(
            $submission->report_type_id === $reportType->id,
            404
        );

        $sections = ReportSection::query()
            ->where('report_type_id', $reportType->id)
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->with([
                'indicators' => function ($query) {
                    $query
                        ->where('is_active', true)
                        ->orderBy('display_order');
                },

                'children' => function ($query) {
                    $query
                        ->where('is_active', true)
                        ->orderBy('display_order')
                        ->with([
                            'indicators' => function ($query) {
                                $query
                                    ->where('is_active', true)
                                    ->orderBy('display_order');
                            },
                        ]);
                },
            ])
            ->orderBy('display_order')
            ->get();

        $submission->load([
            'lgu',
            'reportingPeriod.quarter',
            'status',
            'values.indicator',
        ]);

        return Inertia::render(
            'justine/reports/hwpsc/preview',
            [
                'reportType' => $reportType,
                'submission' => $submission,
                'sections' => $sections,
            ]
        );
    }

    public function submit(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | Determine report type
        |--------------------------------------------------------------------------
        */

        $routeReportType = $request->route('reportType');

        $reportTypeSlug = is_string($routeReportType)
            ? $routeReportType
            : 'hwpsc';

        $reportType = $this->reportType($reportTypeSlug);

        /*
        |--------------------------------------------------------------------------
        | Get submission ID
        |--------------------------------------------------------------------------
        */

        $routeSubmission = $request->route('submission');

        $submissionId = $routeSubmission instanceof ReportSubmission
            ? $routeSubmission->id
            : $routeSubmission;

        abort_unless(
            is_numeric($submissionId),
            404,
            'Invalid report submission.'
        );

        /*
        |--------------------------------------------------------------------------
        | Load submission belonging to this report type
        |--------------------------------------------------------------------------
        */

        $submission = ReportSubmission::query()
            ->where('id', $submissionId)
            ->where('report_type_id', $reportType->id)
            ->with('status')
            ->firstOrFail();

        /*
        |--------------------------------------------------------------------------
        | Only Draft / Rejected can be submitted
        |--------------------------------------------------------------------------
        */

        abort_unless(
            in_array(
                $submission->status?->code,
                ['draft', 'rejected']
            ),
            403,
            'Only draft or rejected reports can be submitted.'
        );

        /*
        |--------------------------------------------------------------------------
        | Change status to Submitted
        |--------------------------------------------------------------------------
        */

        $submittedStatus = SubmissionStatus::where(
            'code',
            'submitted'
        )->firstOrFail();

        $submission->update([
            'status_id' => $submittedStatus->id,
            'submitted_by' => auth()->id(),
            'submitted_at' => now(),

            /*
            |--------------------------------------------------------------------------
            | Reset validation
            |--------------------------------------------------------------------------
            |
            | If the report was edited/rejected and submitted again,
            | it must be validated again.
            |
            */

            'validation_status' => 'not_checked',
            'validated_at' => null,
            'validated_by' => null,
            'validation_remarks' => null,
            'validation_details' => null,
        ]);

        return back()->with(
            'success',
            "{$reportType->name} report submitted successfully."
        );
    }

    public function approve(Request $request)
    {
        $routeReportType = $request->route('reportType');

        $reportTypeSlug = is_string($routeReportType)
            ? $routeReportType
            : 'hwpsc';

        $reportType = $this->reportType($reportTypeSlug);

        $routeSubmission = $request->route('submission');

        $submissionId = $routeSubmission instanceof ReportSubmission
            ? $routeSubmission->id
            : $routeSubmission;

        abort_unless(
            is_numeric($submissionId),
            404,
            'Invalid report submission.'
        );

        $submission = ReportSubmission::query()
            ->where('id', $submissionId)
            ->where('report_type_id', $reportType->id)
            ->with('status')
            ->firstOrFail();

        abort_unless(
            $submission->status?->code === 'submitted',
            403,
            'Only submitted reports can be approved.'
        );

        /*
        |--------------------------------------------------------------------------
        | HWPSC requires FHSIS validation
        |--------------------------------------------------------------------------
        */

        if (
            $reportType->code === 'HWPSC' &&
            $submission->validation_status !== 'validated'
        ) {
            abort(
                403,
                'This report must match FHSIS and be validated before approval.'
            );
        }

        $approvedStatus = SubmissionStatus::where(
            'code',
            'approved'
        )->firstOrFail();

        $submission->update([
            'status_id' => $approvedStatus->id,
        ]);

        return back()->with(
            'success',
            "{$reportType->name} report approved successfully."
        );
    }

    public function reject(Request $request)
    {
        $routeReportType = $request->route('reportType');

        $reportTypeSlug = is_string($routeReportType)
            ? $routeReportType
            : 'hwpsc';

        $reportType = $this->reportType($reportTypeSlug);

        $routeSubmission = $request->route('submission');

        $submissionId = $routeSubmission instanceof ReportSubmission
            ? $routeSubmission->id
            : $routeSubmission;

        abort_unless(
            is_numeric($submissionId),
            404,
            'Invalid report submission.'
        );

        $submission = ReportSubmission::query()
            ->where('id', $submissionId)
            ->where('report_type_id', $reportType->id)
            ->with('status')
            ->firstOrFail();

        abort_unless(
            $submission->status?->code === 'submitted',
            403,
            'Only submitted reports can be rejected.'
        );

        $validated = $request->validate([
            'remarks' => [
                'required',
                'string',
                'max:2000',
            ],
        ]);

        $rejectedStatus = SubmissionStatus::where(
            'code',
            'rejected'
        )->firstOrFail();

        $submission->update([
            'status_id' => $rejectedStatus->id,
            'remarks' => $validated['remarks'],

            'validation_status' => 'not_checked',
            'validated_at' => null,
            'validated_by' => null,
            'validation_remarks' => null,
            'validation_details' => null,
        ]);

        return back()->with(
            'success',
            "{$reportType->name} report rejected."
        );
    }

    public function annual(Request $request, string $reportTypeSlug)
    {
        $reportType = $this->resolveReportType($reportTypeSlug);

        $lgus = Lgu::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
            ]);

        $years = ReportingPeriod::query()
            ->select('year')
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year');

        $selectedLguId = $request->integer('lgu_id');

        $selectedYear = $request->integer('year') ?: now()->year;

        $statusFilter = $request->input('status', 'approved');

        $allowedStatuses = [
            'all',
            'approved',
            'rejected',
        ];

        if (!in_array($statusFilter, $allowedStatuses, true)) {
            $statusFilter = 'approved';
        }

        /*
        |--------------------------------------------------------------------------
        | Sections and Indicators
        |--------------------------------------------------------------------------
        */

        $sections = ReportSection::query()
            ->where('report_type_id', $reportType->id)
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->with([
                'indicators' => function ($query) {
                    $query
                        ->where('is_active', true)
                        ->orderBy('display_order');
                },

                'children' => function ($query) {
                    $query
                        ->where('is_active', true)
                        ->with([
                            'indicators' => function ($query) {
                                $query
                                    ->where('is_active', true)
                                    ->orderBy('display_order');
                            },

                            'children.indicators' => function ($query) {
                                $query
                                    ->where('is_active', true)
                                    ->orderBy('display_order');
                            },
                        ])
                        ->orderBy('display_order');
                },
            ])
            ->orderBy('display_order')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Quarters
        |--------------------------------------------------------------------------
        */

        $quarters = Quarter::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get([
                'id',
                'code',
                'name',
                'sort_order',
            ]);

        /*
        |--------------------------------------------------------------------------
        | LGU Submissions
        |--------------------------------------------------------------------------
        */

        $submissions = collect();

        if ($selectedLguId && $selectedYear) {

            $query = ReportSubmission::query()
                ->where('lgu_id', $selectedLguId)

                // IMPORTANT:
                // Only get submissions belonging to the selected report type.
                ->where('report_type_id', $reportType->id)

                ->whereHas('reportingPeriod', function ($query) use ($selectedYear) {
                    $query->where('year', $selectedYear);
                })

                ->with([
                    'reportingPeriod.quarter',
                    'status',
                    'values',
                ]);

            if ($statusFilter !== 'all') {
                $query->whereHas('status', function ($query) use ($statusFilter) {
                    $query->where('code', $statusFilter);
                });
            }

            $submissions = $query
                ->get()
                ->sortBy(function ($submission) {
                    return $submission
                        ->reportingPeriod
                        ->quarter
                        ->sort_order;
                })
                ->values();
        }

        /*
        |--------------------------------------------------------------------------
        | Annual Report
        |--------------------------------------------------------------------------
        */

        return Inertia::render(
            'justine/reports/hwpsc/annual',
            [
                'reportType' => $reportType,

                'lgus' => $lgus,

                'years' => $years,

                'quarters' => $quarters,

                'sections' => $sections,

                'submissions' => $submissions,

                'selectedLguId' => $selectedLguId,

                'selectedYear' => $selectedYear,

                'statusFilter' => $statusFilter,
            ]
        );
    }

    public function import(Request $request): Response 
    {
        $reportTypeSlug = $request->route('reportType');

        $reportType = ReportType::query()
            ->where('slug', $reportTypeSlug)
            ->where('is_active', true)
            ->firstOrFail();

        return Inertia::render(
            'justine/reports/hwpsc/import',
            [
                'reportType' => $reportType,
            ]
        );
    }


    public function importPreview(Request $request, HWPSCImportService $importService)
    {
        $reportTypeSlug = $request->route('reportType');

        $reportType = ReportType::query()
            ->where('slug', $reportTypeSlug)
            ->where('is_active', true)
            ->firstOrFail();

        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:xlsx,xls',
                'max:10240',
            ],
        ]);

        try {
            $preview = $importService->preview(
                $validated['file'],
                $reportType
            );

            // dd([
            //     'route_report_type' => $reportTypeSlug,

            //     'report_type' => [
            //         'id' => $reportType->id,
            //         'code' => $reportType->code,
            //         'name' => $reportType->name,
            //         'slug' => $reportType->slug,
            //     ],

            //     'preview_report_type' => [
            //         'id' => $preview['report_type_id'] ?? null,
            //         'code' => $preview['report_type_code'] ?? null,
            //         'name' => $preview['report_type_name'] ?? null,
            //         'slug' => $preview['report_type_slug'] ?? null,
            //     ],
            // ]);

            $preview['file_name'] =
                $validated['file']->getClientOriginalName();

            $preview['file_extension'] =
                $validated['file']->getClientOriginalExtension();

            $preview['file_size'] =
                $validated['file']->getSize();

            $request->session()->put(
                'report_import_preview',
                $preview
            );

            return Inertia::render(
                'justine/reports/hwpsc/import',
                [
                    'preview' => $preview,
                    'reportType' => $reportType,
                ]
            );

        } catch (\Throwable $e) {
            return back()
                ->withErrors([
                    'file' => 'Unable to read the Excel file: ' . $e->getMessage(),
                ])
                ->withInput();
        }
    }

    public function importConfirm(Request $request)
    {
        $preview = $request->session()->get('report_import_preview');

        if (!$preview) {
            return redirect()
                ->route('justine.reports.hwpsc.import')
                ->withErrors([
                    'file' => 'Import preview has expired. Please upload the Excel file again.',
                ]);
        }

        $user = $request->user();

        $import = DB::transaction(function () use ($preview, $request, $user) {

            $reportImport = ReportImport::create([
                'user_id' => $user?->id,
                'lgu_id' => $preview['lgu_id'],
                'report_type_id' => $preview['report_type_id'],
                'year' => $preview['year'],

                'file_name' => $preview['file_name'] ?? 'Unknown',
                'file_extension' => $preview['file_extension'] ?? null,
                'file_size' => $preview['file_size'] ?? null,
            ]);

            $newQuarters = 0;
            $updatedQuarters = 0;
            $unchangedQuarters = 0;
            $blockedQuarters = 0;

            $changedIndicators = 0;
            $blockedChanges = 0;

            foreach (['Q1', 'Q2', 'Q3', 'Q4'] as $quarter) {

                $quarterData = $preview['quarters'][$quarter] ?? [];

                if (empty($quarterData)) {
                    continue;
                }

                $periodData =
                    $preview['reporting_periods'][$quarter] ?? null;

                if (!$periodData) {
                    continue;
                }

                $period = ReportingPeriod::find(
                    $periodData['id']
                );

                if (!$period) {
                    continue;
                }

                $submission = ReportSubmission::query()
                    ->where('lgu_id', $preview['lgu_id'])
                    ->where('report_type_id', $preview['report_type_id'])
                    ->where('reporting_period_id', $period->id)
                    ->first();

                /*
                * NEW QUARTER
                */
                if (!$submission) {

                    $submission = ReportSubmission::create([
                        'lgu_id' => $preview['lgu_id'],
                        'report_type_id' => $preview['report_type_id'],
                        'reporting_period_id' => $period->id,
                        'status_id' => SubmissionStatus::where(
                            'code',
                            'draft'
                        )->value('id'),
                        'submitted_by' => null,
                        'submitted_at' => null,
                    ]);

                    foreach ($quarterData as $value) {

                        ReportValue::updateOrCreate(
                            [
                                'report_submission_id' => $submission->id,
                                'indicator_id' => $value['indicator_id'],
                            ],
                            [
                                'male' => $value['male'],
                                'female' => $value['female'],
                                'total' => $value['total'],
                            ]
                        );
                    }

                    $importQuarter = ReportImportQuarter::create([
                        'report_import_id' => $reportImport->id,
                        'report_submission_id' => $submission->id,
                        'reporting_period_id' => $period->id,
                        'quarter_code' => $quarter,
                        'status' => 'new',
                    ]);

                    $newQuarters++;

                    continue;
                }

                /*
                * EXISTING QUARTER
                */
                $existingValues = ReportValue::query()
                    ->where('report_submission_id', $submission->id)
                    ->get()
                    ->keyBy('indicator_id');

                $isApproved =
                    $submission->status?->code === 'approved';

                $hasChanges = false;

                $quarterImport = null;

                foreach ($quarterData as $value) {

                    $existing = $existingValues->get(
                        $value['indicator_id']
                    );

                    $newMale = (float) ($value['male'] ?? 0);
                    $newFemale = (float) ($value['female'] ?? 0);
                    $newTotal = $newMale + $newFemale;

                    /*
                    * INDICATOR DOES NOT EXIST YET
                    */
                    if (!$existing) {

                        // Approved reports cannot receive new indicators either.
                        if ($isApproved) {

                            if (!$quarterImport) {
                                $quarterImport = ReportImportQuarter::create([
                                    'report_import_id' => $reportImport->id,
                                    'report_submission_id' => $submission->id,
                                    'reporting_period_id' => $period->id,
                                    'quarter_code' => $quarter,
                                    'status' => 'blocked',
                                    'reason' => 'Report is already approved.',
                                ]);
                            }

                            ReportImportChange::create([
                                'report_import_id' => $reportImport->id,
                                'report_import_quarter_id' => $quarterImport->id,
                                'report_submission_id' => $submission->id,
                                'indicator_id' => $value['indicator_id'],
                                'indicator_code' => $value['indicator_code'],
                                'indicator_name' => $value['indicator_name'],

                                'old_male' => null,
                                'old_female' => null,
                                'old_total' => null,

                                'new_male' => $newMale,
                                'new_female' => $newFemale,
                                'new_total' => $newTotal,

                                'status' => 'blocked',
                                'reason' => 'Report is already approved.',
                            ]);

                            $blockedChanges++;

                            continue;
                        }

                        /*
                        * DRAFT / REJECTED
                        * Create the missing indicator value.
                        */
                        ReportValue::create([
                            'report_submission_id' => $submission->id,
                            'indicator_id' => $value['indicator_id'],
                            'male' => $newMale,
                            'female' => $newFemale,
                            'total' => $newTotal,
                        ]);

                        if (!$quarterImport) {
                            $quarterImport = ReportImportQuarter::create([
                                'report_import_id' => $reportImport->id,
                                'report_submission_id' => $submission->id,
                                'reporting_period_id' => $period->id,
                                'quarter_code' => $quarter,
                                'status' => 'updated',
                            ]);
                        }

                        ReportImportChange::create([
                            'report_import_id' => $reportImport->id,
                            'report_import_quarter_id' => $quarterImport->id,
                            'report_submission_id' => $submission->id,
                            'indicator_id' => $value['indicator_id'],
                            'indicator_code' => $value['indicator_code'],
                            'indicator_name' => $value['indicator_name'],

                            'old_male' => null,
                            'old_female' => null,
                            'old_total' => null,

                            'new_male' => $newMale,
                            'new_female' => $newFemale,
                            'new_total' => $newTotal,

                            'status' => 'changed',
                            'reason' => 'Indicator value was added.',
                        ]);

                        $changedIndicators++;

                        continue;
                    }

                    /*
                    * INDICATOR ALREADY EXISTS
                    */

                    $oldMale = (float) $existing->male;
                    $oldFemale = (float) $existing->female;
                    $oldTotal = (float) $existing->total;

                    $changed =
                        $oldMale !== $newMale ||
                        $oldFemale !== $newFemale;

                    if (!$changed) {
                        continue;
                    }

                    $hasChanges = true;

                    if (!$quarterImport) {
                        $quarterImport = ReportImportQuarter::create([
                            'report_import_id' => $reportImport->id,
                            'report_submission_id' => $submission->id,
                            'reporting_period_id' => $period->id,
                            'quarter_code' => $quarter,
                            'status' => $isApproved
                                ? 'blocked'
                                : 'updated',
                            'reason' => $isApproved
                                ? 'Report is already approved.'
                                : null,
                        ]);
                    }

                    /*
                    * APPROVED → BLOCK
                    */
                    if ($isApproved) {

                        ReportImportChange::create([
                            'report_import_id' => $reportImport->id,
                            'report_import_quarter_id' => $quarterImport->id,
                            'report_submission_id' => $submission->id,
                            'indicator_id' => $value['indicator_id'],
                            'indicator_code' => $value['indicator_code'],
                            'indicator_name' => $value['indicator_name'],

                            'old_male' => $oldMale,
                            'old_female' => $oldFemale,
                            'old_total' => $oldTotal,

                            'new_male' => $newMale,
                            'new_female' => $newFemale,
                            'new_total' => $newTotal,

                            'status' => 'blocked',
                            'reason' => 'Report is already approved.',
                        ]);

                        $blockedChanges++;

                        continue;
                    }

                    /*
                    * DRAFT / REJECTED → UPDATE
                    */
                    $existing->update([
                        'male' => $newMale,
                        'female' => $newFemale,
                        'total' => $newTotal,
                    ]);

                    ReportImportChange::create([
                        'report_import_id' => $reportImport->id,
                        'report_import_quarter_id' => $quarterImport->id,
                        'report_submission_id' => $submission->id,
                        'indicator_id' => $value['indicator_id'],
                        'indicator_code' => $value['indicator_code'],
                        'indicator_name' => $value['indicator_name'],

                        'old_male' => $oldMale,
                        'old_female' => $oldFemale,
                        'old_total' => $oldTotal,

                        'new_male' => $newMale,
                        'new_female' => $newFemale,
                        'new_total' => $newTotal,

                        'status' => 'changed',
                    ]);

                    $changedIndicators++;
                }

                /*
                * No changes
                */
                if (!$hasChanges) {

                    ReportImportQuarter::create([
                        'report_import_id' => $reportImport->id,
                        'report_submission_id' => $submission->id,
                        'reporting_period_id' => $period->id,
                        'quarter_code' => $quarter,
                        'status' => 'unchanged',
                    ]);

                    $unchangedQuarters++;

                    continue;
                }

                /*
                * Update quarter counters
                */
                if ($isApproved) {
                    $blockedQuarters++;
                } else {
                    $updatedQuarters++;
                }
            }

            $reportImport->update([
                'new_quarters_count' => $newQuarters,
                'updated_quarters_count' => $updatedQuarters,
                'unchanged_quarters_count' => $unchangedQuarters,
                'blocked_quarters_count' => $blockedQuarters,
                'changed_indicators_count' => $changedIndicators,
                'blocked_changes_count' => $blockedChanges,
            ]);

            return $reportImport;
        });

        $request->session()->forget('report_import_preview');

        return redirect()
        ->route('justine.reports.index', [
            'reportType' => $preview['report_type_slug'],   
        ])
        ->with(
            'success',
            "{$preview['report_type_name']} Excel import completed successfully."
        );
    }

    public function importHistory(): Response
    {
        $imports = ReportImport::query()
            ->with([
                'user:id,name',
                'lgu:id,name',
                'reportType:id,code,name',
            ])
            ->latest()
            ->paginate(20);

        return Inertia::render(
            'Justine/HWPSC/ImportHistory/Index',
            [
                'imports' => $imports,
            ]
        );
    }

    public function importHistoryShow(ReportImport $reportImport): Response 
    {
        $reportImport->load([
            'user:id,name',
            'lgu:id,name',
            'reportType:id,code,name',

            'quarters.reportingPeriod:id,year,quarter_id',
            'quarters.reportingPeriod.quarter:id,code,name',

            'changes.indicator:id,code,name',
            'changes.quarter',
        ]);

        return Inertia::render(
            'Justine/HWPSC/ImportHistory/Show',
            [
                'import' => $reportImport,
            ]
        );
    }

    public function validateAgainstFhsis(Request $request, string $reportType, ReportSubmission $submission, FhsisComparisonService $comparisonService): RedirectResponse 
    {
        /*
        |--------------------------------------------------------------------------
        | Determine report type
        |--------------------------------------------------------------------------
        */

        $reportTypeModel = $this->resolveReportType($reportType);

        abort_unless(
            $submission->report_type_id === $reportTypeModel->id,
            404
        );

        $routeReportType = $request->route('reportType');

        $reportTypeSlug = is_string($routeReportType)
            ? $routeReportType
            : 'hwpsc';

        $reportType = $this->reportType($reportTypeSlug);

        /*
        |--------------------------------------------------------------------------
        | Get submission ID
        |--------------------------------------------------------------------------
        */

        $routeSubmission = $request->route('submission');

        $submissionId = $routeSubmission instanceof ReportSubmission
            ? $routeSubmission->id
            : $routeSubmission;

        abort_unless(
            is_numeric($submissionId),
            404,
            'Invalid report submission.'
        );

        /*
        |--------------------------------------------------------------------------
        | Load submission
        |--------------------------------------------------------------------------
        */

        $submission = ReportSubmission::query()
            ->where('id', $submissionId)
            ->where('report_type_id', $reportType->id)
            ->with([
                'reportingPeriod',
                'status',
            ])
            ->firstOrFail();

        /*
        |--------------------------------------------------------------------------
        | Only submitted reports can be validated
        |--------------------------------------------------------------------------
        */

        abort_unless(
            $submission->status?->code === 'submitted',
            403,
            'Only submitted reports can be validated.'
        );

        /*
        |--------------------------------------------------------------------------
        | FHSIS comparison
        |--------------------------------------------------------------------------
        */

        // $comparison = $comparisonService->compare(
        //     $submission->reportingPeriod->year,
        //     $submission->reportingPeriod->quarter_id,
        //     $submission->lgu_id
        // );

        $comparison = $comparisonService->compare(
            reportType: $reportTypeModel,
            year: $submission->reportingPeriod->year,
            quarterId: $submission->reportingPeriod->quarter_id,
            lguId: $submission->lgu_id,
        );

        $rows = collect($comparison['rows']);

        $discrepancies = $rows
            ->where('status', 'discrepancy')
            ->values();

        $notComparable = $rows
            ->where('status', 'not_comparable')
            ->values();

        /*
        |--------------------------------------------------------------------------
        | DISCREPANCY
        |--------------------------------------------------------------------------
        */

        if ($discrepancies->isNotEmpty()) {
            $details = $discrepancies
                ->map(function ($row) {
                    return [
                        'indicator_id' => $row['indicator_id'],
                        'indicator_code' => $row['indicator_code'],
                        'indicator_name' => $row['indicator_name'],

                        'lgu' => [
                            'male' => $row['lgu']['male'],
                            'female' => $row['lgu']['female'],
                            'total' => $row['lgu']['total'],
                        ],

                        'fhsis' => [
                            'male' => $row['fhsis']['male'],
                            'female' => $row['fhsis']['female'],
                            'total' => $row['fhsis']['total'],
                        ],

                        'difference' => [
                            'male' => $row['difference']['male'],
                            'female' => $row['difference']['female'],
                            'total' => $row['difference']['total'],
                        ],
                    ];
                })
                ->values()
                ->toArray();

            $submission->update([
                'validation_status' => 'discrepancy',

                'validated_at' => null,
                'validated_by' => null,

                'validation_remarks' =>
                    'This report cannot be approved because ' .
                    $discrepancies->count() .
                    ' indicator(s) do not match the current FHSIS data.',

                'validation_details' => $details,
            ]);

            return back()->with([
                'validation_result' => [
                    'status' => 'discrepancy',

                    'message' =>
                        'The report has discrepancies with FHSIS.',

                    'count' => $discrepancies->count(),
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | NOT COMPARABLE
        |--------------------------------------------------------------------------
        */

        if ($notComparable->isNotEmpty()) {
            $details = $notComparable
                ->map(function ($row) {
                    return [
                        'indicator_id' => $row['indicator_id'],
                        'indicator_code' => $row['indicator_code'],
                        'indicator_name' => $row['indicator_name'],

                        'lgu' => [
                            'male' => $row['lgu']['male'],
                            'female' => $row['lgu']['female'],
                            'total' => $row['lgu']['total'],
                        ],

                        'fhsis' => [
                            'male' => $row['fhsis']['male'],
                            'female' => $row['fhsis']['female'],
                            'total' => $row['fhsis']['total'],
                        ],

                        'difference' => [
                            'male' => $row['difference']['male'],
                            'female' => $row['difference']['female'],
                            'total' => $row['difference']['total'],
                        ],
                    ];
                })
                ->values()
                ->toArray();

            $submission->update([
                'validation_status' => 'not_comparable',

                'validated_at' => null,
                'validated_by' => null,

                'validation_remarks' =>
                    $notComparable->count() .
                    ' indicator(s) cannot be compared because required data is missing.',

                'validation_details' => $details,
            ]);

            return back()->with([
                'validation_result' => [
                    'status' => 'not_comparable',

                    'message' =>
                        'The report cannot be validated because some data is missing.',

                    'count' => $notComparable->count(),
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDATED
        |--------------------------------------------------------------------------
        */

        $submission->update([
            'validation_status' => 'validated',

            'validated_at' => now(),

            'validated_by' => auth()->id(),

            'validation_remarks' =>
                'LGU report matched the current FHSIS data.',

            'validation_details' => null,
        ]);

        return back()->with([
            'success' =>
                'LGU report successfully validated against FHSIS.',
        ]);
    }

    public function bulkSubmit(Request $request, string $reportType): RedirectResponse 
    {

        $reportTypeModel = $this->resolveReportType($reportType);

        $data = $request->validate([
            'submission_ids' => [
                'required',
                'array',
                'min:1',
            ],

            'submission_ids.*' => [
                'integer',
                'exists:report_submissions,id',
            ],
        ]);

        $submittedStatus = SubmissionStatus::where(
            'code',
            'submitted'
        )->firstOrFail();

        $submissions = ReportSubmission::with([
            'status',
            'reportType',
        ])
            ->whereIn('id', $data['submission_ids'])
            ->get();

        $submitted = 0;

        foreach ($submissions as $submission) {
            abort_unless(
                $submission->report_type_id === $reportTypeModel->id,
                404
            );

            if (!in_array(
                $submission->status->code,
                ['draft', 'rejected']
            )) {
                continue;
            }

            $submission->update([
                'status_id' => $submittedStatus->id,
                'submitted_by' => auth()->id(),
                'submitted_at' => now(),

                'validation_status' => 'not_checked',
                'validated_at' => null,
                'validated_by' => null,
                'validation_remarks' => null,
                'validation_details' => null,
            ]);

            $submitted++;
        }

        return back()->with(
            'success',
            "{$submitted} {$reportTypeModel->name} report(s) submitted successfully."
        );
    }

    public function bulkValidateAgainstFhsis(Request $request, string $reportType, FhsisComparisonService $comparisonService): RedirectResponse 
    {
        $reportTypeModel = $this->resolveReportType($reportType);
        $data = $request->validate([
            'submission_ids' => [
                'required',
                'array',
                'min:1',
            ],

            'submission_ids.*' => [
                'integer',
                'exists:report_submissions,id',
            ],
        ]);

        $submissions = ReportSubmission::with([
            'status',
            'reportType',
            'reportingPeriod',
        ])
            ->whereIn('id', $data['submission_ids'])
            ->get();

        $validated = 0;
        $discrepancies = 0;
        $notComparable = 0;

        foreach ($submissions as $submission) {
            abort_unless(
                $submission->report_type_id === $reportTypeModel->id,
                404
            );

            if ($submission->status->code !== 'submitted') {
                continue;
            }

            $comparison = $comparisonService->compare(
                reportType: $reportTypeModel,
                year: $submission->reportingPeriod->year,
                quarterId: $submission->reportingPeriod->quarter_id,
                lguId: $submission->lgu_id,
            );

            $rows = collect(
                $comparison['rows']
            );

            $discrepancyRows = $rows
                ->where('status', 'discrepancy')
                ->values();

            $notComparableRows = $rows
                ->where('status', 'not_comparable')
                ->values();

            /*
            |--------------------------------------------------------------------------
            | DISCREPANCY
            |--------------------------------------------------------------------------
            */

            if ($discrepancyRows->isNotEmpty()) {
                $details = $discrepancyRows
                    ->map(function ($row) {
                        return [
                            'indicator_id' =>
                                $row['indicator_id'],

                            'indicator_code' =>
                                $row['indicator_code'],

                            'indicator_name' =>
                                $row['indicator_name'],

                            'lgu' => [
                                'male' =>
                                    $row['lgu']['male'],

                                'female' =>
                                    $row['lgu']['female'],

                                'total' =>
                                    $row['lgu']['total'],
                            ],

                            'fhsis' => [
                                'male' =>
                                    $row['fhsis']['male'],

                                'female' =>
                                    $row['fhsis']['female'],

                                'total' =>
                                    $row['fhsis']['total'],
                            ],

                            'difference' => [
                                'male' =>
                                    $row['difference']['male'],

                                'female' =>
                                    $row['difference']['female'],

                                'total' =>
                                    $row['difference']['total'],
                            ],
                        ];
                    })
                    ->values()
                    ->toArray();

                $submission->update([
                    'validation_status' =>
                        'discrepancy',

                    'validated_at' => null,

                    'validated_by' => null,

                    'validation_remarks' =>
                        'This report cannot be approved because ' .
                        $discrepancyRows->count() .
                        ' indicator(s) do not match the current FHSIS data.',

                    'validation_details' =>
                        $details,
                ]);

                $discrepancies++;

                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | NOT COMPARABLE
            |--------------------------------------------------------------------------
            */

            if ($notComparableRows->isNotEmpty()) {
                $details = $notComparableRows
                    ->map(function ($row) {
                        return [
                            'indicator_id' =>
                                $row['indicator_id'],

                            'indicator_code' =>
                                $row['indicator_code'],

                            'indicator_name' =>
                                $row['indicator_name'],

                            'lgu' =>
                                $row['lgu'],

                            'fhsis' =>
                                $row['fhsis'],

                            'difference' =>
                                $row['difference'],
                        ];
                    })
                    ->values()
                    ->toArray();

                $submission->update([
                    'validation_status' =>
                        'not_comparable',

                    'validated_at' => null,

                    'validated_by' => null,

                    'validation_remarks' =>
                        $notComparableRows->count() .
                        ' indicator(s) cannot be compared because required data is missing.',

                    'validation_details' =>
                        $details,
                ]);

                $notComparable++;

                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | VALIDATED
            |--------------------------------------------------------------------------
            */

            $submission->update([
                'validation_status' =>
                    'validated',

                'validated_at' =>
                    now(),

                'validated_by' =>
                    auth()->id(),

                'validation_remarks' =>
                    'LGU report matched the current FHSIS data.',

                'validation_details' =>
                    null,
            ]);

            $validated++;
        }

        return back()->with(
            'success',
            "FHSIS validation completed. " .
            "{$validated} validated, " .
            "{$discrepancies} with discrepancies, " .
            "{$notComparable} not comparable."
        );
    }

    public function bulkApprove(Request $request, string $reportType): RedirectResponse
    {

        $reportTypeModel = $this->resolveReportType($reportType);
        $data = $request->validate([
            'submission_ids' => [
                'required',
                'array',
                'min:1',
            ],

            'submission_ids.*' => [
                'integer',
                'exists:report_submissions,id',
            ],
        ]);

        $approvedStatus = SubmissionStatus::where(
            'code',
            'approved'
        )->firstOrFail();

        $submissions = ReportSubmission::with([
            'status',
            'reportType',
        ])
            ->whereIn('id', $data['submission_ids'])
            ->get();

        $approved = 0;

        foreach ($submissions as $submission) {
            abort_unless(
                $submission->report_type_id === $reportTypeModel->id,
                404
            );

            if (
                $submission->status->code !== 'submitted'
            ) {
                continue;
            }

            if (
                $submission->validation_status !==
                'validated'
            ) {
                continue;
            }

            $submission->update([
                'status_id' =>
                    $approvedStatus->id,
            ]);

            $approved++;
        }

        return back()->with(
            'success',
            "{$approved} {$reportTypeModel->name} report(s) approved successfully."
        );
    }

    public function bulkReject(Request $request, string $reportType): RedirectResponse 
    {

        $reportTypeModel = $this->resolveReportType($reportType);
        $data = $request->validate([
            'submission_ids' => [
                'required',
                'array',
                'min:1',
            ],

            'submission_ids.*' => [
                'integer',
                'exists:report_submissions,id',
            ],

            'remarks' => [
                'required',
                'string',
                'max:2000',
            ],
        ]);

        $rejectedStatus = SubmissionStatus::where(
            'code',
            'rejected'
        )->firstOrFail();

        $submissions = ReportSubmission::with([
            'status',
            'reportType',
        ])
            ->whereIn('id', $data['submission_ids'])
            ->get();

        $rejected = 0;

        foreach ($submissions as $submission) {
            abort_unless(
                $submission->report_type_id === $reportTypeModel->id,
                404
            );

            if (
                $submission->status->code !== 'submitted'
            ) {
                continue;
            }

            $submission->update([
                'status_id' =>
                    $rejectedStatus->id,

                'remarks' =>
                    $data['remarks'],

                'validation_status' =>
                    'not_checked',

                'validated_at' =>
                    null,

                'validated_by' =>
                    null,

                'validation_remarks' =>
                    null,

                'validation_details' =>
                    null,
            ]);

            $rejected++;
        }

        return back()->with(
            'success',
            "{$rejected} {$reportTypeModel->name} report(s) rejected."
        );
    }

    public function emailRecipients(Request $request)
    {
        $validated = $request->validate([
            'submission_ids' => [
                'required',
                'array',
                'min:1',
            ],

            'submission_ids.*' => [
                'integer',
                'exists:report_submissions,id',
            ],
        ]);

        $submissions = ReportSubmission::with([
            'lgu',
            'reportType',
            'reportingPeriod.quarter',
        ])
            ->whereIn(
                'id',
                $validated['submission_ids']
            )
            ->get();

        $result = $submissions->map(function ($submission) {

            $emails = LguReportEmail::query()
                ->where('lgu_id', $submission->lgu_id)
                ->where(
                    'report_type_id',
                    $submission->report_type_id
                )
                ->where('is_active', true)
                ->orderBy('email')
                ->get([
                    'id',
                    'email',
                    'contact_name',
                ]);

            return [
                'submission_id' => $submission->id,

                'lgu_id' => $submission->lgu_id,

                'lgu_name' => $submission->lgu->name,

                'report_type_id' =>
                    $submission->report_type_id,

                'report_type' =>
                    $submission->reportType->name,

                'year' =>
                    $submission->reportingPeriod->year,

                'quarter' =>
                    $submission->reportingPeriod->quarter->name,

                'emails' => $emails,
            ];
        });

        return response()->json($result);
    }

    public function sendEmail(Request $request)
    {
        $validated = $request->validate([
            'recipients' => [
                'required',
                'array',
                'min:1',
            ],

            'recipients.*.submission_id' => [
                'required',
                'integer',
                'exists:report_submissions,id',
            ],

            'recipients.*.email_ids' => [
                'required',
                'array',
                'min:1',
            ],

            'recipients.*.email_ids.*' => [
                'integer',
                'exists:lgu_report_emails,id',
            ],

            'subject' => [
                'required',
                'string',
                'max:255',
            ],

            'message' => [
                'required',
                'string',
            ],
        ]);

        $sent = 0;
        $failed = 0;

        foreach ($validated['recipients'] as $recipient) {

            $submission = ReportSubmission::with([
                'lgu',
                'reportType',
                'reportingPeriod.quarter',
            ])->findOrFail(
                $recipient['submission_id']
            );

            $emails = LguReportEmail::query()
                ->whereIn(
                    'id',
                    $recipient['email_ids']
                )
                ->where('lgu_id', $submission->lgu_id)
                ->where(
                    'report_type_id',
                    $submission->report_type_id
                )
                ->where('is_active', true)
                ->get();

            foreach ($emails as $email) {

                try {

                    Mail::to($email->email)
                        ->send(
                            new ReportNotificationMail(
                                $validated['subject'],
                                $validated['message'],
                                $submission
                            )
                        );

                    EmailLog::create([
                        'report_submission_id' =>
                            $submission->id,

                        'lgu_report_email_id' =>
                            $email->id,

                        'sent_by' =>
                            auth()->id(),

                        'recipient_email' =>
                            $email->email,

                        'recipient_name' =>
                            $email->contact_name,

                        'subject' =>
                            $validated['subject'],

                        'message' =>
                            $validated['message'],

                        'status' =>
                            'sent',

                        'sent_at' =>
                            now(),
                    ]);

                    $sent++;

                } catch (\Throwable $e) {

                    EmailLog::create([
                        'report_submission_id' =>
                            $submission->id,

                        'lgu_report_email_id' =>
                            $email->id,

                        'sent_by' =>
                            auth()->id(),

                        'recipient_email' =>
                            $email->email,

                        'recipient_name' =>
                            $email->contact_name,

                        'subject' =>
                            $validated['subject'],

                        'message' =>
                            $validated['message'],

                        'status' =>
                            'failed',

                        'error_message' =>
                            $e->getMessage(),
                    ]);

                    $failed++;
                }
            }
        }

        return back()->with(
            'success',
            "Email processing completed. Sent: {$sent}, Failed: {$failed}."
        );
    }
}