<?php

namespace App\Http\Controllers;

use App\Models\DashboardSection;
use App\Models\DashboardWidget;
use App\Models\Indicator;
use App\Models\ReportType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DashboardConfigurationController extends Controller
{
    private function reportType(string $slug): ReportType
    {
        return ReportType::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();
    }

    private function validationError(string $message): void
    {
        throw ValidationException::withMessages([
            'error' => $message,
        ]);
    }

    public function index(string $reportType): Response
    {
        $type = $this->reportType($reportType);

        $reportTypes = ReportType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'slug']);

        $sections = DashboardSection::query()
            ->where('report_type_id', $type->id)
            ->with(['widgets' => fn ($q) => $q->orderBy('display_order')->orderBy('id')])
            ->orderBy('display_order')
            ->orderBy('id')
            ->get();

        // Indicators for normal widgets: restricted to the selected report type.
        $indicators = Indicator::query()
            ->whereHas('section', fn ($q) => $q->where('report_type_id', $type->id))
            ->where('is_active', true)
            ->with('section:id,report_type_id,name,code,display_order')
            ->orderBy('report_section_id')
            ->orderBy('display_order')
            ->orderBy('id')
            ->get(['id', 'report_section_id', 'code', 'name', 'display_order']);


        return Inertia::render('justine/DashboardConfiguration/index', [
            'reportType' => $type->only(['id', 'code', 'name', 'slug']),
            'reportTypes' => $reportTypes,
            'sections' => $sections,
            'indicators' => $indicators,
            'widgetTypes' => [
                ['value' => 'kpi', 'label' => 'KPI Card'],
                ['value' => 'summary_table', 'label' => 'Detailed Monitoring / Summary Table'],
                ['value' => 'quarterly', 'label' => 'Q1–Q4 Quarterly'],
                ['value' => 'flow', 'label' => 'Flow / Progression'],
                ['value' => 'bar_chart', 'label' => 'Bar Chart'],
                ['value' => 'line_chart', 'label' => 'Line Chart'],
                ['value' => 'ranking', 'label' => 'LGU Ranking'],
                ['value' => 'lgu_status', 'label' => 'LGU Status'],
            ],
        ]);
    }

    public function storeSection(Request $request, string $reportType): RedirectResponse
    {
        $type = $this->reportType($reportType);

        $data = $request->validate([
            'code' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9_-]+$/'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        DashboardSection::create([
            ...$data,
            'report_type_id' => $type->id,
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return back()->with('success', "Dashboard section created for {$type->name}.");
    }

    public function updateSection(Request $request, string $reportType, DashboardSection $section): RedirectResponse
    {
        $type = $this->reportType($reportType);
        abort_unless($section->report_type_id === $type->id, 404);

        $data = $request->validate([
            'code' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9_-]+$/'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $section->update($data);

        return back()->with('success', 'Dashboard section updated.');
    }

    public function destroySection(string $reportType, DashboardSection $section): RedirectResponse
    {
        $type = $this->reportType($reportType);
        abort_unless($section->report_type_id === $type->id, 404);

        $section->delete();

        return back()->with('success', 'Dashboard section deleted.');
    }

    public function storeWidget(Request $request, string $reportType): RedirectResponse
    {
        $reportTypeModel = ReportType::query()
            ->where('slug', $reportType)
            ->where('is_active', true)
            ->firstOrFail();

        $data = $request->validate([
            'dashboard_section_id' => ['required', 'integer'],
            'type' => ['required', 'string'],
            'key' => ['required', 'string'],
            'title' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],

            'indicator_code' => ['nullable', 'string'],
            'indicator_codes' => ['nullable', 'array'],
            'indicator_codes.*' => ['string'],

            'value' => ['nullable', 'in:male,female,total'],
            'aggregation' => ['nullable', 'in:sum,average,latest'],
            'group_by' => ['nullable', 'in:quarter,sex,lgu,indicator'],
            'series' => ['nullable', 'array'],
            'series.*' => ['in:male,female,total'],
        ]);

        $this->validateWidgetIndicators(
            $reportTypeModel,
            $data
        );
        $type = $this->reportType($reportType);
        $data = $this->validatedWidget($request, $type);

        DashboardWidget::create($data);

        return back()->with('success', 'Dashboard widget created.');
    }

    public function updateWidget(Request $request, string $reportType, DashboardWidget $widget): RedirectResponse
    {
        $type = $this->reportType($reportType);
        abort_unless($widget->section()->where('report_type_id', $type->id)->exists(), 404);

        $data = $this->validatedWidget($request, $type);
        $widget->update($data);

        return back()->with('success', 'Dashboard widget updated.');
    }

    public function destroyWidget(string $reportType, DashboardWidget $widget): RedirectResponse
    {
        $type = $this->reportType($reportType);
        abort_unless($widget->section()->where('report_type_id', $type->id)->exists(), 404);

        $widget->delete();

        return back()->with('success', 'Dashboard widget deleted.');
    }

    private function validatedWidget(Request $request, ReportType $type): array
    {
        $data = $request->validate([
            'dashboard_section_id' => ['required', 'integer'],
            'type' => ['required', 'in:kpi,summary_table,quarterly,flow,bar_chart,line_chart,ranking,lgu_status'],
            'key' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9_-]+$/'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'config' => ['nullable', 'array'],
        ]);

        $validSection = DashboardSection::query()
            ->whereKey($data['dashboard_section_id'])
            ->where('report_type_id', $type->id)
            ->exists();

        if (! $validSection) {
            $this->validationError(
                'The selected dashboard section does not belong to this report type.'
            );
        }

        $config = $data['config'] ?? [];

        $rankingMode = $config['ranking_mode'] ?? 'lgu';
        $isIndicatorProgressRanking =
            $data['type'] === 'ranking'
            && $rankingMode === 'indicator_progress';

        // Every widget, including Indicator Progress Bars, is restricted
        // to indicators belonging to the selected report type.
        $validCodes = Indicator::query()
            ->whereHas('section', fn ($q) => $q->where('report_type_id', $type->id))
            ->where('is_active', true)
            ->pluck('code')
            ->all();

        $validCodeSet = array_fill_keys($validCodes, true);

        $isSingleIndicator =
            in_array($data['type'], ['kpi', 'lgu_status'], true)
            || ($data['type'] === 'ranking' && ! $isIndicatorProgressRanking);

        if ($isIndicatorProgressRanking) {
            $codes = collect($config['indicator_codes'] ?? [])
                ->map(fn ($code) => trim((string) $code))
                ->filter()
                ->unique()
                ->values()
                ->all();

            if (count($codes) === 0) {
                $this->validationError(
                    'Select at least one indicator for Indicator Progress Bars.'
                );
            }

            // Progress bars use multiple indicators, but all of them
            // must belong to the selected report type.
            $invalid = collect($codes)->first(
                fn ($code) => ! isset($validCodeSet[$code])
            );

            if ($invalid !== null) {
                $this->validationError(
                    "The indicator '{$invalid}' does not belong to this report type."
                );
            }

            $config['indicator_code'] = null;
            $config['indicator_codes'] = $codes;
            $config['ranking_mode'] = 'indicator_progress';
            $config['value'] = in_array($config['value'] ?? 'total', ['male', 'female', 'total'], true)
                ? $config['value']
                : 'total';
            $config['aggregation'] = in_array($config['aggregation'] ?? 'sum', ['sum', 'average', 'latest'], true)
                ? $config['aggregation']
                : 'sum';
        } elseif ($isSingleIndicator) {
            $indicatorCode = trim((string) ($config['indicator_code'] ?? ''));

            if ($indicatorCode === '' || ! isset($validCodeSet[$indicatorCode])) {
                $this->validationError(
                    'The selected indicator is not valid for this report type.'
                );
            }

            $config['indicator_code'] = $indicatorCode;
            $config['value'] = in_array($config['value'] ?? 'total', ['male', 'female', 'total'], true)
                ? $config['value']
                : 'total';
            $config['aggregation'] = in_array($config['aggregation'] ?? 'sum', ['sum', 'average', 'latest'], true)
                ? $config['aggregation']
                : 'sum';

            $denominator = trim((string) ($config['denominator_code'] ?? ''));
            $config['denominator_code'] = in_array($data['type'], ['kpi', 'lgu_status'], true)
                && $denominator !== ''
                && isset($validCodeSet[$denominator])
                ? $denominator
                : null;

            if ($data['type'] === 'kpi') {
                $formula = is_array($config['formula'] ?? null)
                    ? $config['formula']
                    : [];

                // A denominator is itself enough to define a KPI percentage.
                // This keeps older widgets working even when they do not have
                // the newer nested formula.enabled flag.
                $formulaEnabled = (bool) ($formula['enabled'] ?? false)
                    || $denominator !== ''
                    || trim((string) ($config['formula_denominator_code'] ?? '')) !== '';

                if ($formulaEnabled) {
                    $formulaType = $formula['type']
                        ?? $config['formula_type']
                        ?? 'percentage';

                    if (! in_array(
                        $formulaType,
                        ['percentage', 'ratio', 'add', 'subtract', 'multiply', 'divide'],
                        true
                    )) {
                        $this->validationError('The KPI formula type is invalid.');
                    }

                    $numeratorCode = trim((string) (
                        $formula['numerator_code']
                            ?? $config['formula_numerator_code']
                            ?? $indicatorCode
                    ));
                    $denominatorCode = trim((string) (
                        $formula['denominator_code']
                            ?? $config['formula_denominator_code']
                            ?? $denominator
                    ));

                    if ($numeratorCode === '' || ! isset($validCodeSet[$numeratorCode])) {
                        $this->validationError('The KPI formula numerator is invalid.');
                    }

                    if ($denominatorCode === '' || ! isset($validCodeSet[$denominatorCode])) {
                        $this->validationError('The KPI formula denominator is invalid.');
                    }

                    $numeratorField = $formula['numerator_field'] ?? 'total';
                    $denominatorField = $formula['denominator_field'] ?? 'total';

                    if (
                        ! in_array($numeratorField, ['male', 'female', 'total'], true)
                        || ! in_array($denominatorField, ['male', 'female', 'total'], true)
                    ) {
                        $this->validationError('The KPI formula fields are invalid.');
                    }

                    $multiplier = $formula['multiplier'] ?? 100;
                    if (! is_numeric($multiplier)) {
                        $this->validationError('The KPI formula multiplier must be numeric.');
                    }

                    $decimalPlaces = max(
                        0,
                        min(6, (int) ($formula['decimal_places'] ?? 2))
                    );

                    $config['formula'] = [
                        'enabled' => true,
                        'type' => $formulaType,
                        'numerator_code' => $numeratorCode,
                        'denominator_code' => $denominatorCode,
                        'numerator_field' => $numeratorField,
                        'denominator_field' => $denominatorField,
                        'multiplier' => (float) $multiplier,
                        'decimal_places' => $decimalPlaces,
                    ];
                } else {
                    // No denominator/formula means this is a normal KPI.
                    $config['formula'] = null;
                }
            }
        } else {
            $codes = collect($config['indicator_codes'] ?? [])
                ->map(fn ($code) => trim((string) $code))
                ->filter()
                ->unique()
                ->values()
                ->all();

            if (count($codes) === 0) {
                $this->validationError('Select at least one indicator for this widget.');
            }

            $invalid = collect($codes)->first(fn ($code) => !isset($validCodeSet[$code]));

            if ($invalid !== null) {
                $this->validationError(
                    "The indicator '{$invalid}' does not belong to this report type."
                );
            }

            $config['indicator_codes'] = $codes;
            $config['value'] = in_array($config['value'] ?? 'total', ['male', 'female', 'total'], true)
                ? $config['value']
                : 'total';
            $config['aggregation'] = in_array($config['aggregation'] ?? 'sum', ['average', 'latest', 'sum'], true)
                ? $config['aggregation']
                : 'sum';

            $series = $config['series'] ?? null;
            if (is_string($series)) {
                $series = [$series];
            }

            $series = is_array($series)
                ? array_values(array_intersect($series, ['male', 'female', 'total']))
                : [];

            $config['series'] = $series ?: ($data['type'] === 'flow'
                ? ['total']
                : ($data['type'] === 'summary_table'
                    ? ['male', 'female', 'total']
                    : ['male', 'female']));

            $groupBy = $config['group_by'] ?? 'quarter';

            $config['group_by'] = in_array(
                $groupBy,
                ['quarter', 'sex', 'lgu', 'indicator'],
                true
            ) ? $groupBy : 'quarter';
        }

        if ($data['type'] === 'bar_chart') {
            $orientation = $config['orientation'] ?? 'vertical';
            $config['orientation'] = in_array(
                $orientation,
                ['horizontal', 'vertical'],
                true
            ) ? $orientation : 'vertical';
        } else {
            unset($config['orientation']);
        }

        $config['color'] = preg_match(
            '/^#[0-9A-Fa-f]{6}$/',
            (string) ($config['color'] ?? '')
        )
            ? (string) $config['color']
            : '#2563eb';

        $defaultSeriesColors = [
            'male' => '#2563eb',
            'female' => '#e11d48',
            'total' => '#07549a',
        ];

        $seriesColors = is_array($config['series_colors'] ?? null)
            ? $config['series_colors']
            : [];

        foreach ($defaultSeriesColors as $series => $defaultColor) {
            $candidate = $seriesColors[$series] ?? null;
            $defaultSeriesColors[$series] = is_string($candidate)
                && preg_match('/^#[0-9A-Fa-f]{6}$/', $candidate)
                ? $candidate
                : $defaultColor;
        }

        $config['series_colors'] = $defaultSeriesColors;

        $config['col_span'] = max(1, min(3, (int) ($config['col_span'] ?? 1)));

        // Card height is stored in widget config so each dashboard widget
        // can be resized independently without changing the database schema.
        $config['height'] = max(180, min(900, (int) ($config['height'] ?? 330)));

        $layout = $config['layout'] ?? 'standard';

        $config['layout'] = in_array(
            $layout,
            ['standard', 'wide', 'full'],
            true
        )
            ? $layout
            : 'standard';

        $data['display_order'] = $data['display_order'] ?? 0;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['config'] = $config;

        return $data;
    }

    private function validateWidgetIndicators(
        \App\Models\ReportType $reportType,
        array $data
    ): void {
        $config = is_array($data['config'] ?? null)
            ? $data['config']
            : [];

        $indicatorCodes = [];

        if (!empty($config['indicator_code'])) {
            $indicatorCodes[] = $config['indicator_code'];
        }

        if (!empty($config['indicator_codes']) && is_array($config['indicator_codes'])) {
            $indicatorCodes = array_merge(
                $indicatorCodes,
                $config['indicator_codes']
            );
        }

        $indicatorCodes = collect($indicatorCodes)
            ->filter()
            ->map(fn ($code) => trim((string) $code))
            ->unique()
            ->values();

        if ($indicatorCodes->isEmpty()) {
            return;
        }

        // All widgets, including Indicator Progress Bars, must use
        // indicators belonging to the selected report type.
        $validCodes = \App\Models\Indicator::query()
            ->whereHas('reportSection', function ($query) use ($reportType) {
                $query->where('report_type_id', $reportType->id);
            })
            ->where('is_active', true)
            ->whereIn('code', $indicatorCodes)
            ->pluck('code');

        $invalidCodes = $indicatorCodes
            ->diff($validCodes)
            ->values();

        if ($invalidCodes->isNotEmpty()) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'indicator_code' =>
                    "The selected indicator '{$invalidCodes->first()}' does not belong to this report type.",
            ]);
        }
    }

}
