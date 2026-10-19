<?php

namespace App\Http\Controllers;

use App\Models\ReportSubmission;
use App\Http\Requests\StoreReportSubmissionRequest;
use App\Http\Requests\UpdateReportSubmissionRequest;

class ReportSubmissionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
     public function store(StoreReportSubmissionRequest $request)
    {
        $validated = $request->validated();

        $exists = ReportSubmission::where('lgu_id', $validated['lgu_id'])
            ->where('report_type_id', $validated['report_type_id'])
            ->where('reporting_period_id', $validated['reporting_period_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'A report submission already exists for this LGU, report type, and reporting period.',
            ], 422);
        }

        $submission = ReportSubmission::create($validated);

        return response()->json([
            'message' => 'Report submission created successfully.',
            'data' => $submission,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ReportSubmission $reportSubmission)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ReportSubmission $reportSubmission)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateReportSubmissionRequest $request, ReportSubmission $reportSubmission)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ReportSubmission $reportSubmission)
    {
        //
    }
}
