<?php

namespace App\Services\Reports;

use App\Models\DashboardSection;
use App\Models\FhsisReport;
use App\Models\Indicator;
use App\Models\Lgu;
use App\Models\Quarter;
use App\Models\ReportSection;
use App\Models\ReportIndicatorFormula;
use App\Services\Reporting\ReportFormulaEngine;
use App\Models\ReportSubmission;
use App\Models\ReportType;
use Illuminate\Support\Collection;

class ReportDashboardService
{
    public function __construct(private ReportFormulaEngine $formulaEngine) {}

    public function build(
        ReportType $reportType,
        int $year,
        ?int $quarterId = null,
        ?int $lguId = null,
        string $status = 'all'
    ): array {
        $submissions = ReportSubmission::query()
            ->with([
                'lgu:id,name',
                'reportingPeriod.quarter:id,code,name,sort_order',
                'status:id,code,name',
            ])
            ->where('report_type_id', $reportType->id)
            ->whereHas('reportingPeriod', function ($query) use ($year, $quarterId) {
                $query->where('year', $year);

                if ($quarterId) {
                    $query->where('quarter_id', $quarterId);
                }
            })
            ->when($lguId, fn ($query) => $query->where('lgu_id', $lguId))
            ->when(
                $status !== 'all',
                fn ($query) => $query->whereHas(
                    'status',
                    fn ($q) => $q->where('code', $status)
                )
            )
            ->get();

        $values = $submissions->isEmpty()
            ? collect()
            : \App\Models\ReportValue::query()
                ->with([
                    'indicator:id,report_section_id,code,name,display_order',
                ])
                ->whereIn('report_submission_id', $submissions->pluck('id'))
                ->get();

        $bySubmission = $values->groupBy('report_submission_id');

        $rows = $submissions->map(function ($submission) use ($bySubmission) {
            return [
                'submission_id' => $submission->id,
                'lgu_id' => $submission->lgu_id,
                'lgu' => $submission->lgu?->name,
                'year' => $submission->reportingPeriod?->year,
                'quarter_id' => $submission->reportingPeriod?->quarter_id,
                'quarter' => $submission->reportingPeriod?->quarter?->code,
                'status' => $submission->status?->code,
                'validation_status' => $submission->validation_status,
                'values' => $bySubmission->get($submission->id, collect())
                    ->keyBy(fn ($v) => $v->indicator?->code)
                    ->map(fn ($v) => [
                        'male' => $v->male !== null ? (float) $v->male : null,
                        'female' => $v->female !== null ? (float) $v->female : null,
                        'total' => $v->total !== null ? (float) $v->total : null,
                    ])->all(),
            ];
        });

        // Resolve LGU names from the actual lgu_id as a fallback.
        $lguNames = Lgu::query()
            ->whereIn('id', $rows->pluck('lgu_id')->filter()->unique()->values())
            ->pluck('name', 'id');

        $rows = $rows->map(function (array $row) use ($lguNames) {
            if (empty($row['lgu']) && !empty($row['lgu_id'])) {
                $row['lgu'] = $lguNames->get($row['lgu_id']);
            }
            return $row;
        });

        $indicatorMap = Indicator::query()
            ->whereHas('section', fn ($q) => $q->where('report_type_id', $reportType->id))
            ->where('is_active', true)
            ->get(['id', 'code', 'name'])
            ->keyBy('code');

        $formulas = ReportIndicatorFormula::query()
            ->where('report_type_id', $reportType->id)
            ->where('is_active', true)
            ->whereIn('indicator_id', $indicatorMap->pluck('id'))
            ->get()
            ->keyBy('indicator_id');

        $dashboardSections = $this->widgets($rows, $reportType, $formulas, $indicatorMap);

        return [
            'filters' => [
                'year' => $year,
                'quarterId' => $quarterId,
                'lguId' => $lguId,
                'status' => $status,
            ],
            'sections' => $this->summary($rows, $reportType, $formulas, $indicatorMap),
            'lgu_summary' => $this->lguSummary($rows, $reportType, $formulas, $indicatorMap),
            'lgus' => $this->lguCatalog($rows),
            'dashboard_sections' => $dashboardSections,
            'widgets' => collect($dashboardSections)
                ->flatMap(fn ($section) => $section['widgets'] ?? [])
                ->values()
                ->all(),
            'meta' => [
                'lgu_count' => $rows->pluck('lgu_id')->filter()->unique()->count(),
                'submission_count' => $rows->count(),
                'generated_at' => now()->toIso8601String(),
            ],
            'fhsis' => $this->fhsis($reportType, $year, $quarterId),
        ];
    }

    private function summary(Collection $rows, ReportType $reportType, Collection $formulas, Collection $indicatorMap): array
    {
        $quarters = Quarter::query()
            ->orderBy('sort_order')
            ->get(['id', 'code', 'name', 'sort_order']);

        return ReportSection::query()
            ->where('report_type_id', $reportType->id)
            ->where('is_active', true)
            ->with([
                'indicators' => fn ($q) => $q
                    ->where('is_active', true)
                    ->orderBy('display_order'),
            ])
            ->orderBy('display_order')
            ->get()
            ->map(fn ($section) => [
                'id' => $section->id,
                'code' => $section->code,
                'name' => $section->name,
                'description' => $section->description,
                'display_order' => $section->display_order,
                'indicators' => $section->indicators->map(fn ($indicator) => [
                    'id' => $indicator->id,
                    'code' => $indicator->code,
                    'name' => $indicator->name,
                    'display_order' => $indicator->display_order,
                    'quarters' => $quarters->mapWithKeys(fn ($quarter) => [
                        (string) $quarter->id => $this->aggregate(
                            $rows->where('quarter_id', $quarter->id),
                            $indicator->code,
                            $formulas->get($indicator->id),
                            $indicatorMap
                        ),
                    ])->all(),
                    'annual' => $this->aggregate(
                        $rows,
                        $indicator->code,
                        $formulas->get($indicator->id),
                        $indicatorMap
                    ),
                ])->values()->all(),
            ])->values()->all();
    }

