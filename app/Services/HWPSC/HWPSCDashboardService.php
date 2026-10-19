<?php

namespace App\Services\HWPSC;

use App\Models\FhsisReport;
use App\Models\Indicator;
use App\Models\ReportIndicatorFormula;
use App\Models\Lgu;
use App\Models\Quarter;
use App\Models\ReportSubmission;
use App\Models\ReportType;
use Illuminate\Support\Collection;
use App\Models\ReportSection;

class HWPSCDashboardService
{
    /**
     * Dashboard indicator codes. These are the codes used by the normalized HWPSC report.
     */
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

    public function build(ReportType $reportType, int $year, ?int $quarterId = null, ?int $lguId = null, string $status = 'all'): array
    {

        $codes = $this->codesFor($reportType);
        
        $submissions = ReportSubmission::query()
            ->with(['lgu:id,name', 'reportingPeriod.quarter:id,code,name,sort_order', 'status:id,code,name'])
            ->where('report_type_id', $reportType->id)
            ->whereHas('reportingPeriod', function ($q) use ($year, $quarterId) {
                $q->where('year', $year);
                if ($quarterId) {
                    $q->where('quarter_id', $quarterId);
                }
            })
            ->when($lguId, fn ($q) => $q->where('lgu_id', $lguId))
            ->when($status !== 'all', fn ($q) => $q->whereHas('status', fn ($s) => $s->where('code', $status)))
            ->get();

        $values = $submissions->isEmpty()
            ? collect()
            : \App\Models\ReportValue::query()
                ->with('indicator:id,code,name')
                ->whereIn('report_submission_id', $submissions->pluck('id'))
                ->get();

        $valuesBySubmission = $values->groupBy('report_submission_id');
        $rows = $submissions->map(function ($submission) use ($valuesBySubmission, $codes) {
            $byCode = $valuesBySubmission->get($submission->id, collect())
                ->keyBy(fn ($v) => $v->indicator?->code);

            $metric = function (string $key) use ($byCode, $codes): array {
                $code = $codes[$key] ?? null;
                $v = $code ? $byCode->get($code) : null;
                if (!$v) {
                    return ['male' => null, 'female' => null, 'total' => null];
                }
                return [
                    'male' => (float) $v->male,
                    'female' => (float) $v->female,
                    'total' => (float) $v->total,
                ];
            };

            return [
                'submission_id' => $submission->id,
                'lgu_id' => $submission->lgu_id,
                'lgu' => $submission->lgu?->name,
                'year' => $submission->reportingPeriod?->year,
                'quarter_id' => $submission->reportingPeriod?->quarter_id,
                'quarter' => $submission->reportingPeriod?->quarter?->code,
                'quarter_name' => $submission->reportingPeriod?->quarter?->name,
                'status' => $submission->status?->code,
                'validation_status' => $submission->validation_status,
                'metrics' => collect($codes)->mapWithKeys(fn ($_, $key) => [$key => $metric($key)])->all(),
            ];
        });

        return $this->summarize(
            $rows,
            $year,
            $quarterId,
            $lguId,
            $status,
            $reportType
        );
    }

