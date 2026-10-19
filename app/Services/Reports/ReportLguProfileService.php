<?php

namespace App\Services\Reports;

use App\Models\Lgu;
use App\Models\Quarter;
use App\Models\ReportSection;
use App\Models\ReportSubmission;
use App\Models\ReportType;

class ReportLguProfileService
{
    public function build(ReportType $reportType, Lgu $lgu, int $year): array
    {
        $quarters = Quarter::query()
            ->whereIn('code', ['Q1', 'Q2', 'Q3', 'Q4'])
            ->orderBy('sort_order')
            ->get(['id', 'code', 'name', 'sort_order']);

        // Match the HWPSC dashboard's data source: every active section for the report type.
        $sections = ReportSection::query()
            ->where('report_type_id', $reportType->id)
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('id')
            ->get(['id', 'report_type_id', 'parent_id', 'code', 'name', 'description', 'display_order']);

        $sectionIds = $sections->pluck('id');

        // Do not rely on the Eloquent section->indicators relationship here.
        // Load the same active indicators used by HWPSCDashboardService.
        $indicators = \App\Models\Indicator::query()
            ->whereIn('report_section_id', $sectionIds)
            ->where('is_active', true)
            ->orderBy('report_section_id')
            ->orderBy('display_order')
            ->orderBy('id')
            ->get(['id', 'report_section_id', 'code', 'name', 'display_order']);

        // HWPSC has a known normalized indicator set. If section metadata is
        // incomplete, fall back to indicators actually present in HWPSC values.
        if ($reportType->code === 'HWPSC') {
            $hwpscCodes = [
                'GERIATRIC_SCREENING_TARGET', 'SENIOR_CITIZENS_SCREENED',
                'SENIOR_CITIZENS_POSITIVE_SCREENING', 'MEMORY', 'DEPRESSION',
                'POLYPHARMACY', 'URINARY_INCONTINENCE', 'FUNCTIONAL_CAPACITY',
                'FALL', 'MALNUTRITION', 'HEARING', 'VISION',
                'SENIOR_CITIZENS_ICP_REFERRED', 'SENIOR_CITIZENS_SEEN',
                'SENIOR_CITIZENS_NOT_PREVIOUSLY_PPV', 'SENIOR_CITIZENS_VACCINATED_TOTAL',
                'ANTI_PNEUMOCOCCAL_VACCINE', 'ANTI_INFLUENZA_VACCINE', 'OTHER_VACCINE',
            ];

            $existingCodes = $indicators->pluck('code')->all();
            $missingCodes = array_values(array_diff($hwpscCodes, $existingCodes));

            if ($missingCodes) {
                $fallbackIndicators = \App\Models\Indicator::query()
                    ->whereIn('code', $missingCodes)
                    ->where('is_active', true)
                    ->orderBy('display_order')
                    ->orderBy('id')
                    ->get(['id', 'report_section_id', 'code', 'name', 'display_order']);

                $indicators = $indicators->concat($fallbackIndicators)->unique('id')->values();
            }
        }

        $submissions = ReportSubmission::query()
            ->with([
                'reportingPeriod.quarter:id,code,name,sort_order',
                'status:id,code,name',
                'validator:id,name',
            ])
            ->where('lgu_id', $lgu->id)
            ->where('report_type_id', $reportType->id)
            ->whereHas('reportingPeriod', fn ($q) => $q->where('year', $year))
            ->get()
            ->sortBy(fn ($submission) => $submission->reportingPeriod?->quarter?->sort_order ?? 999)
            ->values();

        $values = $submissions->isEmpty()
            ? collect()
            : \App\Models\ReportValue::query()
                ->with('indicator:id,report_section_id,code,name,display_order')
                ->whereIn('report_submission_id', $submissions->pluck('id'))
                ->get();

        $valuesBySubmission = $values->groupBy('report_submission_id');

        $indicatorRows = $indicators->map(function ($indicator) use ($quarters, $submissions, $valuesBySubmission) {
            $quarterValues = $quarters->mapWithKeys(function ($quarter) use ($submissions, $valuesBySubmission, $indicator) {
                $submission = $submissions->first(
                    fn ($item) => $item->reportingPeriod?->quarter_id === $quarter->id
                );

                $value = $submission
                    ? $valuesBySubmission->get($submission->id, collect())->first(
                        fn ($item) => $item->indicator?->id === $indicator->id
                    )
                    : null;

                return [
                    $quarter->code => [
                        'submission_id' => $submission?->id,
                        'status' => $submission?->status?->code,
                        'status_name' => $submission?->status?->name,
                        'male' => $value?->male !== null ? (float) $value->male : null,
                        'female' => $value?->female !== null ? (float) $value->female : null,
                        'total' => $value?->total !== null ? (float) $value->total : null,
                        'has_data' => $value !== null,
                    ],
                ];
            })->all();

            return [
                'id' => $indicator->id,
                'report_section_id' => $indicator->report_section_id,
                'code' => $indicator->code,
                'name' => $indicator->name,
                'display_order' => $indicator->display_order,
                'quarters' => $quarterValues,
            ];
        })->values();

        $sectionPayload = $sections->map(function ($section) use ($indicatorRows) {
            return [
                'id' => $section->id,
                'code' => $section->code,
                'name' => $section->name,
                'description' => $section->description,
                'display_order' => $section->display_order,
                'parent_id' => $section->parent_id,
                'indicators' => $indicatorRows
                    ->where('report_section_id', $section->id)
                    ->values()
                    ->all(),
            ];
        })->filter(fn ($section) => count($section['indicators']) > 0)->values()->all();


        // Keep HWPSC usable even when its legacy section metadata is incomplete.
        // Any HWPSC indicators that are not attached to an active section are
        // placed in one synthetic section for the profile UI.
        if ($reportType->code === 'HWPSC') {
            $shownIndicatorIds = collect($sectionPayload)
                ->flatMap(fn ($section) => collect($section['indicators'])->pluck('id'))
                ->all();

            $unattached = $indicatorRows
                ->reject(fn ($indicator) => in_array($indicator['id'], $shownIndicatorIds, true))
                ->values()
                ->all();

            if ($unattached) {
                $sectionPayload[] = [
                    'id' => 0,
                    'code' => 'HWPSC_INDICATORS',
                    'name' => 'HWPSC Indicators',
                    'description' => 'HWPSC indicators loaded from the normalized report data.',
                    'display_order' => 999999,
                    'parent_id' => null,
                    'indicators' => $unattached,
                ];
            }
        }

        $submissionPayload = $submissions->map(fn ($submission) => [
            'id' => $submission->id,
            'quarter_id' => $submission->reportingPeriod?->quarter_id,
            'quarter' => $submission->reportingPeriod?->quarter?->code,
            'quarter_name' => $submission->reportingPeriod?->quarter?->name,
            'year' => $submission->reportingPeriod?->year,
            'status' => $submission->status?->code,
            'status_name' => $submission->status?->name,
            'validation_status' => $submission->validation_status,
            'validated_at' => optional($submission->validated_at)->toIso8601String(),
            'validation_remarks' => $submission->validation_remarks,
            'validator' => $submission->validator?->name,
            'remarks' => $submission->remarks,
        ])->values();

        $reportedQuarters = $submissions->pluck('reportingPeriod.quarter_id')->filter()->unique()->count();
        $latestSubmission = $submissions->sortByDesc(
            fn ($submission) => $submission->reportingPeriod?->quarter?->sort_order ?? 0
        )->first();

        return [
            'year' => $year,
            'lgu' => [
                'id' => $lgu->id,
                'name' => $lgu->name,
            ],
            'report_type' => [
                'id' => $reportType->id,
                'code' => $reportType->code,
                'name' => $reportType->name,
                'slug' => $reportType->slug,
            ],
            'quarters' => $quarters->map(fn ($quarter) => [
                'id' => $quarter->id,
                'code' => $quarter->code,
                'name' => $quarter->name,
            ])->values()->all(),
            'summary' => [
                'indicator_count' => $indicatorRows->count(),
                'reported_quarters' => $reportedQuarters,
                'total_quarters' => $quarters->count(),
                'latest_status' => $latestSubmission?->status?->code,
                'latest_status_name' => $latestSubmission?->status?->name,
                'value_count' => $values->count(),
            ],
            'sections' => $sectionPayload,
            'submissions' => $submissionPayload->all(),
            'generated_at' => now()->toIso8601String(),
        ];
    }
}