    /**
     * Build the generic LGU/quarter table used by every report type.
     *
     * The result intentionally follows the same shape as the HWPSC
     * lgu_summary payload so the React table does not need report-specific
     * indicator names or codes.
     */
    private function lguSummary(
        Collection $rows,
        ReportType $reportType,
        Collection $formulas,
        Collection $indicatorMap
    ): array {
        $lguGroups = $rows
            ->filter(fn ($row) => ! empty($row['lgu_id']))
            ->groupBy('lgu_id');

        return ReportSection::query()
            ->where('report_type_id', $reportType->id)
            ->where('is_active', true)
            ->with([
                'indicators' => fn ($q) => $q
                    ->where('is_active', true)
                    ->orderBy('display_order')
                    ->orderBy('id'),
            ])
            ->orderBy('display_order')
            ->orderBy('id')
            ->get()
            ->flatMap(function ($section) use (
                $lguGroups,
                $formulas,
                $indicatorMap
            ) {
                if ($section->indicators->isEmpty()) {
                    return [];
                }

                $items = [[
                    'type' => 'section',
                    'key' => 'section_' . $section->id,
                    'code' => $section->code,
                    'label' => $section->name,
                    'section_id' => $section->id,
                    'display_order' => $section->display_order,
                    'lgus' => null,
                ]];

                foreach ($section->indicators as $indicator) {
                    $lguValues = [];
                    $formula = $formulas->get($indicator->id);

                    foreach ($lguGroups as $lguId => $lguRows) {
                        $first = $lguRows->first();
                        $value = [
                            'male' => $this->sum($lguRows, $indicator->code, 'male'),
                            'female' => $this->sum($lguRows, $indicator->code, 'female'),
                            'total' => $this->sum($lguRows, $indicator->code, 'total'),
                            'percentage' => null,
                            'formula_configured' => $formula !== null,
                            'formula' => $formula?->display_formula,
                        ];

                        if ($formula) {
                            $result = $this->formulaEngine->evaluate(
                                $formula->expression,
                                $this->indicatorValues($lguRows, $indicatorMap)
                            );

                            $value['percentage'] = $result === null
                                ? null
                                : round(
                                    (float) $result,
                                    max(0, min(6, (int) $formula->decimal_places))
                                );
                        }

                        $lguValues[(string) $lguId] = $value + [
                            'lgu_id' => (int) $lguId,
                            'lgu' => $first['lgu'] ?? 'Unknown LGU',
                        ];
                    }

                    $items[] = [
                        'type' => 'indicator',
                        'key' => 'indicator_' . $indicator->id,
                        'code' => $indicator->code,
                        'label' => $indicator->name ?: $indicator->code,
                        'section_id' => $section->id,
                        'display_order' => $indicator->display_order,
                        'lgus' => $lguValues,
                    ];
                }

                return $items;
            })
            ->values()
            ->all();
    }

    private function lguCatalog(Collection $rows): array
    {
        return $rows
            ->filter(fn ($row) => ! empty($row['lgu_id']))
            ->groupBy('lgu_id')
            ->map(function (Collection $items, $lguId) {
                $first = $items->first();

                return [
                    'lgu_id' => (int) $lguId,
                    'lgu' => $first['lgu'] ?? 'Unknown LGU',
                ];
            })
            ->sortBy('lgu')
            ->values()
            ->all();
    }

    private function aggregate(
        Collection $rows,
        string $code,
        $formula = null,
        Collection $indicatorMap = null
    ): array {
        $result = [
            'male' => $this->sum($rows, $code, 'male'),
            'female' => $this->sum($rows, $code, 'female'),
            'total' => $this->sum($rows, $code, 'total'),
            'percentage' => null,
            'formula_configured' => $formula !== null,
            'formula' => $formula?->display_formula,
        ];

        if ($formula && $indicatorMap) {
            $values = $this->indicatorValues($rows, $indicatorMap);
            $result['percentage'] = $this->formulaEngine->evaluate(
                $formula->expression,
                $values
            );

            if ($result['percentage'] !== null) {
                $result['percentage'] = round(
                    $result['percentage'],
                    (int) $formula->decimal_places
                );
            }
        }

        return $result;
    }

    private function indicatorValues(Collection $rows, Collection $indicatorMap): Collection
    {
        return $indicatorMap->mapWithKeys(function ($indicator) use ($rows) {
            return [
                $indicator->id => (object) [
                    'male' => $this->sum($rows, $indicator->code, 'male'),
                    'female' => $this->sum($rows, $indicator->code, 'female'),
                    'total' => $this->sum($rows, $indicator->code, 'total'),
                ],
            ];
        });
    }

    private function sum(Collection $rows, string $code, string $field): ?float
    {
        $values = $rows
            ->map(fn ($r) => $r['values'][$code][$field] ?? null)
            ->filter(fn ($v) => $v !== null);

        return $values->isEmpty() ? null : (float) $values->sum();
    }

