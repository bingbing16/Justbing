<?php

namespace App\Services\HWPSC;

use App\Models\FhsisReport;
use App\Models\Lgu;
use App\Models\Quarter;
use App\Models\ReportSubmission;
use App\Models\ReportType;
use App\Models\ReportValidationHistory;
use Illuminate\Support\Collection;

class HWPSCLguProfileService
{
    private array $codes = [
        'target' => 'GERIATRIC_SCREENING_TARGET',
        'screened' => 'SENIOR_CITIZENS_SCREENED',
        'positive' => 'SENIOR_CITIZENS_POSITIVE_SCREENING',
        'memory' => 'MEMORY',
        'depression' => 'DEPRESSION',
        'polypharmacy' => 'POLYPHARMACY',
        'urinary_incontinence' => 'URINARY_INCONTINENCE',
        'functional_capacity' => 'FUNCTIONAL_CAPACITY',
        'fall' => 'FALL',
        'malnutrition' => 'MALNUTRITION',
        'hearing' => 'HEARING',
        'vision' => 'VISION',
        'referred' => 'SENIOR_CITIZENS_ICP_REFERRED',
        'seen' => 'SENIOR_CITIZENS_SEEN',
        'not_previously_ppv' => 'SENIOR_CITIZENS_NOT_PREVIOUSLY_PPV',
        'vaccinated' => 'SENIOR_CITIZENS_VACCINATED_TOTAL',
        'pneumococcal' => 'ANTI_PNEUMOCOCCAL_VACCINE',
        'influenza' => 'ANTI_INFLUENZA_VACCINE',
        'other_vaccine' => 'OTHER_VACCINE',
    ];

    private array $labels = [
        'target' => 'Target for Geriatric Screening',
        'screened' => 'Senior Citizens Screened',
        'positive' => 'Senior Citizens with at least one Positive Screening',
        'memory' => 'Memory',
        'depression' => 'Depression',
        'polypharmacy' => 'Polypharmacy',
        'urinary_incontinence' => 'Urinary Incontinence',
        'functional_capacity' => 'Functional Capacity',
        'fall' => 'Fall',
        'malnutrition' => 'Malnutrition',
        'hearing' => 'Hearing',
        'vision' => 'Vision',
        'referred' => 'ICP / Referred',
        'seen' => 'Seen at Health Facility',
        'not_previously_ppv' => 'Not Previously Received PPV',
        'vaccinated' => 'Senior Citizens Vaccinated',
        'pneumococcal' => 'Anti-Pneumococcal Vaccine',
        'influenza' => 'Anti-Influenza Vaccine',
        'other_vaccine' => 'Other Vaccine',
    ];