    private function summarize(
    Collection $rows, int $year, ?int $quarterId, ?int $lguId, string $status, ReportType $reportType): array
    {
        $quarterRows = $rows->groupBy('quarter_id');
        $lguRows = $rows->groupBy('lgu_id');

        $sumMetric = function (Collection $items, string $metric, string $sex = 'total') {
            $known = $items->map(fn ($row) => $row['metrics'][$metric][$sex] ?? null)->filter(fn ($v) => $v !== null);
            return $known->isEmpty() ? null : (float) $known->sum();
        };

        $target = $sumMetric($rows, 'target');
        $screened = $sumMetric($rows, 'screened');
        $positive = $sumMetric($rows, 'positive');
        $referred = $sumMetric($rows, 'referred');
        $seen = $sumMetric($rows, 'seen');
        $vaccinated = $sumMetric($rows, 'vaccinated');

        $coverage = $this->percentageForMetric($rows, 'screened', $reportType, 'target', 100);
        $positiveRate = $this->percentageForMetric($rows, 'positive', $reportType, 'screened', 100);
        $referralRate = $this->percentageForMetric($rows, 'referred', $reportType, 'positive', 100);

        $quarterly = $quarterRows->map(function (Collection $items, $quarter) use ($sumMetric, $reportType) {
            $first = $items->first();
            $target = $sumMetric($items, 'target');
            $screened = $sumMetric($items, 'screened');
            return [
                'quarter_id' => (int) $quarter,
                'quarter' => $first['quarter'] ?? null,
                'quarter_name' => $first['quarter_name'] ?? null,
                'male' => $sumMetric($items, 'screened', 'male'),
                'female' => $sumMetric($items, 'screened', 'female'),
                'total' => $screened,
                'target' => $target,
                'coverage' => $this->percentageForMetric($items, 'screened', $reportType, 'target', 100),
                'positive' => $sumMetric($items, 'positive'),
                'referred' => $sumMetric($items, 'referred'),
            ];
        })->sortBy('quarter_id')->values();

        $lguSummary = $lguRows->map(function (Collection $items) use ($sumMetric, $reportType) {
            $first = $items->first();
            $target = $sumMetric($items, 'target');
            $screened = $sumMetric($items, 'screened');
            return [
                'lgu_id' => $first['lgu_id'],
                'lgu' => $first['lgu'],
                'target' => $target,
                'male' => $sumMetric($items, 'screened', 'male'),
                'female' => $sumMetric($items, 'screened', 'female'),
                'screened' => $screened,
                'coverage' => $this->percentageForMetric($items, 'screened', $reportType, 'target', 100),
                'positive' => $sumMetric($items, 'positive'),
                'referred' => $sumMetric($items, 'referred'),
                'seen' => $sumMetric($items, 'seen'),
                'vaccinated' => $sumMetric($items, 'vaccinated'),
                'validation_statuses' => $items->pluck('validation_status')->filter()->countBy()->all(),
            ];
        })->sortByDesc(fn ($row) => $row['screened'] ?? -1)->values();

        $syndromeKeys = [
            'memory', 'depression', 'polypharmacy', 'urinary_incontinence',
            'functional_capacity', 'fall', 'malnutrition', 'hearing', 'vision',
        ];
        $syndromes = collect($syndromeKeys)->map(function ($key) use ($rows, $sumMetric) {
            return [
                'key' => $key,
                'label' => str($key)->replace('_', ' ')->title()->toString(),
                'male' => $sumMetric($rows, $key, 'male'),
                'female' => $sumMetric($rows, $key, 'female'),
                'total' => $sumMetric($rows, $key, 'total'),
            ];
        })->sortByDesc(fn ($x) => $x['total'] ?? -1)->values();

        $vaccines = collect(['influenza', 'pneumococcal', 'other_vaccine'])->map(function ($key) use ($rows, $sumMetric) {
            return [
                'key' => $key,
                'label' => str($key)->replace('_', ' ')->title()->toString(),
                'total' => $sumMetric($rows, $key),
                'male' => $sumMetric($rows, $key, 'male'),
                'female' => $sumMetric($rows, $key, 'female'),
            ];
        });

        $statusCounts = $rows->countBy('status')->all();
        $validationCounts = $rows->countBy('validation_status')->all();

        $fhsis = $this->fhsisSummary($reportType, $year, $quarterId, $lguId);

        return [
            'filters' => compact('year', 'quarterId', 'lguId', 'status'),
            'kpis' => [
                'target' => $target,
                'screened' => $screened,
                'coverage' => $coverage,
                'positive' => $positive,
                'positive_rate' => $positiveRate,
                'referred' => $referred,
                'referral_rate' => $referralRate,
                'seen' => $seen,
                'vaccinated' => $vaccinated,
                'lgu_count' => $lguRows->count(),
                'submission_count' => $rows->count(),
            ],
            'ncr_summary' => $this->ncrSummary($rows, $reportType),
            
            // LGU-level indicator data for the selected quarter/filter.
            // This follows the Q1/Q2/Q3/Q4 workbook layout.
            'lgu_summary' => $this->lguSummary($rows, $reportType),

            'graphs' => $this->graphData($rows),
            'quarterly' => $quarterly,
            'lgus' => $lguSummary,
            'syndromes' => $syndromes,
            'vaccines' => $vaccines,
            'submission_status' => $statusCounts,
            'validation_status' => $validationCounts,
            'fhsis' => $fhsis,
            'data_quality' => $this->dataQuality($rows),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Build the LGU-level official report table.
     *
     * The dashboard rows already respect the selected year, quarter, LGU,
     * and submission-status filters. Grouping those rows by LGU gives the
     * same M/F/T/% structure used by the workbook's Q1-Q4 sheets.
     */
    private function lguSummary(Collection $rows, ReportType $reportType): array
    {
        if (! $reportType->is_active) {
            return [];
        }

        $codes = $this->codesFor($reportType);
        $formulaContext = $this->formulaContext($reportType);

        $lguRows = $rows
            ->filter(fn ($row) => ! empty($row['lgu_id']))
            ->groupBy('lgu_id');

        $indicatorRows = [];

        $indicatorsBySection = $formulaContext['indicators']
            ->groupBy('report_section_id');

        foreach ($formulaContext['sections'] as $section) {
            $sectionIndicators = $indicatorsBySection
                ->get($section->id, collect())
                ->sortBy('display_order')
                ->filter(fn ($indicator) => array_search(
                    $indicator->code,
                    $codes,
                    true
                ) !== false)
                ->values();

            if ($sectionIndicators->isEmpty()) {
                continue;
            }

            $indicatorRows[] = [
                'type' => 'section',
                'key' => 'section_' . $section->id,
                'label' => $section->name,
                'section_id' => $section->id,
                'display_order' => $section->display_order,
                'lgus' => [],
            ];

            foreach ($sectionIndicators as $indicator) {
                $code = $indicator->code;
                $key = array_search($code, $codes, true);

                if ($key === false) {
                    continue;
                }

                $formula = $formulaContext['formulas']->get($indicator->id);
                $lguMetrics = [];

                foreach ($lguRows as $lguId => $items) {
                    $metric = [
                        'male' => $this->sumMetric($items, $key, 'male'),
                        'female' => $this->sumMetric($items, $key, 'female'),
                        'total' => $this->sumMetric($items, $key, 'total'),
                    ];

                    $percentage = $formula
                        ? $this->evaluateFormula(
                            $formula->expression,
                            $this->aggregateIndicatorValues(
                                $items,
                                $formulaContext
                            )
                        )
                        : $this->fallbackPercentage($key, $items);

                    $metric['percentage'] = $percentage === null
                        ? null
                        : round(
                            (float) $percentage,
                            (int) ($formula->decimal_places ?? 2)
                        );

                    $metric['formula_configured'] = $formula !== null;
                    $metric['formula'] = $formula?->display_formula;

                    $lguMetrics[(string) $lguId] = $metric;
                }

                $indicatorRows[] = [
                    'type' => 'indicator',
                    'key' => $key,
                    'code' => $code,
                    'label' => $indicator->name ?: $this->indicatorLabel($key),
                    'section_id' => $section->id,
                    'display_order' => $indicator->display_order,
                    'lgus' => $lguMetrics,
                ];
            }
        }

        return $indicatorRows;
    }

    private function ncrSummary(Collection $rows, ReportType $reportType): array
    {
        /*
         * The NCR Summary follows the database structure:
         *
         * Report Type (active)
         *     -> Report Section (active, display_order)
         *         -> Indicator (active, display_order)
         *
         * Inactive report types, sections, and indicators are not shown.
         */
        if (! $reportType->is_active) {
            return [];
        }

        $codes = $this->codesFor($reportType);
        $formulaContext = $this->formulaContext($reportType);

        $indicatorRows = [];

        /*
         * Group active indicators by their active section.
         * The section collection is already ordered by display_order,
         * and indicators are ordered by display_order within each section.
         */
        $indicatorsBySection = $formulaContext['indicators']
            ->groupBy('report_section_id');

        foreach ($formulaContext['sections'] as $section) {
            $sectionIndicators = $indicatorsBySection
                ->get($section->id, collect())
                ->sortBy('display_order')
                ->filter(function ($indicator) use ($codes) {
                    return array_search(
                        $indicator->code,
                        $codes,
                        true
                    ) !== false;
                })
                ->values();

            /*
             * Do not render an empty section.
             */
            if ($sectionIndicators->isEmpty()) {
                continue;
            }

            /*
             * Section/header row.
             *
             * The React dashboard can use type === 'section'
             * to render this as the gray/blue category row shown
             * in the official HWPSC form.
             */
            $indicatorRows[] = [
                'type' => 'section',
                'key' => 'section_' . $section->id,
                'code' => $section->code,
                'label' => $section->name,
                'section_id' => $section->id,
                'display_order' => $section->display_order,
                'quarters' => null,
                'annual' => null,
            ];

            foreach ($sectionIndicators as $indicator) {
                $code = $indicator->code;

                /*
                 * Convert the normalized indicator code into the
                 * dashboard metric key used by the existing calculations.
                 */
                $key = array_search($code, $codes, true);

                if ($key === false) {
                    continue;
                }

                $formula = $formulaContext['formulas']->get($indicator->id);

                $quarters = [];

                foreach ([1, 2, 3, 4] as $quarterId) {
                    $quarterRows = $rows->where(
                        'quarter_id',
                        $quarterId
                    );

                    $value = [
                        'male' => $this->sumMetric(
                            $quarterRows,
                            $key,
                            'male'
                        ),
                        'female' => $this->sumMetric(
                            $quarterRows,
                            $key,
                            'female'
                        ),
                        'total' => $this->sumMetric(
                            $quarterRows,
                            $key,
                            'total'
                        ),
                    ];

                    /*
                     * Use the configured formula when available.
                     * Otherwise retain the existing HWPSC fallback
                     * percentage behavior.
                     */
                    $percentage = $formula
                        ? $this->evaluateFormula(
                            $formula->expression,
                            $this->aggregateIndicatorValues(
                                $quarterRows,
                                $formulaContext
                            )
                        )
                        : $this->fallbackPercentage(
                            $key,
                            $quarterRows
                        );

                    $value['percentage'] = $percentage === null
                        ? null
                        : round(
                            (float) $percentage,
                            (int) ($formula->decimal_places ?? 2)
                        );

                    $value['formula_configured'] = $formula !== null;
                    $value['formula'] = $formula?->display_formula;

                    $quarters[$quarterId] = $value;
                }

                /*
                 * Annual values are calculated from Q1-Q4.
                 */
                $annual = [
                    'male' => $this->sumNullable([
                        $quarters[1]['male'],
                        $quarters[2]['male'],
                        $quarters[3]['male'],
                        $quarters[4]['male'],
                    ]),
                    'female' => $this->sumNullable([
                        $quarters[1]['female'],
                        $quarters[2]['female'],
                        $quarters[3]['female'],
                        $quarters[4]['female'],
                    ]),
                    'total' => $this->sumNullable([
                        $quarters[1]['total'],
                        $quarters[2]['total'],
                        $quarters[3]['total'],
                        $quarters[4]['total'],
                    ]),
                ];

                /*
                 * Evaluate the formula against the annual aggregate.
                 * Never add quarterly percentages together.
                 */
                $annualPercentage = $formula
                    ? $this->evaluateFormula(
                        $formula->expression,
                        $this->aggregateIndicatorValues(
                            $rows,
                            $formulaContext
                        )
                    )
                    : $this->fallbackPercentage(
                        $key,
                        $rows
                    );

                $annual['percentage'] = $annualPercentage === null
                    ? null
                    : round(
                        (float) $annualPercentage,
                        (int) ($formula->decimal_places ?? 2)
                    );

                $annual['formula_configured'] = $formula !== null;
                $annual['formula'] = $formula?->display_formula;

                $indicatorRows[] = [
                    'type' => 'indicator',
                    'key' => $key,
                    'code' => $code,
                    'label' => $indicator->name ?: $this->indicatorLabel($key),
                    'section_id' => $section->id,
                    'display_order' => $indicator->display_order,
                    'quarters' => $quarters,
                    'annual' => $annual,
                ];
            }
        }

        return $indicatorRows;
    }

    /**
     * Load the active formulas and the indicator IDs needed by their expressions.
     */
    private function formulaContext(ReportType $reportType): array
    {
        /*
         * Only active sections belonging to this active report type.
         * Section display_order controls the dashboard section order.
         */
        $sections = ReportSection::query()
            ->where('report_type_id', $reportType->id)
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('id')
            ->get([
                'id',
                'report_type_id',
                'code',
                'name',
                'display_order',
            ]);

        $sectionIds = $sections->pluck('id');

        /*
         * Only active indicators belonging to the active sections.
         * Indicator display_order controls the order within its section.
         */
        $indicators = Indicator::query()
            ->whereIn('report_section_id', $sectionIds)
            ->where('is_active', true)
            ->orderBy('report_section_id')
            ->orderBy('display_order')
            ->orderBy('id')
            ->get([
                'id',
                'report_section_id',
                'code',
                'name',
                'display_order',
            ]);

        $indicatorIds = $indicators->pluck('id');

        return [
            'sections' => $sections,

            'indicators' => $indicators,

            'code_to_id' => $indicators
                ->keyBy('code')
                ->map(fn ($indicator) => $indicator->id),

            /*
             * Only active formulas belonging to active indicators
             * are allowed to affect the dashboard.
             */
            'formulas' => ReportIndicatorFormula::query()
                ->where('report_type_id', $reportType->id)
                ->where('is_active', true)
                ->whereIn('indicator_id', $indicatorIds)
                ->get()
                ->keyBy('indicator_id'),
        ];
    }

    /**
     * Convert dashboard rows into the indicator-id => M/F/Total structure
     * expected by the formula expression tree.
     */
    private function aggregateIndicatorValues(Collection $rows, array $context): Collection
    {
        $values = collect();
        $codes = $this->codesForFromContext($context);

        foreach ($context['indicators'] as $indicator) {
            $key = $codes[$indicator->code] ?? null;
            if ($key === null) {
                continue;
            }

            $values->put($indicator->id, [
                'male' => $this->sumMetric($rows, $key, 'male'),
                'female' => $this->sumMetric($rows, $key, 'female'),
                'total' => $this->sumMetric($rows, $key, 'total'),
            ]);
        }

        return $values;
    }

    /**
     * Reverse-map indicator codes to dashboard keys for the current report type.
     */
    private function codesForFromContext(array $context): array
    {
        $codes = $this->codes;

        foreach ($codes as $key => $code) {
            $codes[$code] = $key;
        }

        return $codes;
    }

    /**
     * Evaluate an active formula expression safely.
     * Supported nodes: indicator, constant, add, subtract, multiply, divide.
     */
    private function evaluateFormula($expression, Collection $values): ?float
    {
        if (!is_array($expression)) {
            return null;
        }

        $type = $expression['type'] ?? null;

        if ($type === 'indicator') {
            $indicatorId = (int) ($expression['indicator_id'] ?? 0);
            $field = $expression['field'] ?? 'total';
            $value = $values->get($indicatorId);

            if (!is_array($value) || !array_key_exists($field, $value)) {
                return null;
            }

            return $value[$field] === null ? null : (float) $value[$field];
        }

        if ($type === 'constant') {
            return isset($expression['value']) && is_numeric($expression['value'])
                ? (float) $expression['value']
                : null;
        }

        $left = $this->evaluateFormula($expression['left'] ?? null, $values);
        $right = $this->evaluateFormula($expression['right'] ?? null, $values);

        if ($left === null || $right === null) {
            return null;
        }

        return match ($type) {
            'add' => $left + $right,
            'subtract' => $left - $right,
            'multiply' => $left * $right,
            'divide' => $right == 0.0 ? null : $left / $right,
            default => null,
        };
    }

    private function fallbackPercentage(
        string $key,
        Collection $rows,
    ): ?float {
        $numerator = null;
        $denominator = null;

        switch ($key) {
            case 'screened':
                $numerator = $this->sumMetric($rows, 'screened');
                $denominator = $this->sumMetric($rows, 'target');
                break;

            case 'positive':
                $numerator = $this->sumMetric($rows, 'positive');
                $denominator = $this->sumMetric($rows, 'screened');
                break;

            case 'referred':
                $numerator = $this->sumMetric($rows, 'referred');
                $denominator = $this->sumMetric($rows, 'positive');
                break;
        }

        if ($numerator === null || $denominator === null || $denominator == 0.0) {
            return null;
        }

        return round(($numerator / $denominator) * 100, 2);
    }

    private function percentageForMetric(
        Collection $rows,
        string $key,
        ReportType $reportType,
        string $fallbackDenominatorKey,
        float $fallbackMultiplier = 100,
    ): ?float {
        $context = $this->formulaContext($reportType);
        $code = ($this->codesFor($reportType)[$key] ?? null);
        $indicatorId = $code ? ($context['code_to_id'][$code] ?? null) : null;
        $formula = $indicatorId ? $context['formulas']->get($indicatorId) : null;

        if ($formula) {
            $value = $this->evaluateFormula(
                $formula->expression,
                $this->aggregateIndicatorValues($rows, $context)
            );

            return $value === null ? null : round($value, (int) $formula->decimal_places);
        }

        $numerator = $this->sumMetric($rows, $key);
        $denominator = $this->sumMetric($rows, $fallbackDenominatorKey);

        if ($numerator === null || $denominator === null || $denominator == 0.0) {
            return null;
        }

        return round(($numerator / $denominator) * $fallbackMultiplier, 2);
    }

    private function dataQuality(Collection $rows): array
    {
        $missingScreened = $rows->filter(fn ($r) => $r['metrics']['screened']['total'] === null)->count();
        $missingTarget = $rows->filter(fn ($r) => $r['metrics']['target']['total'] === null)->count();
        $missingValidation = $rows->filter(fn ($r) => empty($r['validation_status']) || $r['validation_status'] === 'not_checked')->count();

        return [
            'rows' => $rows->count(),
            'missing_screened' => $missingScreened,
            'missing_target' => $missingTarget,
            'not_validated' => $missingValidation,
        ];
    }

    private function fhsisSummary(ReportType $reportType, int $year, ?int $quarterId, ?int $lguId): array
    {
        if (!$quarterId) {
            return ['available' => false, 'message' => 'Select a quarter to compare with FHSIS.'];
        }

        $report = FhsisReport::query()
            ->where('report_type_id', $reportType->id)
            ->where('year', $year)
            ->where('quarter_id', $quarterId)
            ->where('is_current', true)
            ->latest('version')
            ->first();

        if (!$report) {
            return ['available' => false, 'message' => 'No current FHSIS report is available for this period.'];
        }

        $query = $report->values()->with('indicator:id,code')->when($lguId, fn ($q) => $q->where('lgu_id', $lguId));
        $values = $query->get();

        $screenedCode = $this->codes['screened'];
        $screened = $values->filter(fn ($v) => $v->indicator?->code === $screenedCode);

        return [
            'available' => true,
            'report_id' => $report->id,
            'version' => $report->version,
            'imported_at' => optional($report->imported_at)->toIso8601String(),
            'screened' => [
                'male' => (float) $screened->sum('male'),
                'female' => (float) $screened->sum('female'),
                'total' => (float) $screened->sum('total'),
            ],
        ];
    }

    private function sumNullable(array $values): ?float
    {
        $known = collect($values)
            ->filter(fn ($value) => $value !== null);

        return $known->isEmpty()
            ? null
            : (float) $known->sum();
    }

    private function codesFor(ReportType $reportType): array
    {
        return match ($reportType->code) {
            'HWPSC' => [
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
            ],

            'PBP' => [
                // Add PBP indicator mappings here
            ],

            'HWPPWD' => [
                // Add HWPPWD indicator mappings here
            ],

            default => [],
        };
    }

    private function indicatorLabel(string $key): string
    {
        return match ($key) {
            'target' => 'Target for Geriatric Screening',
            'screened' => 'Total No. of Senior Citizens Screened',
            'positive' => 'Total No. of Senior Citizens with at least one Positive (+) Screening',
            'memory' => 'Memory',
            'depression' => 'Depression',
            'polypharmacy' => 'Polypharmacy',
            'urinary_incontinence' => 'Urinary Incontinence',
            'functional_capacity' => 'Functional Capacity',
            'fall' => 'Fall (History and Screening Test)',
            'malnutrition' => 'Malnutrition',
            'hearing' => 'Hearing',
            'vision' => 'Vision',
            'referred' => 'Total No. of Senior Citizens with ICP AND/OR Referred',
            'seen' => 'Total No. of Senior Citizens Seen at the health facility',
            'not_previously_ppv' => 'Senior Citizens who had NOT previously received PPV upon reaching 60 years old',
            'vaccinated' => 'Total No. of Senior Citizens Vaccinated',
            'pneumococcal' => 'Anti-Pneumococcal Vaccine',
            'influenza' => 'Anti-Influenza Vaccine',
            'other_vaccine' => 'Others',
            default => str($key)
                ->replace('_', ' ')
                ->title()
                ->toString(),
        };

        // return [
        //     'filters' => compact(
        //         'year',
        //         'quarterId',
        //         'lguId',
        //         'status'
        //     ),

        //     'kpis' => [
        //         'target' => $target,
        //         'screened' => $screened,
        //         'coverage' => $coverage,
        //         'positive' => $positive,
        //         'positive_rate' => $positiveRate,
        //         'referred' => $referred,
        //         'referral_rate' => $referralRate,
        //         'seen' => $seen,
        //         'vaccinated' => $vaccinated,
        //         'lgu_count' => $lguRows->count(),
        //         'submission_count' => $rows->count(),
        //     ],

        //     'ncr_summary' => $this->ncrSummary($rows, $reportType),

        //     'graphs' => $this->graphData($rows),

        //     'quarterly' => $quarterly,
        //     'lgus' => $lguSummary,
        //     'syndromes' => $syndromes,
        //     'vaccines' => $vaccines,
        //     'submission_status' => $statusCounts,
        //     'validation_status' => $validationCounts,
        //     'fhsis' => $fhsis,
        //     'data_quality' => $this->dataQuality($rows),
        //     'generated_at' => now()->toIso8601String(),
        // ];
    }


    private function sumMetric(Collection $items, string $metric, string $sex = 'total'): ?float 
    {
        $known = $items
            ->map(
                fn ($row) =>
                    $row['metrics'][$metric][$sex] ?? null
            )
            ->filter(
                fn ($value) => $value !== null
            );

        return $known->isEmpty()
            ? null
            : (float) $known->sum();
    }

    private function graphData(Collection $rows): array
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Screened Male vs Female by Quarter
        |--------------------------------------------------------------------------
        */

        $screenedByQuarter = collect([1, 2, 3, 4])
            ->map(function (int $quarterId) use ($rows) {
                $quarterRows = $rows->where(
                    'quarter_id',
                    $quarterId
                );

                return [
                    'quarter' => 'Q' . $quarterId,

                    'male' => $this->sumMetric(
                        $quarterRows,
                        'screened',
                        'male'
                    ),

                    'female' => $this->sumMetric(
                        $quarterRows,
                        'screened',
                        'female'
                    ),

                    'total' => $this->sumMetric(
                        $quarterRows,
                        'screened',
                        'total'
                    ),
                ];
            })
            ->values()
            ->all();

        /*
        |--------------------------------------------------------------------------
        | 2. Screened / Positive / Referred by Quarter
        |--------------------------------------------------------------------------
        */

        $screeningProgression = collect([1, 2, 3, 4])
            ->map(function (int $quarterId) use ($rows) {
                $quarterRows = $rows->where(
                    'quarter_id',
                    $quarterId
                );

                return [
                    'quarter' => 'Q' . $quarterId,

                    'screened' => $this->sumMetric(
                        $quarterRows,
                        'screened',
                        'total'
                    ),

                    'positive' => $this->sumMetric(
                        $quarterRows,
                        'positive',
                        'total'
                    ),

                    'referred' => $this->sumMetric(
                        $quarterRows,
                        'referred',
                        'total'
                    ),
                ];
            })
            ->values()
            ->all();

        /*
        |--------------------------------------------------------------------------
        | 3. Positive Geriatric Syndrome — Male vs Female
        |--------------------------------------------------------------------------
        */

        $syndromeKeys = [
            'memory',
            'depression',
            'polypharmacy',
            'urinary_incontinence',
            'functional_capacity',
            'fall',
            'malnutrition',
            'hearing',
            'vision',
        ];

        $syndromeLabels = [
            'memory' => 'Memory',
            'depression' => 'Depression',
            'polypharmacy' => 'Polypharmacy',
            'urinary_incontinence' => 'Urinary Incontinence',
            'functional_capacity' => 'Functional Capacity',
            'fall' => 'Fall',
            'malnutrition' => 'Malnutrition',
            'hearing' => 'Hearing',
            'vision' => 'Vision',
        ];

        $positiveSyndromes = collect($syndromeKeys)
            ->map(function (string $key) use (
                $rows,
                $syndromeLabels
            ) {
                return [
                    'syndrome' => $syndromeLabels[$key],

                    'male' => $this->sumMetric(
                        $rows,
                        $key,
                        'male'
                    ),

                    'female' => $this->sumMetric(
                        $rows,
                        $key,
                        'female'
                    ),

                    'total' => $this->sumMetric(
                        $rows,
                        $key,
                        'total'
                    ),
                ];
            })
            ->sortByDesc(
                fn ($row) => $row['total'] ?? 0
            )
            ->values()
            ->all();

        /*
        |--------------------------------------------------------------------------
        | 4. Vaccination by LGU
        |--------------------------------------------------------------------------
        */

        $vaccinationByLgu = $rows
            ->groupBy('lgu_id')
            ->map(function (Collection $lguRows) {
                $first = $lguRows->first();

                $vaccinated = $this->sumMetric(
                    $lguRows,
                    'vaccinated',
                    'total'
                );

                $influenza = $this->sumMetric(
                    $lguRows,
                    'influenza',
                    'total'
                );

                $pneumococcal = $this->sumMetric(
                    $lguRows,
                    'pneumococcal',
                    'total'
                );

                return [
                    'lgu_id' => $first['lgu_id'],
                    'lgu' => $first['lgu'],

                    'influenza' => $vaccinated !== null &&
                        $vaccinated > 0
                        ? round(
                            ($influenza ?? 0) /
                            $vaccinated *
                            100,
                            2
                        )
                        : null,

                    'pneumococcal' => $vaccinated !== null &&
                        $vaccinated > 0
                        ? round(
                            ($pneumococcal ?? 0) /
                            $vaccinated *
                            100,
                            2
                        )
                        : null,
                ];
            })
            ->sortBy('lgu')
            ->values()
            ->all();

        return [
            'screened_by_quarter' => $screenedByQuarter,
            'screening_progression' => $screeningProgression,
            'positive_syndromes' => $positiveSyndromes,
            'vaccination_by_lgu' => $vaccinationByLgu,
            'sex_by_lgu' => $this->sexByLgu($rows),
        ];
    }

    private function sexByLgu(Collection $rows): array
    {
        return $rows
            ->groupBy('lgu_id')
            ->map(function (Collection $lguRows) {
                $first = $lguRows->first();

                return [
                    'lgu_id' => $first['lgu_id'],
                    'lgu' => $first['lgu'],

                    'male' => $this->sumMetric(
                        $lguRows,
                        'screened',
                        'male'
                    ),

                    'female' => $this->sumMetric(
                        $lguRows,
                        'screened',
                        'female'
                    ),
                ];
            })
            ->sortBy('lgu')
            ->values()
            ->all();
    }


    
}