    private function widgets(Collection $rows, ReportType $reportType, Collection $formulas, Collection $indicatorMap): array
    {
        $indicatorNames = Indicator::query()
            ->whereHas('section', fn ($q) => $q->where('report_type_id', $reportType->id))
            ->where('is_active', true)
            ->pluck('name', 'code');

        $sections = DashboardSection::query()
            ->where('report_type_id', $reportType->id)
            ->where('is_active', true)
            ->with([
                'widgets' => fn ($q) => $q
                    ->where('is_active', true)
                    ->orderBy('display_order')
                    ->orderBy('id'),
            ])
            ->orderBy('display_order')
            ->orderBy('id')
            ->get()
            ->map(function ($section) use ($rows, $indicatorNames, $formulas, $indicatorMap) {
                return [
                    'id' => $section->id,
                    'code' => $section->code,
                    'name' => $section->name,
                    'description' => $section->description,
                    'display_order' => $section->display_order,
                    'widgets' => $section->widgets
                        ->map(function ($widget) use ($rows, $section, $indicatorNames, $formulas, $indicatorMap) {
                            $resolved = $this->resolveWidget($widget, $rows, $indicatorNames, $formulas, $indicatorMap);

                            if (! $resolved) {
                                return null;
                            }

                            return array_merge($resolved, [
                                'section_id' => $section->id,
                                'section_code' => $section->code,
                                'section_name' => $section->name,
                            ]);
                        })
                        ->filter()
                        ->values()
                        ->all(),
                ];
            })
            ->filter(fn ($section) => count($section['widgets']) > 0)
            ->values();

        return $sections
            ->sortBy('display_order')
            ->values()
            ->all();
    }

    private function resolveWidget(
        $widget,
        Collection $rows,
        Collection $indicatorNames,
        Collection $formulas,
        Collection $indicatorMap
    ): ?array 
{
    $config = $widget->config ?? [];

    $base = [
        'id' => $widget->id,
        'key' => $widget->key,
        'title' => $widget->title,
        'description' => $widget->description,
        'config' => $config,
        'layout' => $config['layout'] ?? 'standard',
        'col_span' => (int) ($config['col_span'] ?? 1),
    ];

    $kpiIndicator = $indicatorMap->get(
        trim((string) ($config['indicator_code'] ?? ''))
    );
    $kpiIndicatorFormula = $kpiIndicator
        ? $formulas->get($kpiIndicator->id)
        : null;

    return match ($widget->type) {

        'kpi' => array_merge($base, [
            'type' => 'kpi',

            // Always expose the resolved KPI result directly to the card.
            // For formula-enabled KPIs this is the formula result, not the
            // raw numerator indicator value.
            'value' => $this->kpiValue(
                $rows,
                $config,
                $indicatorMap,
                $formulas
            ),
            'formula_result' => $this->kpiValue(
                $rows,
                $config,
                $indicatorMap,
                $formulas
            ),
            'formula_enabled' => $this->kpiHasFormula($config) || $kpiIndicatorFormula !== null,
            'formula_type' => $this->kpiFormulaType($config)
                ?? ($kpiIndicatorFormula !== null ? 'percentage' : null),
            'formula_display' => $this->kpiHasFormula($config)
                ? $this->kpiFormulaDisplay($config, $indicatorNames)
                : ($kpiIndicatorFormula?->display_formula),
        ]),

        'summary_table' => array_merge($base, [
            'type' => 'summary_table',

            'data' => $this->summaryTableData(
                $rows,
                $config['indicator_codes'] ?? [],
                $indicatorNames,
                $formulas,
                $indicatorMap
            ),
        ]),

        'bar_chart',
        'line_chart',
        'quarterly',
        'flow' => $this->chart(
            $widget,
            $config,
            $rows,
            $indicatorNames,
            $formulas,
            $indicatorMap
        ),

        'lgu_status' => array_merge($base, [
            'type' => 'lgu_status',
            'data' => $this->lguStatusData(
                $rows,
                $config,
                $indicatorNames,
                $indicatorMap
            )['rows'],
            'lgu_status' => $this->lguStatusData(
                $rows,
                $config,
                $indicatorNames,
                $indicatorMap
            )['meta'],
        ]),

        'ranking' => $this->ranking(
            $widget,
            $config,
            $rows,
            $indicatorNames,
            $indicatorMap
        ),

        default => null,
    };
}