    public function build(ReportType $reportType, Lgu $lgu, int $year): array
    {
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
                ->with('indicator:id,code,name')
                ->whereIn('report_submission_id', $submissions->pluck('id'))
                ->get();

        $valuesBySubmission = $values->groupBy('report_submission_id');

        $quarters = Quarter::query()
            ->whereIn('code', ['Q1', 'Q2', 'Q3', 'Q4'])
            ->orderBy('sort_order')
            ->get(['id', 'code', 'name', 'sort_order']);

        $quarterly = $quarters->map(function ($quarter) use ($submissions, $valuesBySubmission) {
            $submission = $submissions->first(
                fn ($item) => $item->reportingPeriod?->quarter_id === $quarter->id
            );

            $byCode = $submission
                ? $valuesBySubmission->get($submission->id, collect())->keyBy(fn ($v) => $v->indicator?->code)
                : collect();

            $metric = fn (string $key) => $this->metric($byCode->get($this->codes[$key]));

            return [
                'quarter_id' => $quarter->id,
                'quarter' => $quarter->code,
                'quarter_name' => $quarter->name,
                'submission_id' => $submission?->id,
                'status' => $submission?->status?->code,
                'status_name' => $submission?->status?->name,
                'validation_status' => $submission?->validation_status,
                'validated_at' => optional($submission?->validated_at)->toIso8601String(),
                'target' => $metric('target'),
                'screened' => $metric('screened'),
                'positive' => $metric('positive'),
                'referred' => $metric('referred'),
                'seen' => $metric('seen'),
                'vaccinated' => $metric('vaccinated'),
                'syndromes' => collect([
                    'memory', 'depression', 'polypharmacy', 'urinary_incontinence',
                    'functional_capacity', 'fall', 'malnutrition', 'hearing', 'vision',
                ])->mapWithKeys(fn ($key) => [$key => $metric($key)])->all(),
                'vaccines' => collect([
                    'influenza', 'pneumococcal', 'other_vaccine',
                ])->mapWithKeys(fn ($key) => [$key => $metric($key)])->all(),
            ];
        })->values();

        $fhsis = $quarters->mapWithKeys(function ($quarter) use ($reportType, $lgu, $year, $submissions, $valuesBySubmission) {
            $submission = $submissions->first(
                fn ($item) => $item->reportingPeriod?->quarter_id === $quarter->id
            );

            return [
                $quarter->code => $this->compareQuarter(
                    $reportType,
                    $lgu,
                    $year,
                    $quarter->id,
                    $submission,
                    $valuesBySubmission
                ),
            ];
        })->all();

        $history = ReportValidationHistory::query()
            ->with(['validator:id,name', 'fhsisReport:id,year,quarter_id,version'])
            ->whereIn('report_submission_id', $submissions->pluck('id'))
            ->latest()
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'submission_id' => $item->report_submission_id,
                'quarter' => $item->submission?->reportingPeriod?->quarter?->code,
                'year' => $item->submission?->reportingPeriod?->year,
                'validation_status' => $item->validation_status,
                'validated_at' => optional($item->validated_at)->toIso8601String(),
                'validator' => $item->validator?->name,
                'remarks' => $item->remarks,
                'fhsis_report_id' => $item->fhsis_report_id,
                'fhsis_version' => $item->fhsisReport?->version,
                'details' => $item->details,
            ])->values();

        return [
            'year' => $year,
            'lgu' => [
                'id' => $lgu->id,
                'name' => $lgu->name,
            ],
            'summary' => $this->summary($quarterly),
            'quarterly' => $quarterly,
            'fhsis' => $fhsis,
            'validation_history' => $history,
            'submissions' => $submissions->map(fn ($submission) => [
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
            ])->values(),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    private function compareQuarter(
        ReportType $reportType,
        Lgu $lgu,
        int $year,
        int $quarterId,
        $submission,
        Collection $valuesBySubmission
    ): array {
        $fhsisReport = FhsisReport::query()
            ->where('report_type_id', $reportType->id)
            ->where('year', $year)
            ->where('quarter_id', $quarterId)
            ->where('is_current', true)
            ->latest('version')
            ->first();

        if (!$fhsisReport) {
            return [
                'available' => false,
                'status' => 'not_available',
                'report_id' => null,
                'version' => null,
                'imported_at' => null,
                'matched' => 0,
                'discrepancies' => 0,
                'not_comparable' => 0,
                'rows' => [],
            ];
        }

        $lguByCode = $submission
            ? $valuesBySubmission->get($submission->id, collect())->keyBy(fn ($v) => $v->indicator?->code)
            : collect();

        $fhsisValues = $fhsisReport->values()
            ->with('indicator:id,code,name')
            ->where('lgu_id', $lgu->id)
            ->get()
            ->keyBy(fn ($v) => $v->indicator?->code);

        $codes = $fhsisValues->keys()
            ->filter(fn ($code) => $code !== null)
            ->values();

        $rows = $codes->map(function ($code) use ($fhsisValues, $lguByCode) {
            $f = $fhsisValues->get($code);
            $l = $lguByCode->get($code);

            if (!$l) {
                return [
                    'code' => $code,
                    'indicator' => $f->indicator?->name ?? $code,
                    'status' => 'not_comparable',
                    'lgu' => null,
                    'fhsis' => $this->metric($f),
                    'difference' => null,
                ];
            }

            $lguMetric = $this->metric($l);
            $fhsisMetric = $this->metric($f);
            $difference = [
                'male' => $lguMetric['male'] - $fhsisMetric['male'],
                'female' => $lguMetric['female'] - $fhsisMetric['female'],
                'total' => $lguMetric['total'] - $fhsisMetric['total'],
            ];

            $matched = $difference['male'] == 0.0
                && $difference['female'] == 0.0
                && $difference['total'] == 0.0;

            return [
                'code' => $code,
                'indicator' => $f->indicator?->name ?? $code,
                'status' => $matched ? 'match' : 'discrepancy',
                'lgu' => $lguMetric,
                'fhsis' => $fhsisMetric,
                'difference' => $difference,
            ];
        })->values();

        $discrepancies = $rows->where('status', 'discrepancy')->count();
        $notComparable = $rows->where('status', 'not_comparable')->count();
        $matched = $rows->where('status', 'match')->count();

        $status = $discrepancies > 0
            ? 'discrepancy'
            : ($notComparable > 0 ? 'not_comparable' : ($matched > 0 ? 'validated' : 'not_comparable'));

        return [
            'available' => true,
            'status' => $status,
            'report_id' => $fhsisReport->id,
            'version' => $fhsisReport->version,
            'imported_at' => optional($fhsisReport->imported_at)->toIso8601String(),
            'matched' => $matched,
            'discrepancies' => $discrepancies,
            'not_comparable' => $notComparable,
            'rows' => $rows,
        ];
    }

    private function summary(Collection $quarterly): array
    {
        $totals = fn (string $metric) => $this->sumNullable(
            $quarterly->map(fn ($q) => $q[$metric]['total'] ?? null)->all()
        );

        return [
            'screened' => $totals('screened'),
            'positive' => $totals('positive'),
            'referred' => $totals('referred'),
            'seen' => $totals('seen'),
            'vaccinated' => $totals('vaccinated'),
        ];
    }

    private function metric($value): array
    {
        if (!$value) {
            return ['male' => null, 'female' => null, 'total' => null];
        }

        return [
            'male' => (float) $value->male,
            'female' => (float) $value->female,
            'total' => (float) $value->total,
        ];
    }

    private function sumNullable(array $values): ?float
    {
        $known = collect($values)->filter(fn ($value) => $value !== null);
        return $known->isEmpty() ? null : (float) $known->sum();
    }
}