    /**
     * Resolve a KPI value. Without a custom formula this preserves the
     * existing indicator/value behavior. When a formula is enabled, the
     * configured indicators are evaluated against the same aggregated
     * indicator context used by the HWPSC formula engine.
     */
    private function kpiValue(
        Collection $rows,
        array $config,
        Collection $indicatorMap,
        Collection $formulas
    ): ?float {
        $indicatorCode = trim((string) ($config['indicator_code'] ?? ''));
        $valueField = in_array(
            $config['value'] ?? 'total',
            ['male', 'female', 'total'],
            true
        ) ? $config['value'] : 'total';

        // Support both the current nested formula config and the legacy
        // denominator-based KPI configuration. The dashboard configuration
        // UI still stores denominator_code at the top level, so do not let
        // an explicit formula: { enabled: false } hide that denominator.
        $nestedFormula = is_array($config['formula'] ?? null)
            ? $config['formula']
            : [];

        $denominatorCode = trim((string) (
            $nestedFormula['denominator_code']
                ?? $config['formula_denominator_code']
                ?? $config['denominator_code']
                ?? ''
        ));

        $formula = [
            'enabled' => (bool) ($nestedFormula['enabled'] ?? false)
                || (bool) ($config['formula_enabled'] ?? false)
                || $denominatorCode !== '',
            'type' => $nestedFormula['type']
                ?? $config['formula_type']
                ?? 'percentage',
            'numerator_code' => $nestedFormula['numerator_code']
                ?? $config['formula_numerator_code']
                ?? $indicatorCode,
            'denominator_code' => $denominatorCode,
            'numerator_field' => $nestedFormula['numerator_field']
                ?? $config['formula_numerator_field']
                ?? 'total',
            'denominator_field' => $nestedFormula['denominator_field']
                ?? $config['formula_denominator_field']
                ?? 'total',
            'multiplier' => $nestedFormula['multiplier']
                ?? $config['formula_multiplier']
                ?? 100,
            'decimal_places' => $nestedFormula['decimal_places']
                ?? $config['formula_decimal_places']
                ?? 2,
        ];

        if (! ($formula['enabled'] ?? false)) {
            // Generic KPIs should behave like the HWPSC indicators: if the
            // selected indicator already has a ReportIndicatorFormula, use
            // that calculated percentage/ratio instead of the raw total.
            if ($indicatorCode !== '') {
                $indicator = $indicatorMap->get($indicatorCode);
                $indicatorFormula = $indicator
                    ? $formulas->get($indicator->id)
                    : null;

                if ($indicatorFormula) {
                    $result = $this->formulaEngine->evaluate(
                        $indicatorFormula->expression,
                        $this->indicatorValues($rows, $indicatorMap)
                    );

                    if ($result !== null) {
                        return round(
                            (float) $result,
                            max(0, min(6, (int) $indicatorFormula->decimal_places))
                        );
                    }
                }

                return $this->sum($rows, $indicatorCode, $valueField);
            }

            return null;
        }

        $type = $formula['type'] ?? 'percentage';
        if (! in_array(
            $type,
            ['percentage', 'ratio', 'add', 'subtract', 'multiply', 'divide'],
            true
        )) {
            return null;
        }

        $numeratorCode = trim((string) (
            $formula['numerator_code'] ?? $indicatorCode
        ));
        $denominatorCode = trim((string) (
            $formula['denominator_code'] ?? ''
        ));

        $numerator = $indicatorMap->get($numeratorCode);
        $denominator = $indicatorMap->get($denominatorCode);

        if (! $numerator || ! $denominator) {
            return null;
        }

        $numeratorField = in_array(
            $formula['numerator_field'] ?? 'total',
            ['male', 'female', 'total'],
            true
        ) ? $formula['numerator_field'] : 'total';

        $denominatorField = in_array(
            $formula['denominator_field'] ?? 'total',
            ['male', 'female', 'total'],
            true
        ) ? $formula['denominator_field'] : 'total';

        $expression = [
            'type' => $type === 'percentage' ? 'multiply' : $type,
            'left' => [
                'type' => $type === 'percentage' || $type === 'ratio'
                    ? 'divide'
                    : 'indicator',
            ],
        ];

        if ($type === 'percentage' || $type === 'ratio') {
            $expression['left'] = [
                'type' => 'divide',
                'left' => [
                    'type' => 'indicator',
                    'indicator_id' => $numerator->id,
                    'field' => $numeratorField,
                ],
                'right' => [
                    'type' => 'indicator',
                    'indicator_id' => $denominator->id,
                    'field' => $denominatorField,
                ],
            ];
        } else {
            $expression['left'] = [
                'type' => 'indicator',
                'indicator_id' => $numerator->id,
                'field' => $numeratorField,
            ];
            $expression['right'] = [
                'type' => 'indicator',
                'indicator_id' => $denominator->id,
                'field' => $denominatorField,
            ];
        }

        if ($type === 'percentage') {
            $expression['right'] = [
                'type' => 'constant',
                'value' => is_numeric($formula['multiplier'] ?? null)
                    ? (float) $formula['multiplier']
                    : 100,
            ];
        }

        $value = $this->formulaEngine->evaluate(
            $expression,
            $this->indicatorValues($rows, $indicatorMap)
        );

        if ($value === null) {
            return null;
        }

        $decimalPlaces = max(
            0,
            min(6, (int) ($formula['decimal_places'] ?? 2))
        );

        return round((float) $value, $decimalPlaces);
    }

    private function kpiHasFormula(array $config): bool
    {
        $formula = is_array($config['formula'] ?? null) ? $config['formula'] : [];

        return (bool) ($formula['enabled'] ?? false)
            || (bool) ($config['formula_enabled'] ?? false)
            || trim((string) (
                $formula['denominator_code']
                    ?? $config['formula_denominator_code']
                    ?? $config['denominator_code']
                    ?? ''
            )) !== '';
    }

    private function kpiFormulaType(array $config): ?string
    {
        $formula = is_array($config['formula'] ?? null) ? $config['formula'] : [];

        return $formula['type']
            ?? $config['formula_type']
            ?? ($this->kpiHasFormula($config) ? 'percentage' : null);
    }

    private function kpiFormulaDisplay(array $config, Collection $indicatorNames): ?string
    {
        $nestedFormula = is_array($config['formula'] ?? null)
            ? $config['formula']
            : [];

        $denominatorCode = trim((string) (
            $nestedFormula['denominator_code']
                ?? $config['formula_denominator_code']
                ?? $config['denominator_code']
                ?? ''
        ));

        $formula = [
            'enabled' => (bool) ($nestedFormula['enabled'] ?? false)
                || (bool) ($config['formula_enabled'] ?? false)
                || $denominatorCode !== '',
            'type' => $nestedFormula['type']
                ?? $config['formula_type']
                ?? 'percentage',
            'numerator_code' => $nestedFormula['numerator_code']
                ?? $config['formula_numerator_code']
                ?? ($config['indicator_code'] ?? ''),
            'denominator_code' => $denominatorCode,
            'multiplier' => $nestedFormula['multiplier']
                ?? $config['formula_multiplier']
                ?? 100,
        ];

        if (! ($formula['enabled'] ?? false)) {
            return null;
        }

        $type = $formula['type'] ?? 'percentage';
        $numeratorCode = trim((string) ($formula['numerator_code'] ?? ''));
        $denominatorCode = trim((string) ($formula['denominator_code'] ?? ''));

        $numerator = $indicatorNames->get($numeratorCode, $numeratorCode);
        $denominator = $indicatorNames->get($denominatorCode, $denominatorCode);

        $operator = match ($type) {
            'percentage' => '÷',
            'ratio' => '÷',
            'add' => '+',
            'subtract' => '−',
            'multiply' => '×',
            'divide' => '÷',
            default => '÷',
        };

        if ($type === 'percentage') {
            $multiplier = is_numeric($formula['multiplier'] ?? null)
                ? (float) $formula['multiplier']
                : 100;

            return $denominatorCode !== ''
                ? "{$numerator} {$operator} {$denominator} × {$multiplier}"
                : null;
        }

        return $denominatorCode !== ''
            ? "{$numerator} {$operator} {$denominator}"
            : null;
    }

    private function lguStatusData(
        Collection $rows,
        array $config,
        Collection $indicatorNames,
        Collection $indicatorMap
    ): array {
        $indicatorCode = trim((string) ($config['indicator_code'] ?? ''));
        $indicator = $indicatorMap->get($indicatorCode);

        if (! $indicator) {
            return [
                'rows' => [],
                'meta' => [
                    'indicator_code' => $indicatorCode,
                    'indicator_label' => $indicatorNames->get($indicatorCode, $indicatorCode),
                    'value' => 'total',
                    'value_label' => 'Total',
                    'denominator_code' => null,
                    'denominator_label' => null,
                ],
            ];
        }

        $valueField = in_array(
            $config['value'] ?? 'total',
            ['male', 'female', 'total'],
            true
        ) ? $config['value'] : 'total';

        $denominatorCode = trim((string) ($config['denominator_code'] ?? ''));
        $denominator = $denominatorCode !== ''
            ? $indicatorMap->get($denominatorCode)
            : null;

        $resultRows = $rows
            ->filter(fn ($row) => ! empty($row['lgu_id']))
            ->groupBy('lgu_id')
            ->map(function (Collection $items) use ($indicator, $denominator, $valueField) {
                $first = $items->first();

                $sumIndicator = function ($indicatorCode) use ($items, $valueField) {
                    if (! $indicatorCode) {
                        return null;
                    }

                    $values = $items
                        ->map(fn ($row) => $row['values'][$indicatorCode][$valueField] ?? null)
                        ->filter(fn ($value) => $value !== null);

                    return $values->isEmpty() ? null : (float) $values->sum();
                };

                $value = $sumIndicator($indicator->code);
                $denominatorValue = $denominator
                    ? $sumIndicator($denominator->code)
                    : null;

                $status = $items
                    ->map(fn ($row) => $row['status'] ?? null)
                    ->filter()
                    ->last();

                return [
                    'lgu_id' => $first['lgu_id'],
                    'lgu' => $first['lgu'] ?? 'Unknown LGU',
                    'value' => $value,
                    'coverage' => $denominatorValue !== null
                        && $denominatorValue != 0.0
                        && $value !== null
                        ? round(($value / $denominatorValue) * 100, 2)
                        : null,
                    'status' => $status,
                ];
            })
            ->sortBy('lgu')
            ->values()
            ->all();

        return [
            'rows' => $resultRows,
            'meta' => [
                'indicator_code' => $indicator->code,
                'indicator_label' => $indicator->name,
                'value' => $valueField,
                'value_label' => ucfirst($valueField),
                'denominator_code' => $denominator?->code,
                'denominator_label' => $denominator?->name,
            ],
        ];
    }

    private function summaryTableData(
        Collection $rows,
        array $indicatorCodes,
        Collection $indicatorNames,
        Collection $formulas = null,
        Collection $indicatorMap = null
    ): array {
        if (empty($indicatorCodes)) {
            return [];
        }

        return collect($indicatorCodes)
            ->map(function (string $indicatorCode) use (
                $rows,
                $indicatorNames,
                $formulas,
                $indicatorMap
            ) {
                $male = 0;
                $female = 0;
                $total = 0;

                foreach ($rows as $row) {
                    $value = $row['values'][$indicatorCode] ?? null;

                    if (!is_array($value)) {
                        continue;
                    }

                    $male += (float) ($value['male'] ?? 0);
                    $female += (float) ($value['female'] ?? 0);
                    $total += (float) ($value['total'] ?? 0);
                }

                $formula = $indicatorMap && $formulas
                    ? $formulas->get(
                        $indicatorMap->get($indicatorCode)?->id
                    )
                    : null;

                $percentage = null;

                if ($formula && $indicatorMap) {
                    $percentage = $this->formulaEngine->evaluate(
                        $formula->expression,
                        $this->indicatorValues($rows, $indicatorMap)
                    );

                    if ($percentage !== null) {
                        $percentage = round(
                            $percentage,
                            (int) $formula->decimal_places
                        );
                    }
                }

                return [
                    'indicator_code' => $indicatorCode,
                    'indicator' => $indicatorNames->get(
                        $indicatorCode,
                        $indicatorCode
                    ),
                    'male' => $male,
                    'female' => $female,
                    'total' => $total,
                    'percentage' => $percentage,
                    'formula' => $formula?->display_formula,
                ];
            })
            ->values()
            ->all();
    }

    private function chart(
        $widget,
        array $config,
        Collection $rows,
        Collection $indicatorNames,
        Collection $formulas,
        Collection $indicatorMap
    ): array 
    {
        $codes = collect($config['indicator_codes'] ?? [])
            ->filter()
            ->map(fn ($code) => (string) $code)
            ->unique()
            ->values()
            ->all();

        $series = $config['series'] ?? ['total'];

        // Backward compatibility with old widgets:
        // "series": "total"
        if (! is_array($series)) {
            $series = [$series];
        }

        $series = collect($series)
            ->filter(fn ($value) => in_array(
                $value,
                ['male', 'female', 'total'],
                true
            ))
            ->values()
            ->all();

        if (empty($series)) {
            $series = ['total'];
        }

        $groupBy = $config['group_by'] ?? 'quarter';

        /*
        |--------------------------------------------------------------------------
        | Build chart data
        |--------------------------------------------------------------------------
        */

        $data = [];

        /*
        |--------------------------------------------------------------------------
        | QUARTER
        |--------------------------------------------------------------------------
        */

        if ($groupBy === 'quarter') {
            $quarters = Quarter::query()
                ->orderBy('sort_order')
                ->get([
                    'id',
                    'code',
                    'name',
                    'sort_order',
                ]);

            $data = $quarters
                ->map(function ($quarter) use (
                    $rows,
                    $codes,
                    $series
                ) {
                    $quarterRows = $rows->where(
                        'quarter_id',
                        $quarter->id
                    );

                    $item = [
                        'quarter' => $quarter->code,
                        'quarter_id' => $quarter->id,
                    ];

                    foreach ($codes as $code) {
                        foreach ($series as $field) {
                            $key = $this->seriesKey(
                                $code,
                                $field,
                                count($codes),
                                count($series)
                            );

                            $item[$key] = $this->sum(
                                $quarterRows,
                                $code,
                                $field
                            ) ?? 0;
                        }
                    }

                    return $item;
                })
                ->values()
                ->all();
        }

        /*
        |--------------------------------------------------------------------------
        | SEX
        |--------------------------------------------------------------------------
        */

        elseif ($groupBy === 'sex') {
            $data = collect([
                'male' => 'Male',
                'female' => 'Female',
                'total' => 'Total',
            ])
                ->filter(
                    fn ($label, $field) =>
                        in_array($field, $series, true)
                )
                ->map(function ($label, $field) use (
                    $rows,
                    $codes,
                    $series
                ) {
                    $item = [
                        'sex' => $label,
                    ];

                    foreach ($codes as $code) {
                        $key = $this->seriesKey(
                            $code,
                            $field,
                            count($codes),
                            1
                        );

                        $item[$key] = $this->sum(
                            $rows,
                            $code,
                            $field
                        ) ?? 0;
                    }

                    return $item;
                })
                ->values()
                ->all();
        }

        /*
        |--------------------------------------------------------------------------
        | LGU
        |--------------------------------------------------------------------------
        */

        elseif ($groupBy === 'lgu') {
            $data = $rows
                ->filter(fn ($row) => ! empty($row['lgu_id']))
                ->groupBy('lgu_id')
                ->map(function ($items) use (
                    $codes,
                    $series
                ) {
                    $first = $items->first();

                    $item = [
                        'lgu_id' => $first['lgu_id'],
                        'lgu' => $first['lgu'] ?? 'Unknown LGU',
                    ];

                    foreach ($codes as $code) {
                        foreach ($series as $field) {
                            $key = $this->seriesKey(
                                $code,
                                $field,
                                count($codes),
                                count($series)
                            );

                            $item[$key] = $this->sum(
                                $items,
                                $code,
                                $field
                            ) ?? 0;
                        }
                    }

                    return $item;
                })
                ->sortBy('lgu')
                ->values()
                ->all();
        }

        /*
        |--------------------------------------------------------------------------
        | INDICATOR
        |--------------------------------------------------------------------------
        */

        elseif ($groupBy === 'indicator') {
            $data = collect($codes)
                ->map(function ($code) use (
                    $rows,
                    $series
                ) {
                    $item = [
                        'indicator' => $code,
                    ];

                    foreach ($series as $field) {
                        $key = $this->seriesKey(
                            $code,
                            $field,
                            count($series) === 1 ? 1 : count($series),
                            count($series)
                        );

                        $item[$key] = $this->sum(
                            $rows,
                            $code,
                            $field
                        ) ?? 0;
                    }

                    return $item;
                })
                ->values()
                ->all();
        }

        /*
        |--------------------------------------------------------------------------
        | Chart X axis
        |--------------------------------------------------------------------------
        */

        $xKey = match ($groupBy) {
            'sex' => 'sex',
            'lgu' => 'lgu',
            'indicator' => 'indicator',
            default => 'quarter',
        };

        /*
        |--------------------------------------------------------------------------
        | Build series metadata
        |--------------------------------------------------------------------------
        */

        $chartSeries = [];

        // Use the colors configured for this widget. Keep the defaults for
        // existing widgets that do not have series_colors yet.
        $configuredSeriesColors = is_array($config['series_colors'] ?? null)
            ? $config['series_colors']
            : [];

        $seriesColors = [
            'male' => $this->validHexColor(
                $configuredSeriesColors['male'] ?? null,
                '#2563eb'
            ),
            'female' => $this->validHexColor(
                $configuredSeriesColors['female'] ?? null,
                '#e11d48'
            ),
            'total' => $this->validHexColor(
                $configuredSeriesColors['total'] ?? null,
                '#07549a'
            ),
        ];

        $indicatorColors = [
            '#2563eb',
            '#f59e0b',
            '#16a34a',
            '#e11d48',
            '#7c3aed',
            '#0891b2',
            '#ea580c',
            '#475569',
        ];

        foreach ($codes as $indicatorIndex => $code) {
            $indicatorLabel = $indicatorNames->get(
                $code,
                $code
            );

            foreach ($series as $field) {
                $key = $this->seriesKey(
                    $code,
                    $field,
                    count($codes),
                    count($series)
                );

                $chartSeries[] = [
                    'key' => $key,

                    'label' => $groupBy === 'indicator'
                        ? (count($codes) === 1
                            ? $indicatorLabel
                            : "{$indicatorLabel} — " . ucfirst($field))
                        : (count($codes) === 1
                            ? ucfirst($field)
                            : "{$indicatorLabel} — " . ucfirst($field)),

                    'color' => $seriesColors[$field]
                        ?? $indicatorColors[
                            $indicatorIndex % count($indicatorColors)
                        ],
                ];
            }
        }

        return [
            'id' => $widget->id,
            'key' => $widget->key,
            'type' => $widget->type,
            'title' => $widget->title,
            'description' => $widget->description,

            'config' => $config,

            'layout' => $config['layout'] ?? 'standard',

            'col_span' => (int) (
                $config['col_span'] ?? 1
            ),

            'data' => $data,

            'chart' => [
                'x_key' => $xKey,
                'series' => $chartSeries,
                'orientation' => ($config['orientation'] ?? 'vertical') === 'horizontal'
                    ? 'horizontal'
                    : 'vertical',
                'visualization' => $config['visualization'] ?? 'standard',
            ],
            'indicator_labels' => collect($codes)
                ->mapWithKeys(fn ($code) => [
                    $code => $indicatorNames->get($code, $code),
                ])
                ->all(),
        ];
    }

    private function seriesLabel(
    string $indicatorCode,
    string $field
    ): string {
        $fieldLabel = match ($field) {
            'male' => 'Male',
            'female' => 'Female',
            'total' => 'Total',
            default => ucfirst($field),
        };

        return "{$indicatorCode} — {$fieldLabel}";
    }

    private function chartByQuarter(
        Collection $rows,
        array $indicatorCodes,
        array $series
    ): array {
        $quarters = Quarter::query()
            ->orderBy('sort_order')
            ->get([
                'id',
                'code',
                'name',
                'sort_order',
            ]);

        return $quarters
            ->map(function ($quarter) use (
                $rows,
                $indicatorCodes,
                $series
            ) {
                $quarterRows = $rows->where(
                    'quarter_id',
                    $quarter->id
                );

                $item = [
                    'quarter' => $quarter->code,
                    'quarter_id' => $quarter->id,
                ];

                foreach ($indicatorCodes as $code) {
                    foreach ($series as $field) {
                        $key = $this->seriesKey(
                            $code,
                            $field,
                            count($indicatorCodes),
                            count($series)
                        );

                        $item[$key] = $this->sum(
                            $quarterRows,
                            $code,
                            $field
                        );
                    }
                }

                return $item;
            })
            ->values()
            ->all();
    }

    private function chartBySex(
        Collection $rows,
        array $indicatorCodes,
        array $series
    ): array {
        $data = [];

        foreach (['male', 'female', 'total'] as $sex) {
            $item = [
                'sex' => ucfirst($sex),
            ];

            foreach ($indicatorCodes as $code) {
                if (in_array($sex, $series, true)) {
                    $item[$code] = $this->sum(
                        $rows,
                        $code,
                        $sex
                    );
                }
            }

            $data[] = $item;
        }

        return $data;
    }

    private function chartByLgu(
        Collection $rows,
        array $indicatorCodes,
        array $series
    ): array {
        return $rows
            ->groupBy('lgu_id')
            ->map(function (Collection $items) use (
                $indicatorCodes,
                $series
            ) {
                $first = $items->first();

                $item = [
                    'lgu_id' => $first['lgu_id'],
                    'lgu' => $first['lgu'],
                ];

                foreach ($indicatorCodes as $code) {
                    foreach ($series as $field) {
                        $key = $this->seriesKey(
                            $code,
                            $field,
                            count($indicatorCodes),
                            count($series)
                        );

                        $item[$key] = $this->sum(
                            $items,
                            $code,
                            $field
                        );
                    }
                }

                return $item;
            })
            ->sortBy('lgu')
            ->values()
            ->all();
    }

    private function chartByIndicator(
        Collection $rows,
        array $indicatorCodes,
        array $series
    ): array {
        return collect($indicatorCodes)
            ->map(function ($code) use (
                $rows,
                $series
            ) {
                $item = [
                    'indicator' => $code,
                ];

                foreach ($series as $field) {
                    $item[$field] = $this->sum(
                        $rows,
                        $code,
                        $field
                    );
                }

                return $item;
            })
            ->values()
            ->all();
    }

    private function validHexColor(mixed $color, string $default): string
    {
        return is_string($color)
            && preg_match('/^#[0-9A-Fa-f]{6}$/', $color)
            ? $color
            : $default;
    }

    private function seriesKey(
        string $indicatorCode,
        string $field,
        int $indicatorCount,
        int $seriesCount
    ): string 
    {
        if (
            $indicatorCount === 1 &&
            $seriesCount === 1
        ) {
            return $indicatorCode;
        }

        return $indicatorCode . '__' . $field;
    }

    private function indicatorColor(array $config, string $code, int $index): string
    {
        $colors = is_array($config['colors'] ?? null) ? $config['colors'] : [];

        if (
            isset($colors[$code]) &&
            is_string($colors[$code]) &&
            preg_match('/^#[0-9A-Fa-f]{6}$/', $colors[$code])
        ) {
            return $colors[$code];
        }

        $defaults = [
            '#2563eb',
            '#f59e0b',
            '#16a34a',
            '#e11d48',
            '#7c3aed',
            '#0891b2',
            '#ea580c',
            '#475569',
        ];

        return $defaults[$index % count($defaults)];
    }

    private function flow(
        $widget,
        array $config,
        Collection $rows,
        Collection $indicatorNames
    ): array {
        $codes = collect($config['indicator_codes'] ?? [])
            ->map(fn ($code) => (string) $code)
            ->filter()
            ->unique()
            ->values()
            ->all();

        $value = in_array($config['value'] ?? 'total', ['male', 'female', 'total'], true)
            ? $config['value']
            : 'total';

        $data = collect($codes)->map(function ($code) use ($rows, $indicatorNames, $value) {
            return [
                'indicator_code' => $code,
                'label' => $indicatorNames->get($code, $code),
                'male' => $this->sum($rows, $code, 'male'),
                'female' => $this->sum($rows, $code, 'female'),
                'total' => $this->sum($rows, $code, 'total'),
                'value' => $this->sum($rows, $code, $value),
            ];
        })->values()->all();

        return [
            'id' => $widget->id,
            'key' => $widget->key,
            'type' => 'flow',
            'title' => $widget->title,
            'description' => $widget->description,
            'config' => array_merge($config, [
                'value' => $value,
            ]),
            'data' => $data,
        ];
    }

    private function ranking(
        $widget,
        array $config,
        Collection $rows,
        Collection $indicatorNames = null,
        Collection $indicatorMap = null
    ): array {
        $series = $config['value'] ?? 'total';

        if (! in_array($series, ['male', 'female', 'total'], true)) {
            $series = 'total';
        }

        $rankingMode = ($config['ranking_mode'] ?? 'lgu') === 'indicator_progress'
            ? 'indicator_progress'
            : 'lgu';

        /*
        |--------------------------------------------------------------------------
        | Indicator Progress Bars
        |--------------------------------------------------------------------------
        |
        | A progress-bar ranking is a multi-indicator widget. The selected
        | indicator_codes come from Dashboard Configuration and have already
        | been validated against the current report type by the controller.
        | Return one row per configured indicator so the React renderer can
        | calculate each bar relative to the largest value.
        |--------------------------------------------------------------------------
        */
        if ($rankingMode === 'indicator_progress') {
            $codes = collect($config['indicator_codes'] ?? [])
                ->map(fn ($code) => trim((string) $code))
                ->filter()
                ->unique()
                ->values();

            // Backward compatibility: older progress widgets may have saved
            // one indicator in indicator_code instead of indicator_codes.
            if ($codes->isEmpty() && ! empty($config['indicator_code'])) {
                $codes = collect([(string) $config['indicator_code']]);
            }

            $data = $codes
                ->map(function (string $code) use ($rows, $series, $indicatorNames) {
                    $value = $this->sum($rows, $code, $series) ?? 0;
                    $label = $indicatorNames?->get($code, $code) ?? $code;

                    return [
                        'indicator_code' => $code,
                        'indicator' => $label,
                        'indicator_name' => $label,
                        'label' => $label,
                        'value' => $value,
                        'male' => $this->sum($rows, $code, 'male'),
                        'female' => $this->sum($rows, $code, 'female'),
                        'total' => $this->sum($rows, $code, 'total'),
                    ];
                })
                ->sortByDesc('value')
                ->values()
                ->all();

            return [
                'id' => $widget->id,
                'key' => $widget->key,
                'type' => 'ranking',
                'title' => $widget->title,
                'description' => $widget->description,
                'config' => array_merge($config, [
                    'value' => $series,
                    'ranking_mode' => 'indicator_progress',
                    'indicator_codes' => $codes->all(),
                ]),
                'layout' => $config['layout'] ?? 'standard',
                'col_span' => (int) ($config['col_span'] ?? 1),
                'data' => $data,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Normal LGU ranking
        |--------------------------------------------------------------------------
        */
        $indicatorCode = trim((string) ($config['indicator_code'] ?? ''));

        if ($indicatorCode === '') {
            return [
                'id' => $widget->id,
                'key' => $widget->key,
                'type' => 'ranking',
                'title' => $widget->title,
                'description' => $widget->description,
                'config' => array_merge($config, [
                    'value' => $series,
                    'ranking_mode' => 'lgu',
                    'ranking_scope' => 'indicator',
                ]),
                'layout' => $config['layout'] ?? 'standard',
                'col_span' => (int) ($config['col_span'] ?? 1),
                'data' => [],
            ];
        }

        $value = $this->sum($rows, $indicatorCode, $series) ?? 0;
        $indicatorLabel = $indicatorNames?->get($indicatorCode, $indicatorCode) ?? $indicatorCode;

        return [
            'id' => $widget->id,
            'key' => $widget->key,
            'type' => 'ranking',
            'title' => $widget->title,
            'description' => $widget->description,
            'config' => array_merge($config, [
                'value' => $series,
                'ranking_mode' => 'lgu',
                'ranking_scope' => 'indicator',
                'indicator_code' => $indicatorCode,
                'indicator_label' => $indicatorLabel,
            ]),
            'layout' => $config['layout'] ?? 'standard',
            'col_span' => (int) ($config['col_span'] ?? 1),
            'data' => [[
                'indicator_code' => $indicatorCode,
                'indicator' => $indicatorLabel,
                'label' => $indicatorLabel,
                'value' => $value,
            ]],
        ];
    }

    private function series(array $config, string $type): array
    {
        $series = $config['series'] ?? null;

        if (is_string($series)) {
            $series = [$series];
        }

        $series = is_array($series)
            ? array_values(array_intersect($series, ['male', 'female', 'total']))
            : [];

        if ($series) {
            return $series;
        }

        return match ($type) {
            'flow' => ['total'],
            'summary_table' => ['male', 'female', 'total'],
            default => ['male', 'female'],
        };
    }

    private function seriesColors(array $config): array
    {
        $defaults = [
            'male' => '#2563eb',
            'female' => '#e11d48',
            'total' => '#07549a',
        ];

        $colors = is_array($config['series_colors'] ?? null)
            ? $config['series_colors']
            : [];

        foreach ($defaults as $key => $default) {
            $candidate = $colors[$key] ?? null;
            if (is_string($candidate) && preg_match('/^#[0-9A-Fa-f]{6}$/', $candidate)) {
                $defaults[$key] = $candidate;
            }
        }

        return $defaults;
    }

    private function fhsis(ReportType $reportType, int $year, ?int $quarterId): array
    {
        if (!$quarterId) {
            return [
                'available' => false,
                'message' => 'Select a quarter to compare with FHSIS.',
            ];
        }

        $report = FhsisReport::query()
            ->where('report_type_id', $reportType->id)
            ->where('year', $year)
            ->where('quarter_id', $quarterId)
            ->where('is_current', true)
            ->latest('version')
            ->first();

        return $report
            ? [
                'available' => true,
                'report_id' => $report->id,
                'version' => $report->version,
            ]
            : [
                'available' => false,
                'message' => 'No current FHSIS report is available for this period.',
            ];
    }
}
