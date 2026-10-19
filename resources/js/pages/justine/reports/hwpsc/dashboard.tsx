import React, { useEffect, useMemo, useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Download,
    FileCheck2,
    HeartPulse,
    Settings2,
    RefreshCw,
    ShieldAlert,
    Syringe,
    Target,
    UserCheck,
    Users,
    X,
} from 'lucide-react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
// import MeetingReminderModal, {
//     type DashboardMeetingReminder,
// } from './MeetingReminderModal'
import MeetingReminderModal, {
    type DashboardMeetingReminder,
} from './MeetingReminderModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    ChartContainer,
    ChartLegend,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart'

interface Metric {
    male: number | null
    female: number | null
    total: number | null
    percentage?: number | null
}

interface QuarterMetric {
    male: number | null
    female: number | null
    total: number | null
    percentage?: number | null
    formula_configured?: boolean
    formula?: string | null
}

interface FormulaMeta {
    id?: number
    type?: string
    display?: string | null
    expression?: string | null
    decimal_places?: number
    is_active?: boolean
}

function getFormulaText(
    formula: FormulaMeta | string | null | undefined,
): string | null {
    if (!formula) return null

    if (typeof formula === 'string') {
        return formula
    }

    return formula.display ?? formula.expression ?? null
}

function isFormulaActive(
    formula: FormulaMeta | string | null | undefined,
): boolean {
    if (!formula) return false

    if (typeof formula === 'string') {
        return true
    }

    return formula.is_active !== false
}

interface NCRSummaryRow {
    type: 'section' | 'indicator'
    key: string
    code: string
    label: string
    section_id?: number
    display_order?: number
    percentage?: number | null
    formula_configured?: boolean
    formula?: FormulaMeta | string | null

    quarters?: {
        1: QuarterMetric
        2: QuarterMetric
        3: QuarterMetric
        4: QuarterMetric
    }

    annual?: QuarterMetric
}

interface DashboardData {
    filters: {
        year: number
        quarterId: number | null
        lguId: number | null
        status: string
    }
    kpis: {
        target: number | null
        screened: number | null
        coverage: number | null
        positive: number | null
        positive_rate: number | null
        referred: number | null
        referral_rate: number | null
        seen: number | null
        vaccinated: number | null
        lgu_count: number
        submission_count: number
    }
    ncr_summary: NCRSummaryRow[]
    quarterly: Array<{
        screened: number | null
        quarter_id: number
        quarter: string | null
        quarter_name: string | null
        male: number | null
        female: number | null
        total: number | null
        target: number | null
        coverage: number | null
        positive: number | null
        referred: number | null
    }>
    lgus: Array<{
        lgu_id: number
        lgu: string
        target: number | null
        male: number | null
        female: number | null
        screened: number | null
        coverage: number | null
        positive: number | null
        referred: number | null
        seen: number | null
        vaccinated: number | null
    }>
    // LGU-level indicator data for the currently selected quarter.
    // This mirrors the Q1/Q2/Q3/Q4 workbook structure: indicator rows
    // with each LGU providing M/F/T/% values.
    lgu_summary: Array<{
        type: 'section' | 'indicator'
        key: string
        label: string
        section_id?: number
        display_order?: number
        lgus?: Record<string, QuarterMetric>
    }>
    syndromes: Array<{
        key: string
        label: string
        male: number | null
        female: number | null
        total: number | null
    }>
    vaccines: Array<{
        key: string
        label: string
        total: number | null
        male: number | null
        female: number | null
    }>
    fhsis: {
        available: boolean
        screened?: Metric | null
    }
    generated_at: string
    graphs?: {
        screened_by_quarter: Array<{
            quarter: string
            male: number | null
            female: number | null
            total: number | null
        }>
        screening_progression: Array<{
            quarter: string
            screened: number | null
            positive: number | null
            referred: number | null
        }>
        positive_syndromes: Array<{
            syndrome: string
            male: number | null
            female: number | null
            total: number | null
        }>
        vaccination_by_lgu: Array<{
            lgu_id: number
            lgu: string
            influenza: number | null
            pneumococcal: number | null
        }>
        sex_by_lgu: Array<{
            lgu_id: number
            lgu: string
            male: number | null
            female: number | null
        }>
    }
}

interface ReportType {
    id: number
    code: string
    name: string
    slug: string
}

interface GenericDashboardValue {
    percentage: number | null
    formula_configured?: boolean
    formula?: string | null
    male: number | null
    female: number | null
    total: number | null
}

interface GenericDashboardIndicator {
    id: number
    code: string
    name: string
    display_order: number
    quarters: Record<string, GenericDashboardValue>
    annual: GenericDashboardValue
    formula?: {
        id?: number
        type?: string
        display?: string | null
        expression?: string | null
        decimal_places?: number
        is_active?: boolean
    } | null
}

interface GenericDashboardSection {
    id: number
    code: string
    name: string
    description?: string | null
    display_order?: number

    widgets: GenericDashboardWidget[]

    indicators?: GenericDashboardIndicator[]
}

interface GenericDashboardWidget {
    id: number
    key: string
    type:
        | 'kpi'
        | 'summary_table'
        | 'bar_chart'
        | 'line_chart'
        | 'ranking'
        | 'quarterly'
        | 'flow'
        | 'lgu_status'

    title: string
    description?: string | null

    value?: number | null
    formula_result?: number | null
    formula_enabled?: boolean
    formula_type?: string | null
    formula_display?: string | null

    config?: Record<string, unknown>

    data?: Record<string, unknown>[]

    section_id?: number
    section_code?: string
    section_name?: string

    layout?: string
    col_span?: number
    indicator_labels?: Record<string, string>
    chart?: {
        x_key: string
        series: Array<{ key: string; label: string; color?: string }>
        orientation?: 'vertical' | 'horizontal'
        visualization?: 'standard' | 'horizontal' | 'progression'
    }
}

interface GenericDashboardData {
    generated_at: string | number | Date
    filters: {
        year: number
        quarterId: number | null
        lguId: number | null
        status: string
    }

    // Official report indicator sections
    sections: GenericDashboardSection[]

    // Generic LGU/quarter table. The backend builds this from the
    // selected report type's own sections and indicators.
    lgu_summary: Array<{
        type: 'section' | 'indicator'
        key: string
        code?: string
        label: string
        section_id?: number
        display_order?: number
        lgus?: Record<string, QuarterMetric>
    }>

    // LGUs represented in lgu_summary. This is intentionally separate
    // from the filter catalog in BaseDashboardProps.
    lgus: Array<{
        lgu_id: number
        lgu: string
    }>

    // Configured dashboard sections
    dashboard_sections: GenericDashboardSection[]

    // Flat configured widgets
    widgets: GenericDashboardWidget[]

    meta: {
        lgu_count: number
        submission_count: number
        generated_at: string
    }

    fhsis: {
        available: boolean
        report_id?: number
        version?: number
        message?: string
    }
}

interface BaseDashboardProps {
    year: number
    reportType: ReportType
    reportTypes: ReportType[]
    lgus: Array<{
        id: number
        name: string
    }>
}

interface HWPSCProps extends BaseDashboardProps {
    dashboard: DashboardData
}

interface GenericProps extends BaseDashboardProps {
    dashboard: GenericDashboardData
}

type Props = HWPSCProps | GenericProps

const COLORS = {
    navy: '#063b6f',
    blue: '#07549a',
    male: '#2563eb',
    female: '#e11d48',
    screened: '#2563eb',
    positive: '#f59e0b',
    referred: '#16a34a',
    influenza: '#7c3aed',
    pneumococcal: '#0891b2',
    grid: '#e2e8f0',
} as const

const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—'

    return new Intl.NumberFormat('en-PH', {
        maximumFractionDigits: 0,
    }).format(value)
}

const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'

    return `${value.toFixed(2)}%`
}

function getIndicatorColor(
    widget: GenericDashboardWidget,
    code: string,
    index: number,
) {
    const colors = widget.config?.colors

    if (
        colors &&
        typeof colors === 'object' &&
        !Array.isArray(colors)
    ) {
        const configured = (colors as Record<string, unknown>)[code]

        if (typeof configured === 'string') {
            return configured
        }
    }

    const widgetColor = widget.config?.color
    if (typeof widgetColor === 'string') {
        return widgetColor
    }

    return DEFAULT_WIDGET_COLORS[
        index % DEFAULT_WIDGET_COLORS.length
    ]
}

const percentage = (
    numerator: number | null,
    denominator: number | null,
) => {
    if (
        numerator === null ||
        denominator === null ||
        denominator <= 0
    ) {
        return null
    }

    return (numerator / denominator) * 100
}

function KPI({
    title,
    value,
    subtitle,
    icon: Icon,
    tone,
    accentColor,
}: {
    title: string
    value: string
    subtitle?: string
    icon: React.ElementType
    tone: 'blue' | 'cyan' | 'green' | 'amber' | 'violet'
    accentColor?: string
}) {
    const tones = {
        blue: {
            icon: 'bg-blue-50 text-blue-700',
            bar: 'bg-blue-600',
        },
        cyan: {
            icon: 'bg-cyan-50 text-cyan-700',
            bar: 'bg-cyan-600',
        },
        green: {
            icon: 'bg-emerald-50 text-emerald-700',
            bar: 'bg-emerald-600',
        },
        amber: {
            icon: 'bg-amber-50 text-amber-700',
            bar: 'bg-amber-500',
        },
        violet: {
            icon: 'bg-violet-50 text-violet-700',
            bar: 'bg-violet-600',
        },
    }

    const style = tones[tone]
    const accent = accentColor || null

    return (
        <Card className="group relative overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div
                className={`absolute inset-y-0 left-0 w-1 ${accent ? '' : style.bar}`}
                style={accent ? { backgroundColor: accent } : undefined}
            />

            <CardContent className="p-5 pl-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            {title}
                        </p>

                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                            {value}
                        </p>

                        {subtitle && (
                            <p className="mt-1 text-xs text-slate-500">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <div
                        className={`rounded-xl p-2.5 ${accent ? '' : style.icon} transition-transform duration-200 group-hover:scale-105`}
                        style={
                            accent
                                ? {
                                      color: accent,
                                      backgroundColor: `${accent}18`,
                                  }
                                : undefined
                        }
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function SectionHeading({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow?: string
    title: string
    description?: string
    action?: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                {eyebrow && (
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#07549a]">
                        {eyebrow}
                    </p>
                )}

                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                    {title}
                </h2>

                {description && (
                    <p className="mt-1 text-sm text-slate-500">
                        {description}
                    </p>
                )}
            </div>

            {action}
        </div>
    )
}

function ChartCard({
    title,
    description,
    children,
    className = '',
    badge,
}: {
    title: string
    description?: string
    children: React.ReactNode
    className?: string
    badge?: string
}) {
    return (
        <Card
            className={`overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80 ${className}`}
        >
            <CardHeader className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-950">
                            {title}
                        </CardTitle>

                        {description && (
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                {description}
                            </p>
                        )}
                    </div>

                    {badge && (
                        <Badge
                            variant="outline"
                            className="shrink-0 border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                        >
                            {badge}
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-5">
                {children}
            </CardContent>
        </Card>
    )
}


function DashboardSection({
    section,
    reportType,
    year,
}: {
    section: GenericDashboardSection
    reportType: ReportType
    year: number
}) {
    const widgets = section.widgets ?? []

    const isKpiSection =
        widgets.length > 0 &&
        widgets.every((widget) => widget.type === 'kpi')

    return (
        <section className="space-y-4">
            <SectionHeading
                eyebrow={section.code
                    .replaceAll('_', ' ')
                    .toUpperCase()}
                title={section.name}
                description={
                    section.description ?? undefined
                }
            />

            <div
                className={
                    isKpiSection
                        ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7'
                        : 'grid gap-5 xl:grid-cols-3'
                }
            >
                {widgets.map((widget) => (
                    <DashboardWidget
                        key={widget.id}
                        widget={widget}
                        reportType={reportType}
                        year={year}
                    />
                ))}
            </div>
        </section>
    )
}


function getWidgetClass(widget: GenericDashboardWidget) {
    switch (widget.col_span) {
        case 3:
            return 'xl:col-span-3'

        case 2:
            return 'xl:col-span-2'

        default:
            return 'xl:col-span-1'
    }
}

function getSeries(widget: GenericDashboardWidget): Array<'male' | 'female' | 'total'> {
    const configured = widget.config?.series

    if (Array.isArray(configured)) {
        const valid = configured.filter(
            (value): value is 'male' | 'female' | 'total' =>
                value === 'male' || value === 'female' || value === 'total',
        )

        if (valid.length) return valid
    }

    if (typeof configured === 'string' && ['male', 'female', 'total'].includes(configured)) {
        return [configured as 'male' | 'female' | 'total']
    }

    return ['male', 'female']
}

function getSeriesColors(widget: GenericDashboardWidget) {
    const configured = widget.config?.series_colors
    const colors = configured && typeof configured === 'object'
        ? configured as Record<string, unknown>
        : {}

    return {
        male: typeof colors.male === 'string' ? colors.male : COLORS.male,
        female: typeof colors.female === 'string' ? colors.female : COLORS.female,
        total: typeof colors.total === 'string' ? colors.total : COLORS.blue,
    }
}

function getChartSeries(widget: GenericDashboardWidget) {
    const seriesColors = getSeriesColors(widget)
    const widgetColor = getWidgetColor(widget)
    const configuredSeries = getSeries(widget)

    return (widget.chart?.series ?? [])
        .map((series, index) => {
        // The backend uses keys such as:
        //   INDICATOR__male
        //   INDICATOR__female
        //   INDICATOR__total
        // When only one series is configured, the key is just the indicator
        // code, so fall back to the configured series or the label.
        const key = String(series.key ?? '').toLowerCase()
        const label = String(series.label ?? '').toLowerCase()

        let field: 'male' | 'female' | 'total' | null = null

        // Check the exact series suffix first. Important: `female` ends
        // with the string `male`, so a simple `endsWith('male')` check
        // would incorrectly color Female with the Male color.
        if (
            key.endsWith('__female') ||
            key === 'female' ||
            /\bfemale\b$/.test(label)
        ) {
            field = 'female'
        } else if (
            key.endsWith('__male') ||
            key === 'male' ||
            /\bmale\b$/.test(label)
        ) {
            field = 'male'
        } else if (
            key.endsWith('__total') ||
            key === 'total' ||
            /\btotal\b$/.test(label)
        ) {
            field = 'total'
        } else if (configuredSeries.length === 1) {
            field = configuredSeries[0]
        } else if (configuredSeries[index]) {
            field = configuredSeries[index]
        }

        return {
            ...series,
            color: field
                ? seriesColors[field]
                : series.color ?? widgetColor,
        }
    })
        .filter(
            (series, index, all) =>
                index === all.findIndex((item) => item.key === series.key),
        )
}

const DEFAULT_WIDGET_COLORS = [
    '#2563eb', // blue
    '#f59e0b', // amber
    '#16a34a', // green
    '#e11d48', // rose
    '#7c3aed', // violet
    '#0891b2', // cyan
    '#ea580c', // orange
    '#475569', // slate
]

function getWidgetColor(
    widget: GenericDashboardWidget,
    index = 0,
) {
    const configuredColor =
        typeof widget.config?.color === 'string'
            ? widget.config.color
            : typeof widget.config?.accentColor === 'string'
              ? widget.config.accentColor
              : null

    return (
        configuredColor ||
        DEFAULT_WIDGET_COLORS[
            index % DEFAULT_WIDGET_COLORS.length
        ]
    )
}

function getIndicatorLabel(widget: GenericDashboardWidget, code: string) {
    const labels = widget.indicator_labels
    if (labels && typeof labels === 'object') {
        const label = labels[code]
        if (typeof label === 'string') return label
    }

    return code
}

function GenericBarChart({
    data,
    categoryKey,
    dataKeys,
    height = 330,
    horizontal = false,
    colors = {},
}: {
    data: Record<string, unknown>[]
    categoryKey: string
    dataKeys: string[]
    height?: number
    horizontal?: boolean
    colors?: Record<string, string>
}) {
    const chartConfig = Object.fromEntries(
        dataKeys.map((key, index) => [
            key,
            {
                label: formatColumnName(key),
                color:
                    colors[key] ??
                    DEFAULT_WIDGET_COLORS[
                        index % DEFAULT_WIDGET_COLORS.length
                    ],
            },
        ]),
    ) satisfies ChartConfig

    return (
        <ChartContainer
            config={chartConfig}
            className="w-full"
            style={{ height }}
        >
            <BarChart
                data={data}
                layout={
                    horizontal
                        ? 'vertical'
                        : 'horizontal'
                }
                margin={{
                    top: 10,
                    right: 15,
                    left: horizontal ? 20 : -10,
                    bottom: 10,
                }}
            >
                <CartesianGrid
                    vertical={!horizontal}
                    horizontal={horizontal}
                    stroke={COLORS.grid}
                />

                {horizontal ? (
                    <>
                        <XAxis
                            type="number"
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                        />

                        <YAxis
                            type="category"
                            dataKey={categoryKey}
                            width={120}
                            tickLine={false}
                            axisLine={false}
                        />
                    </>
                ) : (
                    <>
                        <XAxis
                            dataKey={categoryKey}
                            tickLine={false}
                            axisLine={false}
                        />

                        <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                        />
                    </>
                )}

                <ChartTooltip
                    content={
                        <ChartTooltipContent />
                    }
                />

                <ChartLegend />

                {dataKeys.map((key) => (
                    <Bar
                        key={key}
                        dataKey={key}
                        fill={`var(--color-${key})`}
                        radius={
                            horizontal
                                ? [0, 5, 5, 0]
                                : [5, 5, 0, 0]
                        }
                    />
                ))}
            </BarChart>
        </ChartContainer>
    )
}

function QuarterlyWidget({
    widget,
}: {
    widget: GenericDashboardWidget
}) {
    const data = widget.data ?? []
    const chart = widget.chart
    const chartSeries = getChartSeries(widget)
    const horizontal =
        widget.config?.visualization === 'horizontal' ||
        widget.config?.orientation === 'horizontal'

    if (!data.length || !chartSeries.length || !chart) {
        return (
            <div className="flex h-[330px] items-center justify-center text-sm text-slate-500">
                No chart data available.
            </div>
        )
    }

    return (
        <div className="h-[330px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout={horizontal ? 'vertical' : 'horizontal'}
                    margin={{
                        top: 10,
                        right: horizontal ? 24 : 10,
                        left: horizontal ? 80 : -10,
                        bottom: horizontal ? 10 : 0,
                    }}
                >
                    <CartesianGrid
                        vertical={!horizontal}
                        horizontal={horizontal}
                        stroke={COLORS.grid}
                    />

                    {horizontal ? (
                        <>
                            <XAxis
                                type="number"
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                type="category"
                                dataKey={chart.x_key}
                                tickLine={false}
                                axisLine={false}
                                width={130}
                            />
                        </>
                    ) : (
                        <>
                            <XAxis
                                dataKey={chart.x_key}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                        </>
                    )}

                    <Tooltip />
                    <ChartLegend />

                    {chartSeries.map((series) => (
                        <Bar
                            key={series.key}
                            dataKey={series.key}
                            name={series.label}
                            fill={series.color}
                            radius={
                                horizontal
                                    ? [0, 5, 5, 0]
                                    : [5, 5, 0, 0]
                            }
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

function FlowWidget({
    widget,
}: {
    widget: GenericDashboardWidget
}) {
    const data = widget.data ?? []
    const chart = widget.chart
    const chartSeries = getChartSeries(widget)
    const indicatorLabels = widget.indicator_labels ?? {}

    if (!data.length || !chartSeries.length || !chart) {
        return (
            <div className="flex h-[330px] items-center justify-center text-sm text-slate-500">
                No flow data available.
            </div>
        )
    }

    // A generic Flow widget becomes a progression pipeline when the
    // configuration uses group_by=indicator. This is intentionally
    // report-agnostic: the administrator chooses the indicators.
    const isProgression =
        widget.config?.visualization === 'progression' ||
        widget.config?.group_by === 'indicator'

    if (isProgression) {
        const stages = chartSeries
            .map((series) => {
                const seriesKey = String(series.key ?? '')
                const row = data.find(
                    (item) =>
                        String(item[chart.x_key] ?? '').toLowerCase() ===
                        seriesKey.toLowerCase(),
                )

                if (!row) return null

                const indicatorCode = String(
                    row.indicator_code ??
                        row.indicator ??
                        seriesKey,
                )

                return {
                    key: seriesKey,
                    label:
                        String(row.label ?? '') ||
                        indicatorLabels[indicatorCode] ||
                        indicatorLabels[seriesKey] ||
                        series.label,
                    value: Number(
                        row.value ??
                            row[seriesKey] ??
                            0,
                    ),
                    color: series.color,
                }
            })
            .filter(
                (
                    item,
                ): item is {
                    key: string
                    label: string
                    value: number
                    color: string
                } => item !== null,
            )

        if (!stages.length) {
            return (
                <div className="flex h-[330px] items-center justify-center text-sm text-slate-500">
                    No progression data available.
                </div>
            )
        }

        return (
            <div className="flex min-h-[330px] flex-col justify-center gap-3">
                {stages.map((stage, index) => (
                    <React.Fragment key={stage.key}>
                        <div
                            className="rounded-xl border p-4"
                            style={{
                                borderColor: `${stage.color}55`,
                                backgroundColor: `${stage.color}0D`,
                            }}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p
                                        className="text-[11px] font-bold uppercase tracking-wide"
                                        style={{ color: stage.color }}
                                    >
                                        {stage.label}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-slate-950">
                                        {formatNumber(stage.value)}
                                    </p>
                                </div>

                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                                    style={{ backgroundColor: stage.color }}
                                >
                                    {index === stages.length - 1 ? '→' : '✓'}
                                </div>
                            </div>
                        </div>

                        {index < stages.length - 1 && (
                            <div className="flex justify-center text-slate-300">
                                <ChevronRight className="h-5 w-5 rotate-90" />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        )
    }

    return (
        <div className="h-[330px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -10,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid
                        vertical={false}
                        stroke={COLORS.grid}
                    />

                    <XAxis
                        dataKey={chart.x_key}
                        tickLine={false}
                        axisLine={false}
                    />

                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />

                    <Tooltip />
                    <ChartLegend />

                    {chartSeries.map((series) => (
                        <Line
                            key={series.key}
                            type="monotone"
                            dataKey={series.key}
                            name={series.label}
                            stroke={series.color}
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

function LineTrendWidget({
    widget,
}: {
    widget: GenericDashboardWidget
}) {
    const data = widget.data ?? []
    const chart = widget.chart
    const chartSeries = getChartSeries(widget)

    if (!data.length || !chartSeries.length || !chart) {
        return (
            <div className="flex h-[330px] items-center justify-center text-sm text-slate-500">
                No trend data available.
            </div>
        )
    }

    return (
        <div className="h-[330px] w-full">
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <LineChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: -10,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid
                        vertical={false}
                        stroke={COLORS.grid}
                    />

                    <XAxis
                        dataKey={chart.x_key}
                        tickLine={false}
                        axisLine={false}
                    />

                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />

                    <Tooltip />

                    <ChartLegend />

                    {chartSeries.map((series) => (
                        <Line
                            key={series.key}
                            type="monotone"
                            dataKey={series.key}
                            name={series.label}
                            stroke={series.color}
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

function DashboardWidget({
    widget,
    reportType,
    year,
}: {
    widget: GenericDashboardWidget
    reportType: ReportType
    year: number
}) {
    const className = getWidgetClass(widget)
    const accentColor = getWidgetColor(widget)

    switch (widget.type) {
        case 'kpi': {
            // The backend exposes formula_result as the resolved KPI value.
            // Use it whenever available so formula KPIs do not fall back to
            // the raw numerator (for example 37 instead of 37.04%).
            const formulaType =
                widget.formula_type ??
                (widget.config?.formula as { type?: string } | undefined)?.type ??
                (widget.config?.formula_type as string | undefined)

            const resolvedValue =
                widget.formula_result ?? widget.value

            const displayValue =
                formulaType === 'percentage' &&
                resolvedValue !== null &&
                resolvedValue !== undefined
                    ? `${Number(resolvedValue).toFixed(2)}%`
                    : formatNumber(resolvedValue)

            return (
                <div className={className}>
                    <KPI
                        title={widget.title}
                        value={displayValue}
                        subtitle={
                            widget.description ??
                            widget.formula_display ??
                            undefined
                        }
                        icon={Users}
                        tone="blue"
                        accentColor={accentColor}
                    />
                </div>
            )
        }

        case 'quarterly':
        case 'bar_chart':
            return (
                <div className={className}>
                    <ChartCard
                        title={widget.title}
                        description={widget.description ?? undefined}
                        badge={
                            widget.type === 'bar_chart'
                                ? 'BAR'
                                : widget.config?.visualization === 'horizontal'
                                  ? 'BAR'
                                  : 'Q1–Q4'
                        }
                    >
                        <QuarterlyWidget widget={widget} />
                    </ChartCard>
                </div>
            )

        case 'flow':
            return (
                <div className={className}>
                    <ChartCard
                        title={widget.title}
                        description={widget.description ?? undefined}
                        badge="FLOW"
                    >
                        <FlowWidget widget={widget} />
                    </ChartCard>
                </div>
            )

        case 'line_chart':
            return (
                <div className={className}>
                    <ChartCard
                        title={widget.title}
                        description={widget.description ?? undefined}
                        badge="TREND"
                    >
                        <LineTrendWidget widget={widget} />
                    </ChartCard>
                </div>
            )

        case 'summary_table':
            return (
                <div className={className}>
                    <SummaryTableWidget
                        widget={widget}
                        reportType={reportType}
                        year={year}
                    />
                </div>
            )

        case 'lgu_status':
            return (
                <div className={className}>
                    <LguStatusWidget
                        widget={widget}
                        reportType={reportType}
                        year={year}
                    />
                </div>
            )

        case 'ranking':
            return (
                <div className={className}>
                    <RankingWidget widget={widget} />
                </div>
            )

        default:
            return null
    }
}

function lguStatusLabel(row: Record<string, unknown>): string {
    const status = String(row.status ?? '').toLowerCase()
    const statusName = String(row.status_name ?? '').trim()

    if (!status) return 'No Data'
    if (status === 'submitted') return 'Reported'
    if (statusName) return statusName

    return status
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function lguStatusClass(row: Record<string, unknown>): string {
    const status = String(row.status ?? '').toLowerCase()

    if (!status) {
        return 'border-slate-200 bg-slate-50 text-slate-500'
    }

    if (status === 'approved' || status === 'submitted' || status === 'validated') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }

    if (status === 'rejected') {
        return 'border-red-200 bg-red-50 text-red-700'
    }

    if (status === 'draft') {
        return 'border-amber-200 bg-amber-50 text-amber-700'
    }

    return 'border-blue-200 bg-blue-50 text-blue-700'
}

function LguStatusWidget({
    widget,
    reportType,
    year,
}: {
    widget: GenericDashboardWidget
    reportType: ReportType
    year: number
}) {
    const data = widget.data ?? []
    const meta = (widget as GenericDashboardWidget & {
        lgu_status?: Record<string, unknown>
    }).lgu_status ?? {}

    const indicatorLabel = String(
        meta.indicator_label ??
            widget.config?.indicator_label ??
            'Reported Value',
    )

    return (
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
            <CardHeader className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-950">
                            {widget.title}
                        </CardTitle>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            {widget.description ??
                                'Click an LGU to open its detailed profile.'}
                        </p>
                    </div>
                    <Users className="h-5 w-5 text-slate-400" />
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {data.length === 0 ? (
                    <div className="flex min-h-[180px] items-center justify-center text-sm text-slate-500">
                        No LGU data available.
                    </div>
                ) : (
                    <div className="max-h-[430px] overflow-auto">
                        <table className="w-full min-w-[620px] text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr className="border-b text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="px-4 py-3 text-left">LGU</th>
                                    <th className="px-4 py-3 text-right">
                                        {indicatorLabel}
                                    </th>
                                    {/* <th className="px-4 py-3 text-right">
                                        Coverage
                                    </th> */}
                                    <th className="px-4 py-3 text-center">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, index) => {
                                    const lguId = Number(row.lgu_id)
                                    const hasLgu = Number.isFinite(lguId) && lguId > 0
                                    const href = hasLgu
                                        ? `/justine/reports/${reportType.slug}/lgu/${lguId}?year=${year}`
                                        : '#'

                                    return (
                                        <tr
                                            key={lguId || index}
                                            className="group border-b border-slate-100 last:border-0 hover:bg-blue-50/40"
                                        >
                                            <td className="px-4 py-3">
                                                {hasLgu ? (
                                                    <Link
                                                        href={href}
                                                        className="inline-flex items-center gap-1 font-semibold text-slate-800 transition-colors hover:text-[#07549a] hover:underline"
                                                    >
                                                        {String(row.lgu ?? 'Unknown LGU')}
                                                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                                    </Link>
                                                ) : (
                                                    <span className="font-semibold text-slate-800">
                                                        {String(row.lgu ?? 'Unknown LGU')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-700">
                                                {formatValue(row.value)}
                                            </td>
                                            {/* <td className="px-4 py-3 text-right font-semibold text-slate-700">
                                                {formatPercent(
                                                    typeof row.coverage === 'number'
                                                        ? row.coverage
                                                        : null,
                                                )}
                                            </td> */}
                                            <td className="px-4 py-3 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={lguStatusClass(row)}
                                                >
                                                    {lguStatusLabel(row)}
                                                </Badge>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function SummaryTableWidget({
    widget,
    reportType,
    year,
}: {
    widget: GenericDashboardWidget
    reportType: ReportType
    year: number
}) {
    const data = widget.data ?? []
    const series = getSeries(widget)
    const isLguTable = widget.config?.group_by === 'lgu'
    const showPercentage =
        !isLguTable &&
        data.some(
            (row) => row.percentage !== null && row.percentage !== undefined,
        )

    return (
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
            <CardHeader className="border-b border-slate-100 px-5 py-4">
                <CardTitle className="text-base font-bold text-slate-950">
                    {widget.title}
                </CardTitle>
                {widget.description && (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {widget.description}
                    </p>
                )}
            </CardHeader>

            <CardContent className="p-0">
                {data.length === 0 ? (
                    <div className="flex min-h-[180px] items-center justify-center text-sm text-slate-500">
                        No monitoring data available.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                        {isLguTable ? 'LGU' : 'Indicator Name'}
                                    </th>
                                    {isLguTable && (
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            Status
                                        </th>
                                    )}
                                    {series.map((metric) => (
                                        <th
                                            key={metric}
                                            className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500"
                                        >
                                            {metric}
                                        </th>
                                    ))}
                                    {showPercentage && (
                                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            %
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, index) => (
                                    <tr
                                        key={index}
                                        className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                                    >
                                        <td className="px-4 py-3">
                                            {isLguTable && row.lgu_id ? (
                                                <Link
                                                    href={`/justine/reports/${reportType.slug}/lgu/${row.lgu_id}?year=${year}`}
                                                    className="inline-flex items-center gap-1 font-semibold text-slate-800 transition-colors hover:text-[#07549a] hover:underline"
                                                >
                                                    {String(row.lgu ?? 'Unknown LGU')}
                                                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                                </Link>
                                            ) : (
                                                <>
                                                    <div className="font-medium text-slate-900">
                                                        {String(row.indicator ?? row.indicator_code ?? 'Indicator')}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {String(row.indicator_code ?? '')}
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        {isLguTable && (
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={lguStatusClass(row)}
                                                >
                                                    {lguStatusLabel(row)}
                                                </Badge>
                                            </td>
                                        )}
                                        {series.map((metric) => (
                                            <td
                                                key={metric}
                                                className="px-4 py-3 text-right font-semibold text-slate-700"
                                            >
                                                {formatValue(row[metric])}
                                            </td>
                                        ))}
                                        {showPercentage && (
                                            <td className="px-4 py-3 text-right font-semibold text-slate-700">
                                                {row.percentage === null || row.percentage === undefined
                                                    ? '—'
                                                    : `${Number(row.percentage).toFixed(2)}%`}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function RankingWidget({
    widget,
}: {
    widget: GenericDashboardWidget
}) {
    const data = widget.data ?? []
    const valueField =
        widget.config?.value === 'male' ||
        widget.config?.value === 'female' ||
        widget.config?.value === 'total'
            ? widget.config.value
            : 'total'
    const mode = widget.config?.ranking_mode === 'indicator_progress'
        ? 'indicator_progress'
        : 'lgu'
    const accent = getWidgetColor(widget)

    if (mode === 'indicator_progress') {
        const max = Math.max(
            1,
            ...data.map((item) => Number(item.value ?? 0)),
        )

        return (
            <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                <CardHeader className="border-b border-slate-100 px-5 py-4">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-950">
                            {widget.title}
                        </CardTitle>
                        {widget.description && (
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                {widget.description}
                            </p>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="px-5 pb-10 pt-10">
                    {data.length === 0 ? (
                        <div className="flex min-h-[180px] items-center justify-center text-sm text-slate-500">
                            No indicator data available.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.map((item, index) => {
                                const value = Number(item.value ?? 0)
                                const percent = Math.max(0, Math.min(100, (value / max) * 100))
                                const color = getIndicatorColor(
                                    widget,
                                    String(item.indicator_code ?? ''),
                                    index,
                                )

                                return (
                                    <div key={`${String(item.indicator_code ?? index)}-${index}`}>
                                        <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                                            <span className="min-w-0 truncate font-medium text-slate-700">
                                                {String(item.label ?? item.indicator ?? item.indicator_name ?? item.indicator_code ?? 'Indicator')}
                                            </span>
                                            <span className="shrink-0 font-bold text-slate-900">
                                                {formatValue(value)}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${percent}%`,
                                                    backgroundColor: color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
            <CardHeader className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-950">
                            {widget.title}
                        </CardTitle>
                        {widget.description && (
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                {widget.description}
                            </p>
                        )}
                    </div>
                    <Badge variant="outline">{valueField}</Badge>
                </div>
            </CardHeader>

            <CardContent className="p-5">
                {data.length === 0 ? (
                    <div className="flex min-h-[180px] items-center justify-center text-sm text-slate-500">
                        No ranking data available.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.map((item, index) => (
                            <div
                                key={`${String(item.lgu_id ?? index)}-${index}`}
                                className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                        style={{
                                            color: accent,
                                            backgroundColor: `${accent}18`,
                                        }}
                                    >
                                        {index + 1}
                                    </div>
                                    <span className="truncate text-sm font-medium text-slate-700">
                                        {String(item.lgu ?? 'Unknown LGU')}
                                    </span>
                                </div>
                                <span className="shrink-0 text-sm font-bold text-slate-950">
                                    {formatValue(item.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


export default function Dashboard(props: Props) {
    const [todayMeeting, setTodayMeeting] =
        useState<DashboardMeetingReminder | null>(null)

    const [meetingReminderOpen, setMeetingReminderOpen] =
        useState(false)

    const [meetingReminderDisabled, setMeetingReminderDisabled] =
        useState(false)

    useEffect(() => {
        let cancelled = false;

        const loadTodayMeetings = async () => {
            try {
                const response = await fetch(
                    '/justine/calendar/reminders/today',
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                        credentials: 'same-origin',
                    },
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const meetings: DashboardMeetingReminder[] =
                    await response.json();

                if (cancelled) return;

                // Only skip meetings for which the user selected
                // "Don't show again".
                const nextMeeting = meetings.find(
                    (meeting) =>
                        localStorage.getItem(
                            `hwpsc_meeting_never_show_${meeting.id}`,
                        ) !== 'true',
                );

                if (nextMeeting) {
                    setTodayMeeting((current) => {
                        // Keep the current meeting if it is still
                        // eligible to be displayed.
                        if (
                            current?.id === nextMeeting.id
                        ) {
                            return current;
                        }

                        return nextMeeting;
                    });

                    setMeetingReminderOpen((isOpen) => {
                        // Do not reopen a modal the user just dismissed
                        // during this page session.
                        return isOpen;
                    });

                    // Open a reminder when no modal is currently open
                    // or the current meeting is no longer eligible.
                    setTodayMeeting((current) => {
                        if (
                            current &&
                            meetings.some(
                                (meeting) =>
                                    meeting.id === current.id &&
                                    localStorage.getItem(
                                        `hwpsc_meeting_never_show_${meeting.id}`,
                                    ) !== 'true',
                            )
                        ) {
                            return current;
                        }

                        return nextMeeting;
                    });

                    setMeetingReminderOpen((isOpen) => {
                        if (isOpen) return true;
                        return true;
                    });
                } else {
                    setMeetingReminderOpen(false);
                    setTodayMeeting(null);
                }
            } catch (error) {
                console.error(
                    '[Meeting Reminder] Failed:',
                    error,
                );
            }
        };

        loadTodayMeetings();

        const interval = window.setInterval(
            loadTodayMeetings,
            10_000,
        );

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);

    /**
     * Dismiss for today
     */
    const dismissMeetingReminder = () => {
        // Close only. Do not save a permanent dismissal.
        setMeetingReminderOpen(false);
    };


    /**
     * Permanently disable meeting reminders
     */
    const dontShowMeetingReminderAgain = () => {
        if (todayMeeting) {
            localStorage.setItem(
                `hwpsc_meeting_never_show_${todayMeeting.id}`,
                'true',
            );
        }

        setMeetingReminderOpen(false);
        setTodayMeeting(null);
    };

    return (
        <>
            {props.reportType.code === 'HWPSC' ? (
                <HWPSCDashboard
                    dashboard={props.dashboard as DashboardData}
                    year={props.year}
                    reportType={props.reportType}
                    reportTypes={props.reportTypes}
                    lgus={props.lgus}
                />
            ) : (
                <GenericDashboardView
                    dashboard={props.dashboard as GenericDashboardData}
                    year={props.year}
                    reportType={props.reportType}
                    reportTypes={props.reportTypes}
                    lgus={props.lgus}
                />
            )}

            {meetingReminderOpen &&
                todayMeeting &&
                !meetingReminderDisabled && (
                    <MeetingReminderModal
                        meeting={todayMeeting}
                        onClose={dismissMeetingReminder}
                        onDontShowAgain={
                            dontShowMeetingReminderAgain
                        }
                        onViewCalendar={() => {
                            window.location.href =
                                '/calendar'
                        }}
                    />
                )}
        </>
    )
}


interface LguQuarterlyDashboard {
    filters: DashboardData['filters']
    lgus: Array<{
        lgu_id: number
        lgu: string
    }>
    lgu_summary: Array<{
        type: 'section' | 'indicator'
        key: string
        label: string
        section_id?: number
        display_order?: number
        lgus?: Record<string, QuarterMetric>
    }>
}

function LguQuarterlyTable({
    dashboard,
    year,
    selectedQuarterId,
    reportTypeName,
    onRedIndicator,
}: {
    dashboard: LguQuarterlyDashboard
    year: number
    selectedQuarterId: number | null
    reportTypeName: string
    onRedIndicator?: (indicator: {
        label: string
        quarter: string
        percentage: number
        total: number | null
        denominator: number | null
        denominatorLabel: string
        formulaConfigured: boolean
        formula: string | null
    }) => void
}) {
    const selectedQuarter = selectedQuarterId
        ? `Quarter ${selectedQuarterId}`
        : 'All Quarters'

    const rows = dashboard.lgu_summary ?? []

    return (
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200/80">
            <div className="border-b border-slate-100 bg-white px-5 py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#07549a]">
                            LGU Quarterly View
                        </p>
                        <h3 className="text-base font-bold text-slate-950">
                            {selectedQuarter} LGU Summary
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            {reportTypeName} LGU-level male, female, total and percentage values for {year}.
                            Use the Quarter filter above to switch between Q1–Q4.
                        </p>
                    </div>

                    <Badge
                        variant="outline"
                        className="w-fit border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                    >
                        {selectedQuarter}
                    </Badge>
                </div>
            </div>

            {!selectedQuarterId ? (
                <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-800">
                    Select <strong>Quarter 1</strong>, <strong>Quarter 2</strong>,
                    <strong> Quarter 3</strong>, or <strong>Quarter 4</strong> from
                    the Dashboard Filters to view LGU-level quarterly data.
                </div>
            ) : null}

            <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse">
                    <thead>
                        <tr className="bg-[#063b6f] text-[10px] font-bold uppercase tracking-wide text-white">
                            <th className="sticky left-0 z-20 min-w-[330px] border-r border-white/15 bg-[#063b6f] px-4 py-3 text-left">
                                Indicator
                            </th>
                            {dashboard.lgus.map((lgu) => (
                                <th
                                    key={lgu.lgu_id}
                                    colSpan={4}
                                    className="border-r border-white/15 px-2 py-3 text-center"
                                >
                                    {lgu.lgu}
                                </th>
                            ))}
                        </tr>
                        <tr className="bg-slate-100 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                            <th className="sticky left-0 z-20 border border-slate-200 bg-slate-100 px-4 py-2 text-left">
                                M / F / T / %
                            </th>
                            {dashboard.lgus.map((lgu) => (
                                <React.Fragment key={`head-${lgu.lgu_id}`}>
                                    <th className="border border-slate-200 px-2 py-2">M</th>
                                    <th className="border border-slate-200 px-2 py-2">F</th>
                                    <th className="border border-slate-200 px-2 py-2">T</th>
                                    <th className="border border-slate-200 bg-amber-50 px-2 py-2 text-amber-700">%</th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((row) => {
                            if (row.type === 'section') {
                                return (
                                    <tr key={row.key}>
                                        <td
                                            colSpan={1 + dashboard.lgus.length * 4}
                                            className="border border-slate-300 bg-slate-200 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-900"
                                        >
                                            {row.label}
                                        </td>
                                    </tr>
                                )
                            }

                            return (
                                <tr key={row.key} className="bg-white">
                                    <td className="sticky left-0 z-10 border border-slate-200 bg-white px-4 py-2.5 text-left text-xs font-medium text-slate-700">
                                        {row.label}
                                    </td>

                                    {dashboard.lgus.map((lgu) => {
                                        const metric = row.lgus?.[String(lgu.lgu_id)]

                                        return (
                                            <React.Fragment key={`${row.key}-${lgu.lgu_id}`}>
                                                <td className="border border-slate-200 px-2 py-2 text-center text-xs">
                                                    {formatNumber(metric?.male)}
                                                </td>
                                                <td className="border border-slate-200 px-2 py-2 text-center text-xs">
                                                    {formatNumber(metric?.female)}
                                                </td>
                                                <td className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold">
                                                    {formatNumber(metric?.total)}
                                                </td>
                                                <td className="border border-slate-200 bg-amber-50/60 px-2 py-2 text-center text-xs">
                                                    {metric?.percentage !== null &&
                                                    metric?.percentage !== undefined &&
                                                    Number(metric.percentage) > 100 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onRedIndicator?.({
                                                                    label: row.label,
                                                                    quarter: selectedQuarter,
                                                                    percentage: Number(metric.percentage),
                                                                    total: metric.total ?? null,
                                                                    denominator: null,
                                                                    denominatorLabel:
                                                                        metric.formula_configured
                                                                            ? 'Formula'
                                                                            : 'Calculated',
                                                                    formulaConfigured:
                                                                        Boolean(metric.formula_configured),
                                                                    formula: metric.formula ?? null,
                                                                })
                                                            }
                                                            className="font-bold text-red-600 underline decoration-red-300 underline-offset-2 hover:text-red-800"
                                                        >
                                                            {formatPercent(metric.percentage)}
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-500">
                                                            {formatPercent(metric?.percentage)}
                                                        </span>
                                                    )}
                                                </td>
                                            </React.Fragment>
                                        )
                                    })}
                                </tr>
                            )
                        })}

                        {!rows.length && (
                            <tr>
                                <td
                                    colSpan={1 + dashboard.lgus.length * 4}
                                    className="px-4 py-10 text-center text-sm text-slate-500"
                                >
                                    No LGU data is available for the selected filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

function HWPSCDashboard({
    dashboard,
    year,
    reportType,
    reportTypes,
    lgus,
}: HWPSCProps) {
    const summaryMap = useMemo(
        () =>
            Object.fromEntries(
                dashboard.ncr_summary.map((row) => [row.key, row]),
            ) as Record<string, NCRSummaryRow>,
        [dashboard.ncr_summary],
    )

    const screened = summaryMap.screened

    const [redIndicator, setRedIndicator] = useState<{
        label: string
        quarter: string
        percentage: number
        total: number | null
        denominator: number | null
        denominatorLabel: string
        formulaConfigured: boolean
        formula: string | null
    } | null>(null)

    const [reportView, setReportView] = useState<'ncr' | 'lgu'>('ncr')

    const fhsisDiff =
        dashboard.fhsis.available &&
        dashboard.fhsis.screened &&
        dashboard.fhsis.screened.total !== null
            ? (dashboard.kpis.screened ?? 0) -
              dashboard.fhsis.screened.total
            : null

    const quarterlyTrend = useMemo(
        () =>
            (dashboard.graphs?.screened_by_quarter ??
                dashboard.quarterly.map((q) => ({
                    quarter: q.quarter ?? `Q${q.quarter_id}`,
                    male: q.male,
                    female: q.female,
                    total: q.total,
                }))).map((item) => ({
                ...item,
                male: item.male ?? undefined,
                female: item.female ?? undefined,
            })),
        [dashboard.graphs, dashboard.quarterly],
    )

    const progressionData =
        dashboard.graphs?.screening_progression ??
        dashboard.quarterly.map((q) => ({
            quarter: q.quarter ?? `Q${q.quarter_id}`,
            screened: q.screened,
            positive: q.positive,
            referred: q.referred,
        }))

    const syndromeData = dashboard.graphs?.positive_syndromes ?? []

    const lguSexData = dashboard.graphs?.sex_by_lgu ?? []

    const vaccinationData =
        dashboard.graphs?.vaccination_by_lgu ?? []

    const screenedChartConfig = {
        male: {
            label: 'Male',
            color: COLORS.male,
        },
        female: {
            label: 'Female',
            color: COLORS.female,
        },
    } satisfies ChartConfig

    const progressionChartConfig = {
        screened: {
            label: 'Screened',
            color: COLORS.screened,
        },
        positive: {
            label: 'Positive',
            color: COLORS.positive,
        },
        referred: {
            label: 'ICP / Referred',
            color: COLORS.referred,
        },
    } satisfies ChartConfig

    const syndromeChartConfig = {
        male: {
            label: 'Male',
            color: COLORS.male,
        },
        female: {
            label: 'Female',
            color: COLORS.female,
        },
    } satisfies ChartConfig

    const lguSexChartConfig = {
        male: {
            label: 'Male',
            color: COLORS.male,
        },
        female: {
            label: 'Female',
            color: COLORS.female,
        },
    } satisfies ChartConfig

    const vaccinationChartConfig = {
        influenza: {
            label: 'Influenza',
            color: COLORS.influenza,
        },
        pneumococcal: {
            label: 'Pneumococcal',
            color: COLORS.pneumococcal,
        },
    } satisfies ChartConfig

    const applyFilters = (
        overrides: Record<string, string | number | undefined>,
    ) => {
        const nextCode = String(
            overrides.type ?? reportType.code,
        )

        const nextType =
            reportTypes.find((type) => type.code === nextCode) ??
            reportType

        const params = new URLSearchParams()

        params.set(
            'year',
            String(overrides.year ?? year),
        )

        // Important: if the filter is explicitly cleared (undefined),
        // do NOT fall back to the previous server value.
        // Using ?? here made "All Quarters" / "All NCR" impossible to select.
        const quarterId = Object.prototype.hasOwnProperty.call(
            overrides,
            'quarterId',
        )
            ? overrides.quarterId
            : dashboard.filters.quarterId

        if (quarterId) {
            params.set('quarterId', String(quarterId))
        }

        const lguId = Object.prototype.hasOwnProperty.call(
            overrides,
            'lguId',
        )
            ? overrides.lguId
            : dashboard.filters.lguId

        if (lguId) {
            params.set('lguId', String(lguId))
        }

        params.set(
            'status',
            String(
                overrides.status ??
                    dashboard.filters.status ??
                    'all',
            ),
        )

        router.get(
            `/justine/reports/${nextType.slug}/dashboard?${params.toString()}`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        )
    }

    const exportDashboard = () => {
        const params = new URLSearchParams({
            type: reportType.code,
            year: String(year),
        })

        if (dashboard.filters.quarterId) {
            params.set(
                'quarterId',
                String(dashboard.filters.quarterId),
            )
        }

        if (dashboard.filters.lguId) {
            params.set(
                'lguId',
                String(dashboard.filters.lguId),
            )
        }

        if (dashboard.filters.status) {
            params.set(
                'status',
                dashboard.filters.status,
            )
        }

        window.location.href =
            `/justine/reports/${reportType.slug}/dashboard/export?${params.toString()}`
    }

    return (
        <>
            <Head
                title={`${reportType.name} Dashboard — NCR ${year}`}
            />

            <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
                {/* Header */}
                <header className="relative overflow-hidden bg-[#063b6f] text-white shadow-lg">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_15%_90%,rgba(255,255,255,0.06),transparent_30%)]" />

                    <div className="relative mx-auto max-w-[1800px] px-5 py-6 lg:px-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner backdrop-blur-sm">
                                    <HeartPulse className="h-7 w-7" />
                                </div>

                                <div>
                                    <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200">
                                        <span>Department of Health</span>
                                        <span className="h-1 w-1 rounded-full bg-blue-300" />
                                        <span>Metro Manila CHD</span>
                                    </div>

                                    <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                                        {reportType.name} Dashboard
                                    </h1>

                                    <p className="mt-1 text-sm text-blue-100">
                                        Geriatric screening, referral and
                                        immunization monitoring
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-200">
                                        Reporting Year
                                    </p>
                                    <p className="mt-0.5 text-xl font-bold">
                                        {year}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-200">
                                        Coverage
                                    </p>
                                    <p className="mt-0.5 text-xl font-bold">
                                        NCR
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-[1800px] px-5 pt-4 lg:px-8">
                    <div className="flex justify-end">
                        <Link
                            href={`/justine/dashboard-configuration/${reportType.slug}`}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#07549a]/30 hover:bg-slate-50 hover:text-[#07549a]"
                        >
                            <Settings2 className="h-4 w-4" />
                            Configure Dashboard
                        </Link>
                    </div>
                </div>

                <main className="mx-auto max-w-[1800px] space-y-7 px-5 py-6 lg:px-8">
                    {/* Filters */}
                    <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200/80">
                        <div className="border-b border-slate-100 bg-white px-5 py-4">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[#07549a]" />
                                <h2 className="text-sm font-bold text-slate-900">
                                    Dashboard Filters
                                </h2>
                            </div>

                            <p className="mt-1 pl-4 text-xs text-slate-500">
                                Select the reporting period and coverage
                                area to update the dashboard.
                            </p>
                        </div>

                        <CardContent className="bg-slate-50/70 p-5">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Report Type
                                    </label>

                                    <select
                                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/10"
                                        value={reportType.code}
                                        onChange={(e) =>
                                            applyFilters({
                                                type: e.target.value,
                                            })
                                        }
                                    >
                                        {reportTypes.map((type) => (
                                            <option
                                                key={type.id}
                                                value={type.code}
                                            >
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Year
                                    </label>

                                    <select
                                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/10"
                                        value={year}
                                        onChange={(e) =>
                                            applyFilters({
                                                year: e.target.value,
                                            })
                                        }
                                    >
                                        <option value={year}>
                                            {year}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Quarter
                                    </label>

                                    <select
                                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/10"
                                        value={
                                            dashboard.filters
                                                .quarterId ?? ''
                                        }
                                        onChange={(e) =>
                                            applyFilters({
                                                quarterId:
                                                    e.target.value ||
                                                    undefined,
                                            })
                                        }
                                    >
                                        <option value="">
                                            All Quarters
                                        </option>
                                        <option value="1">
                                            Quarter 1
                                        </option>
                                        <option value="2">
                                            Quarter 2
                                        </option>
                                        <option value="3">
                                            Quarter 3
                                        </option>
                                        <option value="4">
                                            Quarter 4
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        LGU
                                    </label>

                                    <select
                                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/10"
                                        value={
                                            dashboard.filters.lguId ??
                                            ''
                                        }
                                        onChange={(e) =>
                                            applyFilters({
                                                lguId:
                                                    e.target.value ||
                                                    undefined,
                                            })
                                        }
                                    >
                                        <option value="">
                                            All NCR
                                        </option>

                                        {lgus.map((lgu) => (
                                            <option
                                                key={lgu.id}
                                                value={lgu.id}
                                            >
                                                {lgu.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Submission Status
                                    </label>

                                    <select
                                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/10"
                                        value={
                                            dashboard.filters.status
                                        }
                                        onChange={(e) =>
                                            applyFilters({
                                                status: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="all">
                                            All
                                        </option>
                                        <option value="draft">
                                            Draft
                                        </option>
                                        <option value="submitted">
                                            Submitted
                                        </option>
                                        <option value="approved">
                                            Approved
                                        </option>
                                        <option value="rejected">
                                            Rejected
                                        </option>
                                    </select>
                                </div>

                                <div className="flex items-end gap-2">
                                    <Button
                                        variant="outline"
                                        className="h-10 flex-1 border-slate-200 bg-white"
                                        onClick={() =>
                                            router.reload()
                                        }
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Refresh
                                    </Button>

                                    <Button
                                        className="h-10 bg-[#07549a] px-3 shadow-sm hover:bg-[#063b6f]"
                                        onClick={exportDashboard}
                                        title="Download CSV"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span className="sr-only">
                                            Download CSV
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Executive Overview */}
                    <section className="space-y-4">
                        <SectionHeading
                            eyebrow="Executive Overview"
                            title="NCR Performance Snapshot"
                            description="Current reporting indicators across the selected scope."
                            action={
                                <Badge
                                    variant="outline"
                                    className="border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                                >
                                    {formatNumber(
                                        dashboard.kpis.lgu_count,
                                    )}{' '}
                                    LGUs
                                    <span className="mx-1.5 text-slate-300">
                                        •
                                    </span>
                                    {formatNumber(
                                        dashboard.kpis
                                            .submission_count,
                                    )}{' '}
                                    submissions
                                </Badge>
                            }
                        />

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                            <KPI
                                title="Eligible Target"
                                value={formatNumber(
                                    dashboard.kpis.target,
                                )}
                                subtitle="Senior citizens"
                                icon={Target}
                                tone="blue"
                            />

                            <KPI
                                title="Screened"
                                value={formatNumber(
                                    dashboard.kpis.screened,
                                )}
                                subtitle={`${formatPercent(
                                    dashboard.kpis.coverage,
                                )} of target`}
                                icon={Users}
                                tone="cyan"
                            />

                            <KPI
                                title="Coverage"
                                value={formatPercent(
                                    dashboard.kpis.coverage,
                                )}
                                subtitle="Screened / target"
                                icon={UserCheck}
                                tone="green"
                            />

                            <KPI
                                title="Positive"
                                value={formatNumber(
                                    dashboard.kpis.positive,
                                )}
                                subtitle={`${formatPercent(
                                    dashboard.kpis.positive_rate,
                                )} of screened`}
                                icon={AlertTriangle}
                                tone="amber"
                            />

                            <KPI
                                title="ICP / Referred"
                                value={formatNumber(
                                    dashboard.kpis.referred,
                                )}
                                subtitle={`${formatPercent(
                                    dashboard.kpis.referral_rate,
                                )} of positive`}
                                icon={ArrowRight}
                                tone="violet"
                            />

                            <KPI
                                title="Seen"
                                value={formatNumber(
                                    dashboard.kpis.seen,
                                )}
                                subtitle="Health facility"
                                icon={HeartPulse}
                                tone="blue"
                            />

                            <KPI
                                title="Vaccinated"
                                value={formatNumber(
                                    dashboard.kpis.vaccinated,
                                )}
                                subtitle="Senior citizens"
                                icon={Syringe}
                                tone="green"
                            />
                        </div>
                    </section>

                    {/* Official NCR Summary */}
                    <section className="space-y-4">
                        <SectionHeading
                            eyebrow="Official Report"
                            title="NCR Quarterly Summary"
                            description={`Quarterly male, female, total and percentage values for ${year}.`}
                            action={
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <div
                                        role="tablist"
                                        aria-label="Report view"
                                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
                                    >
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={reportView === 'ncr'}
                                            onClick={() => setReportView('ncr')}
                                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                                reportView === 'ncr'
                                                    ? 'bg-[#063b6f] text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                        >
                                            NCR Summary
                                        </button>
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={reportView === 'lgu'}
                                            onClick={() => setReportView('lgu')}
                                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                                reportView === 'lgu'
                                                    ? 'bg-[#063b6f] text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                        >
                                            LGU / Quarter
                                        </button>
                                    </div>

                                    <Badge className="border-0 bg-[#063b6f] px-3 py-1.5 text-xs hover:bg-[#063b6f]">
                                        {reportType.code}
                                    </Badge>
                                </div>
                            }
                        />

                        {reportView === 'lgu' ? (
                            <LguQuarterlyTable
                                dashboard={dashboard}
                                year={year}
                                selectedQuarterId={dashboard.filters.quarterId}
                                reportTypeName={reportType.name}
                            />
                        ) : (
                        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200/80">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1500px] border-collapse">
                                    <thead>
                                        <tr className="bg-[#063b6f] text-[11px] font-bold uppercase tracking-wide text-white">
                                            <th
                                                rowSpan={2}
                                                className="sticky left-0 z-20 min-w-[330px] border-r border-white/15 bg-[#063b6f] px-4 py-3 text-left"
                                            >
                                                Indicator
                                            </th>

                                            {[1, 2, 3, 4].map(
                                                (quarter) => (
                                                    <th
                                                        key={quarter}
                                                        colSpan={4}
                                                        className="border-r border-white/15 px-2 py-3 text-center"
                                                    >
                                                        Quarter {quarter}
                                                    </th>
                                                ),
                                            )}

                                            <th
                                                colSpan={4}
                                                className="bg-slate-950 px-2 py-3 text-center"
                                            >
                                                Annual Total
                                            </th>
                                        </tr>

                                        <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                                            {[1, 2, 3, 4].map(
                                                (quarter) => (
                                                    <React.Fragment
                                                        key={quarter}
                                                    >
                                                        <th className="border border-slate-200 px-2 py-2">
                                                            M
                                                        </th>
                                                        <th className="border border-slate-200 px-2 py-2">
                                                            F
                                                        </th>
                                                        <th className="border border-slate-200 px-2 py-2">
                                                            T
                                                        </th>
                                                        <th className="border border-slate-200 bg-amber-50 px-2 py-2 text-amber-700">
                                                            %
                                                        </th>
                                                    </React.Fragment>
                                                ),
                                            )}

                                            <th className="border border-slate-700 bg-slate-800 px-2 py-2 text-white">
                                                M
                                            </th>
                                            <th className="border border-slate-700 bg-slate-800 px-2 py-2 text-white">
                                                F
                                            </th>
                                            <th className="border border-slate-700 bg-slate-800 px-2 py-2 text-white">
                                                T
                                            </th>
                                            <th className="border border-slate-200 bg-amber-50 px-2 py-2 text-amber-700">
                                                %
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {(dashboard.ncr_summary ?? []).map((row) => {

                                            /*
                                            * SECTION HEADER
                                            *
                                            * Section rows do not have quarters/annual values.
                                            * Render them separately before accessing row.quarters.
                                            */
                                            if (row.type === 'section') {
                                                return (
                                                    <tr key={row.key}>
                                                        <td
                                                            colSpan={21}
                                                            className="border border-slate-300 bg-slate-200 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-900"
                                                        >
                                                            {row.label}
                                                        </td>
                                                    </tr>
                                                )
                                            }

                                            /*
                                            * INDICATOR ROW
                                            */
                                            const quarters = row.quarters

                                            if (!quarters) {
                                                return null
                                            }

                                            return (
                                                <tr
                                                    key={row.key}
                                                    className="bg-white"
                                                >
                                                    <td className="sticky left-0 z-10 border border-slate-200 bg-white px-4 py-2.5 text-left text-xs font-medium text-slate-700">
                                                        {row.label}
                                                    </td>

                                                    {[1, 2, 3, 4].map((quarter) => {
                                                        const q =
                                                            quarters[
                                                                quarter as 1 | 2 | 3 | 4
                                                            ]

                                                        if (!q) {
                                                            return (
                                                                <React.Fragment
                                                                    key={quarter}
                                                                >
                                                                    <td className="border border-slate-200 px-2 py-2 text-center text-xs">
                                                                        —
                                                                    </td>
                                                                    <td className="border border-slate-200 px-2 py-2 text-center text-xs">
                                                                        —
                                                                    </td>
                                                                    <td className="border border-slate-200 px-2 py-2 text-center text-xs">
                                                                        —
                                                                    </td>
                                                                    <td className="border border-slate-200 bg-amber-50/60 px-2 py-2 text-center text-xs">
                                                                        N/A
                                                                    </td>
                                                                </React.Fragment>
                                                            )
                                                        }

                                                        /*
                                                        * Use the percentage calculated by Laravel.
                                                        * This is important for the Formula Builder.
                                                        */
                                                        const percent =
                                                            q.percentage ?? null

                                                        const rowFormula =
                                                            row.formula ?? null

                                                        const formula =
                                                            q.formula ??
                                                            getFormulaText(rowFormula)

                                                        const formulaConfigured =
                                                            q.formula_configured ??
                                                            (isFormulaActive(rowFormula) ||
                                                                Boolean(formula))

                                                        const isRed =
                                                            percent !== null &&
                                                            percent > 100

                                                        return (
                                                            <React.Fragment
                                                                key={quarter}
                                                            >
                                                                <td className="border border-slate-200 px-2 py-2 text-center text-xs">
                                                                    {formatNumber(q.male)}
                                                                </td>

                                                                <td className="border border-slate-200 px-2 py-2 text-center text-xs">
                                                                    {formatNumber(q.female)}
                                                                </td>

                                                                <td className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold">
                                                                    {formatNumber(q.total)}
                                                                </td>

                                                                <td className="border border-slate-200 bg-amber-50/60 px-2 py-2 text-center text-xs">
                                                                    {isRed ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setRedIndicator({
                                                                                    label: row.label,
                                                                                    quarter: `Quarter ${quarter}`,
                                                                                    percentage: percent,
                                                                                    total: q.total,
                                                                                    denominator: null,
                                                                                    denominatorLabel:
                                                                                        formulaConfigured
                                                                                            ? 'Formula'
                                                                                            : 'Calculated',
                                                                                    formulaConfigured,
                                                                                    formula,
                                                                                })
                                                                            }
                                                                            className="font-bold text-red-600 underline decoration-red-300 underline-offset-2 hover:text-red-800"
                                                                        >
                                                                            {formatPercent(percent)}
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-slate-500">
                                                                            {formatPercent(percent)}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </React.Fragment>
                                                        )
                                                    })}

                                                    {/* Annual */}
                                                    {(() => {
                                                        const annual = row.annual

                                                        if (!annual) {
                                                            return (
                                                                <>
                                                                    <td className="border border-slate-700 bg-slate-800 px-2 py-2 text-center text-xs text-white">
                                                                        —
                                                                    </td>
                                                                    <td className="border border-slate-700 bg-slate-800 px-2 py-2 text-center text-xs text-white">
                                                                        —
                                                                    </td>
                                                                    <td className="border border-slate-700 bg-slate-800 px-2 py-2 text-center text-xs text-white">
                                                                        —
                                                                    </td>
                                                                    <td className="border border-slate-200 bg-amber-50 px-2 py-2 text-center text-xs">
                                                                        N/A
                                                                    </td>
                                                                </>
                                                            )
                                                        }

                                                        const annualPercent =
                                                            annual.percentage ?? null

                                                        const annualRowFormula =
                                                            row.formula ?? null

                                                        const annualFormula =
                                                            annual.formula ??
                                                            getFormulaText(annualRowFormula)

                                                        const annualFormulaConfigured =
                                                            annual.formula_configured ??
                                                            (isFormulaActive(annualRowFormula) ||
                                                                Boolean(annualFormula))

                                                        const isAnnualRed =
                                                            annualPercent !== null &&
                                                            annualPercent > 100

                                                        return (
                                                            <>
                                                                <td className="border border-slate-700 bg-slate-800 px-2 py-2 text-center text-xs text-white">
                                                                    {formatNumber(annual.male)}
                                                                </td>

                                                                <td className="border border-slate-700 bg-slate-800 px-2 py-2 text-center text-xs text-white">
                                                                    {formatNumber(annual.female)}
                                                                </td>

                                                                <td className="border border-slate-700 bg-slate-800 px-2 py-2 text-center text-xs font-semibold text-white">
                                                                    {formatNumber(annual.total)}
                                                                </td>

                                                                <td className="border border-slate-200 bg-amber-50 px-2 py-2 text-center text-xs">
                                                                    {isAnnualRed ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setRedIndicator({
                                                                                    label: row.label,
                                                                                    quarter: 'Annual Total',
                                                                                    percentage: annualPercent,
                                                                                    total: annual.total,
                                                                                    denominator: null,
                                                                                    denominatorLabel:
                                                                                        annualFormulaConfigured
                                                                                            ? 'Formula'
                                                                                            : 'Calculated',
                                                                                    formulaConfigured:
                                                                                        annualFormulaConfigured,
                                                                                    formula:
                                                                                        annualFormula,
                                                                                })
                                                                            }
                                                                            className="font-bold text-red-600 underline decoration-red-300 underline-offset-2 hover:text-red-800"
                                                                        >
                                                                            {formatPercent(
                                                                                annualPercent,
                                                                            )}
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-slate-500">
                                                                            {formatPercent(
                                                                                annualPercent,
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </>
                                                        )
                                                    })()}
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                        )}
                    </section>

                    {redIndicator && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
                            <div
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="red-indicator-title"
                                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
                            >
                                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h3
                                                id="red-indicator-title"
                                                className="font-bold text-slate-950"
                                            >
                                                Why is this indicator red?
                                            </h3>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {redIndicator.label} • {redIndicator.quarter}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setRedIndicator(null)}
                                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                        aria-label="Close explanation"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 px-5 py-5">
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                        <p className="text-sm font-semibold text-red-900">
                                            {redIndicator.formulaConfigured
                                                ? 'The configured dashboard formula produced a value above 100%.'
                                                : 'The calculated percentage is above 100%.'}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-red-800">
                                            {redIndicator.formulaConfigured
                                                ? 'The red indicator is based on the formula saved for this indicator, not a separate hard-coded percentage calculation.'
                                                : `The reported ${redIndicator.label.toLowerCase()} total is higher than its comparison value.`}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                                Reported
                                            </p>
                                            <p className="mt-1 text-lg font-bold text-slate-950">
                                                {formatNumber(redIndicator.total)}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                                {redIndicator.formulaConfigured ? 'Formula' : redIndicator.denominatorLabel}
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-slate-950">
                                                {redIndicator.formulaConfigured
                                                    ? redIndicator.formula || 'Configured formula'
                                                    : redIndicator.formula
                                                        ? redIndicator.formula
                                                        : formatNumber(redIndicator.denominator)}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-red-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                                                Percentage
                                            </p>
                                            <p className="mt-1 text-lg font-bold text-red-700">
                                                {formatPercent(redIndicator.percentage)}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs leading-5 text-slate-500">
                                        Review the underlying LGU report values if the percentage
                                        exceeds the expected target or screening population.
                                    </p>
                                </div>

                                <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setRedIndicator(null)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Screening analytics */}
                    <section className="space-y-4">
                        <SectionHeading
                            eyebrow="Performance Analytics"
                            title="Screening Performance"
                            description="Track screening volume and progression throughout the reporting year."
                        />

                        <div className="grid gap-5 xl:grid-cols-3">
                            <ChartCard
                                title="Quarterly Screening Trend"
                                description="Total senior citizens screened by quarter."
                                className="xl:col-span-2"
                                badge="Q1–Q4"
                            >
                                <ChartContainer
                                    config={screenedChartConfig}
                                    className="h-[330px] w-full"
                                >
                                    <BarChart
                                        data={quarterlyTrend}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -10,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            vertical={false}
                                            stroke={COLORS.grid}
                                        />
                                        <XAxis
                                            dataKey="quarter"
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent />
                                            }
                                        />
                                        <ChartLegend />
                                        <Bar
                                            dataKey="male"
                                            fill="var(--color-male)"
                                            radius={[5, 5, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="female"
                                            fill="var(--color-female)"
                                            radius={[5, 5, 0, 0]}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </ChartCard>

                            <ChartCard
                                title="Screening Progression"
                                description="Movement from screening to positive findings and referral."
                                badge="Flow"
                            >
                                <div className="flex h-[330px] flex-col justify-center gap-3">
                                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                                    Screened
                                                </p>
                                                <p className="mt-1 text-2xl font-bold text-blue-950">
                                                    {formatNumber(
                                                        dashboard.kpis
                                                            .screened,
                                                    )}
                                                </p>
                                            </div>
                                            <Users className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>

                                    <div className="flex justify-center">
                                        <ChevronRight className="h-5 w-5 rotate-90 text-slate-300" />
                                    </div>

                                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                                    Positive Screening
                                                </p>
                                                <p className="mt-1 text-2xl font-bold text-amber-950">
                                                    {formatNumber(
                                                        dashboard.kpis
                                                            .positive,
                                                    )}
                                                </p>
                                            </div>
                                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                                        </div>
                                    </div>

                                    <div className="flex justify-center">
                                        <ChevronRight className="h-5 w-5 rotate-90 text-slate-300" />
                                    </div>

                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                                    ICP / Referred
                                                </p>
                                                <p className="mt-1 text-2xl font-bold text-emerald-950">
                                                    {formatNumber(
                                                        dashboard.kpis
                                                            .referred,
                                                    )}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-6 w-6 text-emerald-600" />
                                        </div>
                                    </div>
                                </div>
                            </ChartCard>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-2">
                            <ChartCard
                                title="Screening Progression by Quarter"
                                description="Quarterly comparison of screened, positive and referred cases."
                                badge="Quarterly"
                            >
                                <ChartContainer
                                    config={
                                        progressionChartConfig
                                    }
                                    className="h-[340px] w-full"
                                >
                                    <BarChart
                                        data={progressionData}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -10,
                                        }}
                                    >
                                        <CartesianGrid
                                            vertical={false}
                                            stroke={COLORS.grid}
                                        />
                                        <XAxis
                                            dataKey="quarter"
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent />
                                            }
                                        />
                                        <ChartLegend />
                                        <Bar
                                            dataKey="screened"
                                            fill="var(--color-screened)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="positive"
                                            fill="var(--color-positive)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="referred"
                                            fill="var(--color-referred)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </ChartCard>

                            <ChartCard
                                title="Senior Citizens Screened by Sex"
                                description="Male versus female screening volume across quarters."
                                badge="Sex"
                            >
                                <ChartContainer
                                    config={screenedChartConfig}
                                    className="h-[340px] w-full"
                                >
                                    <LineChart
                                        data={quarterlyTrend}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -10,
                                        }}
                                    >
                                        <CartesianGrid
                                            vertical={false}
                                            stroke={COLORS.grid}
                                        />
                                        <XAxis
                                            dataKey="quarter"
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent />
                                            }
                                        />
                                        <ChartLegend />
                                        <Line
                                            type="monotone"
                                            dataKey="male"
                                            stroke="var(--color-male)"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                            }}
                                            activeDot={{
                                                r: 6,
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="female"
                                            stroke="var(--color-female)"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                            }}
                                            activeDot={{
                                                r: 6,
                                            }}
                                        />
                                    </LineChart>
                                </ChartContainer>
                            </ChartCard>
                        </div>
                    </section>

                    {/* LGU analytics */}
                    <section className="space-y-4">
                        <SectionHeading
                            eyebrow="LGU Performance"
                            title="NCR Local Government Unit Analytics"
                            description="Compare screening and vaccination activity across LGUs."
                        />

                        <div className="grid gap-5 xl:grid-cols-2">
                            <ChartCard
                                title="Screened by LGU and Sex"
                                description="Male and female screening totals across NCR LGUs."
                                badge="LGU"
                            >
                                <ChartContainer
                                    config={lguSexChartConfig}
                                    className="h-[520px] w-full"
                                >
                                    <BarChart
                                        data={lguSexData}
                                        layout="vertical"
                                        margin={{
                                            left: 10,
                                            right: 15,
                                        }}
                                    >
                                        <CartesianGrid
                                            horizontal={false}
                                            stroke={COLORS.grid}
                                        />
                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="lgu"
                                            width={105}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize: 11,
                                            }}
                                        />
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent />
                                            }
                                        />
                                        <ChartLegend />
                                        <Bar
                                            dataKey="male"
                                            fill="var(--color-male)"
                                            radius={[0, 4, 4, 0]}
                                        />
                                        <Bar
                                            dataKey="female"
                                            fill="var(--color-female)"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </ChartCard>

                            <ChartCard
                                title="Vaccination by LGU"
                                description="Influenza and pneumococcal vaccination counts."
                                badge="Vaccination"
                            >
                                <ChartContainer
                                    config={
                                        vaccinationChartConfig
                                    }
                                    className="h-[520px] w-full"
                                >
                                    <BarChart
                                        data={vaccinationData}
                                        layout="vertical"
                                        margin={{
                                            left: 10,
                                            right: 15,
                                        }}
                                    >
                                        <CartesianGrid
                                            horizontal={false}
                                            stroke={COLORS.grid}
                                        />
                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="lgu"
                                            width={105}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize: 11,
                                            }}
                                        />
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent />
                                            }
                                        />
                                        <ChartLegend />
                                        <Bar
                                            dataKey="influenza"
                                            fill="var(--color-influenza)"
                                            radius={[0, 4, 4, 0]}
                                        />
                                        <Bar
                                            dataKey="pneumococcal"
                                            fill="var(--color-pneumococcal)"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    </BarChart>
                                </ChartContainer>
                            </ChartCard>
                        </div>
                    </section>

                    {/* Syndrome and LGU summary */}
                    <section className="space-y-4">
                        <SectionHeading
                            eyebrow="Detailed Monitoring"
                            title="Geriatric Syndromes & LGU Status"
                            description="Review common positive findings and the current reporting status of each LGU."
                        />

                        <div className="grid gap-5 xl:grid-cols-3">
                            <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                                <CardHeader className="border-b border-slate-100">
                                    <CardTitle className="text-base">
                                        Positive Geriatric Syndromes
                                    </CardTitle>
                                    <p className="text-xs text-slate-500">
                                        Total reported positive findings.
                                    </p>
                                </CardHeader>

                                <CardContent className="space-y-4 p-5">
                                    {(dashboard.syndromes ?? []).map(
                                        (item) => {
                                            const max = Math.max(
                                                ...(dashboard.syndromes ??
                                                []).map(
                                                    (x) =>
                                                        x.total ?? 0,
                                                ),
                                                1,
                                            )

                                            const width =
                                                ((item.total ?? 0) /
                                                    max) *
                                                100

                                            return (
                                                <div
                                                    key={item.key}
                                                >
                                                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                                                        <span className="font-medium text-slate-700">
                                                            {item.label}
                                                        </span>
                                                        <span className="font-bold text-slate-900">
                                                            {formatNumber(
                                                                item.total,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-[#07549a] transition-all"
                                                            style={{
                                                                width: `${width}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        },
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                                <CardHeader className="border-b border-slate-100">
                                    <CardTitle className="text-base">
                                        Vaccination Summary
                                    </CardTitle>
                                    <p className="text-xs text-slate-500">
                                        Reported vaccination totals.
                                    </p>
                                </CardHeader>

                                <CardContent className="space-y-5 p-5">
                                    {(dashboard.vaccines ?? []).map(
                                        (vaccine) => {
                                            const max = Math.max(
                                                ...(dashboard.vaccines ??
                                                []).map(
                                                    (x) =>
                                                        x.total ?? 0,
                                                ),
                                                1,
                                            )

                                            const width =
                                                ((vaccine.total ?? 0) /
                                                    max) *
                                                100

                                            return (
                                                <div
                                                    key={vaccine.key}
                                                >
                                                    <div className="flex items-center justify-between gap-3 text-sm">
                                                        <span className="font-medium text-slate-700">
                                                            {vaccine.label}
                                                        </span>
                                                        <strong className="text-slate-950">
                                                            {formatNumber(
                                                                vaccine.total,
                                                            )}
                                                        </strong>
                                                    </div>

                                                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-500 transition-all"
                                                            style={{
                                                                width: `${width}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        },
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                                <CardHeader className="border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base">
                                                NCR LGU Status
                                            </CardTitle>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Click an LGU to open its detailed profile.
                                            </p>
                                        </div>
                                        <Users className="h-5 w-5 text-slate-400" />
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0">
                                    <div className="max-h-[430px] overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 z-10 bg-slate-50">
                                                <tr className="border-b text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    <th className="px-4 py-3 text-left">
                                                        LGU
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Screened
                                                    </th>
                                                    <th className="px-4 py-3 text-right">
                                                        Coverage
                                                    </th>
                                                    <th className="px-4 py-3 text-center">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {(dashboard.lgus ??
                                                []).map(
                                                    (lgu) => (
                                                        <tr
                                                            key={
                                                                lgu.lgu_id
                                                            }
                                                            className="group border-b last:border-0 hover:bg-blue-50/40"
                                                        >
                                                            <td className="px-4 py-3">
                                                                <Link
                                                                    href={`/justine/reports/${reportType.slug}/lgu/${lgu.lgu_id}?year=${year}`}
                                                                    className="inline-flex items-center gap-1 font-semibold text-slate-800 transition-colors hover:text-[#07549a] hover:underline"
                                                                >
                                                                    {
                                                                        lgu.lgu
                                                                    }
                                                                    <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                                                                </Link>
                                                            </td>

                                                            <td className="px-4 py-3 text-right font-medium">
                                                                {formatNumber(
                                                                    lgu.screened,
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-3 text-right">
                                                                <span
                                                                    className={
                                                                        lgu.coverage !==
                                                                            null &&
                                                                        lgu.coverage >
                                                                            100
                                                                            ? 'font-bold text-red-600'
                                                                            : 'font-medium text-slate-700'
                                                                    }
                                                                >
                                                                    {formatPercent(
                                                                        lgu.coverage,
                                                                    )}
                                                                </span>
                                                            </td>

                                                            <td className="px-4 py-3 text-center">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        lgu.coverage !==
                                                                        null
                                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                            : 'border-slate-200 bg-slate-50 text-slate-500'
                                                                    }
                                                                >
                                                                    {lgu.coverage !==
                                                                    null
                                                                        ? 'Reported'
                                                                        : 'No Data'}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* FHSIS validation */}
                    <section className="space-y-4">
                        <SectionHeading
                            eyebrow="Data Quality"
                            title="FHSIS Validation"
                            description="Compare current LGU reporting data with the current FHSIS dataset."
                            action={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                >
                                    <Link
                                        href={`/justine/fhsis/${reportType.slug}/comparison?year=${year}`}
                                    >
                                        Open FHSIS Comparison
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            }
                        />

                        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                            <CardContent className="p-5">
                                {!dashboard.fhsis.available ? (
                                    <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="rounded-xl bg-slate-200 p-2.5">
                                            <AlertTriangle className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                FHSIS data unavailable
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                No FHSIS dataset is available
                                                for the selected reporting
                                                scope.
                                            </p>
                                        </div>
                                    </div>
                                ) : fhsisDiff === null ? (
                                    <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
                                        <div className="rounded-xl bg-amber-100 p-2.5">
                                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-amber-900">
                                                Not Comparable
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-amber-800">
                                                The available data cannot
                                                currently be compared.
                                            </p>
                                        </div>
                                    </div>
                                ) : fhsisDiff === 0 ? (
                                    <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                        </div>

                                        <div className="flex-1">
                                            <p className="font-bold text-emerald-900">
                                                Data Match
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-emerald-800">
                                                The LGU screened total matches
                                                the current FHSIS record.
                                            </p>
                                        </div>

                                        <div className="sm:text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                                LGU / FHSIS
                                            </p>
                                            <p className="mt-1 text-xl font-bold text-emerald-900">
                                                {formatNumber(
                                                    dashboard.kpis
                                                        .screened,
                                                )}{' '}
                                                /{' '}
                                                {formatNumber(
                                                    dashboard.fhsis
                                                        .screened
                                                        ?.total,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                                            <ShieldAlert className="h-6 w-6 text-red-600" />
                                        </div>

                                        <div className="flex-1">
                                            <p className="font-bold text-red-900">
                                                Discrepancy Detected
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-red-800">
                                                The LGU and FHSIS screened
                                                totals do not match.
                                            </p>
                                        </div>

                                        <div className="sm:text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                                                Difference
                                            </p>
                                            <p className="mt-1 text-xl font-bold text-red-900">
                                                {fhsisDiff > 0
                                                    ? '+'
                                                    : ''}
                                                {formatNumber(
                                                    fhsisDiff,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    {/* Footer */}
                    <footer className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            {reportType.name} • NCR Reporting Dashboard
                        </p>

                        <p>
                             • Gawa ni Bingbing astig, sana ma appreciate mo 
                        </p>

                        <p>
                            Last updated:{' '}
                            {new Date(
                                dashboard.generated_at,
                            ).toLocaleString('en-PH')}
                        </p>
                    </footer>
                </main>
            </div>
        </>
    )
}


/*
|--------------------------------------------------------------------------
| Generic report dashboard
|--------------------------------------------------------------------------
|
| Uses the same visual language/components as the HWPSC dashboard, but
| consumes the generic report/dashboard configuration payload. This keeps
| the dashboard UI consistent while allowing PBP and future report types to
| use different indicators, widgets and data.
|--------------------------------------------------------------------------
*/
function GenericDashboardView({
    dashboard,
    year,
    reportType,
    reportTypes,
    lgus,
}: GenericProps) {
    const [genericRedIndicator, setGenericRedIndicator] = useState<{
        label: string
        quarter: string
        percentage: number
        total: number | null
        denominator: number | null
        denominatorLabel: string
        formulaConfigured: boolean
        formula: string | null
    } | null>(null)

    const [reportView, setReportView] = useState<'summary' | 'lgu'>('summary')

    const applyFilters = (
        overrides: Record<string, string | number | undefined>,
    ) => {
        const nextCode = String(
            overrides.type ?? reportType.code,
        )

        const nextType =
            reportTypes.find((type) => type.code === nextCode) ??
            reportType

        const params = new URLSearchParams()
        params.set(
            'year',
            String(overrides.year ?? year),
        )

        // Important: if the filter is explicitly cleared (undefined),
        // do NOT fall back to the previous server value.
        // Using ?? here made "All Quarters" / "All NCR" impossible to select.
        const quarterId = Object.prototype.hasOwnProperty.call(
            overrides,
            'quarterId',
        )
            ? overrides.quarterId
            : dashboard.filters.quarterId

        if (quarterId) {
            params.set('quarterId', String(quarterId))
        }

        const lguId = Object.prototype.hasOwnProperty.call(
            overrides,
            'lguId',
        )
            ? overrides.lguId
            : dashboard.filters.lguId

        if (lguId) {
            params.set('lguId', String(lguId))
        }

        params.set(
            'status',
            String(
                overrides.status ??
                    dashboard.filters.status ??
                    'all',
            ),
        )

        router.get(
            `/justine/reports/${nextType.slug}/dashboard?${params.toString()}`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        )
    }

    const configuredSections = [...(dashboard.dashboard_sections ?? [])].sort(
        (a, b) =>
            (a.display_order ?? 0) - (b.display_order ?? 0),
    )

    // KPI widgets are rendered directly under Executive Overview,
    // just like the existing HWPSC dashboard. They should not create
    // their own visible "KPI" section.
    const kpiWidgets = configuredSections.flatMap((section) =>
        (section.widgets ?? []).filter(
            (widget) => widget.type === 'kpi',
        ),
    )

    // Keep every non-KPI widget in its configured dashboard section.
    // If a section contains both KPI and non-KPI widgets, only the KPI
    // widgets are lifted into Executive Overview.
    const nonKpiSections = configuredSections
        .map((section) => ({
            ...section,
            widgets: (section.widgets ?? []).filter(
                (widget) => widget.type !== 'kpi',
            ),
        }))
        .filter((section) => section.widgets.length > 0)

    const exportDashboard = () => {
        const params = new URLSearchParams({
            year: String(year),
        })

        if (dashboard.filters.quarterId) {
            params.set(
                'quarterId',
                String(dashboard.filters.quarterId),
            )
        }

        if (dashboard.filters.lguId) {
            params.set(
                'lguId',
                String(dashboard.filters.lguId),
            )
        }

        if (dashboard.filters.status) {
            params.set('status', dashboard.filters.status)
        }

        window.location.href =
            `/justine/reports/${reportType.slug}/dashboard/export?${params.toString()}`
    }

    const formatGeneratedAt = (
        value: string | number | Date | null | undefined,
    ) => {
        if (!value) return 'N/A'

        const date = value instanceof Date ? value : new Date(value)

        if (Number.isNaN(date.getTime())) {
            return 'N/A'
        }

        return date.toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
    }

    // const kpis = dashboard.widgets.filter(
    //     (widget) => widget.type === 'kpi',
    // )

    // const charts = dashboard.widgets.filter(
    //     (widget) =>
    //         widget.type === 'quarterly' ||
    //         widget.type === 'flow' ||
    //         widget.type === 'bar_chart' ||
    //         widget.type === 'line_chart',
    // )

    // const tables = dashboard.widgets.filter(
    //     (widget) =>
    //         widget.type === 'summary_table' ||
    //         widget.type === 'ranking',
    // )

    return (
        <>
            <Head
                title={`${reportType.name} Dashboard — ${year}`}
            />

            <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
                <header className="relative overflow-hidden bg-[#063b6f] text-white shadow-lg">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_15%_90%,rgba(255,255,255,0.06),transparent_30%)]" />

                    <div className="relative mx-auto max-w-[1800px] px-5 py-6 lg:px-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner backdrop-blur-sm">
                                    <HeartPulse className="h-7 w-7" />
                                </div>

                                <div>
                                    <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200">
                                        <span>Department of Health</span>
                                        <span className="h-1 w-1 rounded-full bg-blue-300" />
                                        <span>Metro Manila CHD</span>
                                    </div>

                                    <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                                        {reportType.name} Dashboard
                                    </h1>

                                    <p className="mt-1 text-sm text-blue-100">
                                        Reporting, performance and indicator monitoring
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-200">
                                        Reporting Year
                                    </p>
                                    <p className="mt-0.5 text-xl font-bold">
                                        {year}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-200">
                                        LGUs
                                    </p>
                                    <p className="mt-0.5 text-xl font-bold">
                                        {formatNumber(
                                            dashboard.meta.lgu_count,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-[1800px] px-5 pt-4 lg:px-8">
                    <div className="flex justify-end">
                        <Link
                            href={`/justine/dashboard-configuration/${reportType.slug}`}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#07549a]/30 hover:bg-slate-50 hover:text-[#07549a]"
                        >
                            <Settings2 className="h-4 w-4" />
                            Configure Dashboard
                        </Link>
                    </div>
                </div>

                <main className="mx-auto max-w-[1800px] space-y-7 px-5 py-6 lg:px-8">
                    <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200/80">
                        <div className="border-b border-slate-100 bg-white px-5 py-4">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[#07549a]" />
                                <h2 className="text-sm font-bold text-slate-900">
                                    Dashboard Filters
                                </h2>
                            </div>

                            <p className="mt-1 pl-4 text-xs text-slate-500">
                                Select the reporting period and coverage area to update the dashboard.
                            </p>
                        </div>

                        <CardContent className="bg-slate-50/70 p-5">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Report Type
                                    </label>

                                    <select
                                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/10"
                                        value={reportType.code}
                                        onChange={(e) =>
                                            applyFilters({
                                                type: e.target.value,
                                            })
                                        }
                                    >
                                        {reportTypes.map((type) => (
                                            <option
                                                key={type.id}
                                                value={type.code}
                                            >
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Year
                                    </label>
                                    <select
                                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/10"
                                        value={year}
                                        onChange={(e) =>
                                            applyFilters({
                                                year: e.target.value,
                                            })
                                        }
                                    >
                                        <option value={year}>{year}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Quarter
                                    </label>
                                    <select
                                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/10"
                                        value={dashboard.filters.quarterId ?? ''}
                                        onChange={(e) =>
                                            applyFilters({
                                                quarterId:
                                                    e.target.value || undefined,
                                            })
                                        }
                                    >
                                        <option value="">All Quarters</option>
                                        <option value="1">Quarter 1</option>
                                        <option value="2">Quarter 2</option>
                                        <option value="3">Quarter 3</option>
                                        <option value="4">Quarter 4</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        LGU
                                    </label>
                                    <select
                                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/10"
                                        value={dashboard.filters.lguId ?? ''}
                                        onChange={(e) =>
                                            applyFilters({
                                                lguId:
                                                    e.target.value || undefined,
                                            })
                                        }
                                    >
                                        <option value="">All NCR</option>
                                        {lgus.map((lgu) => (
                                            <option
                                                key={lgu.id}
                                                value={lgu.id}
                                            >
                                                {lgu.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Submission Status
                                    </label>
                                    <select
                                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#07549a] focus:ring-2 focus:ring-[#07549a]/10"
                                        value={dashboard.filters.status}
                                        onChange={(e) =>
                                            applyFilters({
                                                status: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="all">All</option>
                                        <option value="draft">Draft</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>

                                <div className="flex items-end gap-2">
                                    <Button
                                        variant="outline"
                                        className="h-10 flex-1 border-slate-200 bg-white"
                                        onClick={() => router.reload()}
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Refresh
                                    </Button>

                                    <Button
                                        className="h-10 bg-[#07549a] px-3 shadow-sm hover:bg-[#063b6f]"
                                        onClick={exportDashboard}
                                        title="Download CSV"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span className="sr-only">Download CSV</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <section className="space-y-4">
                        <SectionHeading
                            eyebrow="Executive Overview"
                            title={`${reportType.name} Performance Snapshot`}
                            description="Current reporting indicators across the selected scope."
                            action={
                                <Badge
                                    variant="outline"
                                    className="border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                                >
                                    {formatNumber(dashboard.meta.lgu_count)} LGUs
                                    <span className="mx-1.5 text-slate-300">•</span>
                                    {formatNumber(dashboard.meta.submission_count)} submissions
                                </Badge>
                            }
                        />

                        {kpiWidgets.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                                {kpiWidgets.map((widget, index) => {
                                    const tones: Array<
                                        'blue' | 'cyan' | 'green' | 'amber' | 'violet'
                                    > = [
                                        'blue',
                                        'cyan',
                                        'green',
                                        'amber',
                                        'violet',
                                    ]

                                    const icons = [
                                        Target,
                                        Users,
                                        UserCheck,
                                        AlertTriangle,
                                        ArrowRight,
                                        HeartPulse,
                                        Syringe,
                                    ]

                                    const formula =
                                        widget.config?.formula &&
                                        typeof widget.config.formula === 'object' &&
                                        !Array.isArray(widget.config.formula)
                                            ? (widget.config.formula as Record<string, unknown>)
                                            : null

                                    const formulaEnabled =
                                        Boolean(widget.formula_enabled) ||
                                        formula?.enabled === true ||
                                        (typeof widget.config?.denominator_code === 'string' &&
                                            widget.config.denominator_code.trim() !== '')

                                    const formulaType = String(
                                        widget.formula_type ??
                                            formula?.type ??
                                            widget.config?.formula_type ??
                                            (formulaEnabled ? 'percentage' : ''),
                                    )

                                    const resolvedValue =
                                        formulaEnabled &&
                                        widget.formula_result !== null &&
                                        widget.formula_result !== undefined
                                            ? widget.formula_result
                                            : widget.value

                                    const displayValue =
                                        formulaEnabled &&
                                        formulaType === 'percentage' &&
                                        resolvedValue !== null &&
                                        resolvedValue !== undefined
                                            ? `${Number(resolvedValue).toFixed(2)}%`
                                            : formatNumber(resolvedValue)

                                    return (
                                        <KPI
                                            key={widget.id}
                                            title={widget.title}
                                            value={displayValue}
                                            subtitle={
                                                widget.description ??
                                                widget.formula_display ??
                                                undefined
                                            }
                                            icon={icons[index % icons.length]}
                                            tone={tones[index % tones.length]}
                                        />
                                    )
                                })}
                            </div>
                        ) : (
                            <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                                <CardContent className="py-10 text-center text-sm text-slate-500">
                                    No KPI widgets have been configured for this report type.
                                </CardContent>
                            </Card>
                        )}
                    </section>
                    {/* 
                    {charts.length > 0 && (
                        <section className="space-y-4">
                            <SectionHeading
                                eyebrow="Analytics"
                                title="Performance Trends"
                                description="Configured charts using the selected report indicators."
                            />

                            <div className="grid gap-6 lg:grid-cols-2">
                                {charts.map((widget) => (
                                    <ChartCard
                                        key={widget.id}
                                        title={widget.title}
                                        description={widget.description ?? undefined}
                                        badge={widget.type.replace('_', ' ')}
                                    >
                                        <GenericChart widget={widget} />
                                    </ChartCard>
                                ))}
                            </div>
                        </section>
                    )}

                    {tables.length > 0 && (
                        <section className="space-y-4">
                            <SectionHeading
                                eyebrow="Detailed Reporting"
                                title="Report Tables"
                                description="Configured report data for the selected scope."
                            />

                            <div className="grid gap-6 lg:grid-cols-2">
                                {tables.map((widget) => (
                                    <GenericTableWidget
                                        key={widget.id}
                                        widget={widget}
                                    />
                                ))}
                            </div>
                        </section>
                    )} */}

                    

                    {/* Official Report — dynamically uses this report type's indicators */}
                    <section className="space-y-4">
                        <SectionHeading
                            eyebrow="Official Report"
                            title="Quarterly Summary"
                            description={`Quarterly male, female, total and percentage values for ${year}.`}
                            action={
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <div
                                        role="tablist"
                                        aria-label={`${reportType.name} report view`}
                                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
                                    >
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={reportView === 'summary'}
                                            onClick={() => setReportView('summary')}
                                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                                reportView === 'summary'
                                                    ? 'bg-[#063b6f] text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                        >
                                            Summary
                                        </button>
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={reportView === 'lgu'}
                                            onClick={() => setReportView('lgu')}
                                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                                reportView === 'lgu'
                                                    ? 'bg-[#063b6f] text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                        >
                                            LGU / Quarter
                                        </button>
                                    </div>

                                    <Badge className="border-0 bg-[#063b6f] px-3 py-1.5 text-xs hover:bg-[#063b6f]">
                                        {reportType.code}
                                    </Badge>
                                </div>
                            }
                        />

                        {reportView === 'lgu' ? (
                            <LguQuarterlyTable
                                dashboard={dashboard}
                                year={year}
                                selectedQuarterId={dashboard.filters.quarterId}
                                reportTypeName={reportType.name}
                                onRedIndicator={setGenericRedIndicator}
                            />
                        ) : (
                            <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1500px] border-collapse">
                                        <thead>
                                            <tr className="bg-[#063b6f] text-[11px] font-bold uppercase tracking-wide text-white">
                                                <th
                                                    rowSpan={2}
                                                    className="sticky left-0 z-20 min-w-[330px] border-r border-white/15 bg-[#063b6f] px-4 py-3 text-left"
                                                >
                                                    Indicator
                                                </th>
                                                {[1, 2, 3, 4].map((quarter) => (
                                                    <th
                                                        key={quarter}
                                                        colSpan={4}
                                                        className="border-r border-white/15 px-2 py-3 text-center"
                                                    >
                                                        Quarter {quarter}
                                                    </th>
                                                ))}
                                                <th colSpan={4} className="bg-slate-950 px-2 py-3 text-center">
                                                    Annual Total
                                                </th>
                                            </tr>
                                            <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                                                {[1, 2, 3, 4].map((quarter) => (
                                                    <React.Fragment key={quarter}>
                                                        <th className="border border-slate-200 px-2 py-2">M</th>
                                                        <th className="border border-slate-200 px-2 py-2">F</th>
                                                        <th className="border border-slate-200 px-2 py-2">T</th>
                                                        <th className="border border-slate-200 bg-amber-50 px-2 py-2 text-amber-700">%</th>
                                                    </React.Fragment>
                                                ))}
                                                <th className="border border-slate-700 bg-slate-800 px-2 py-2 text-white">M</th>
                                                <th className="border border-slate-700 bg-slate-800 px-2 py-2 text-white">F</th>
                                                <th className="border border-slate-700 bg-slate-800 px-2 py-2 text-white">T</th>
                                                <th className="border border-slate-200 bg-amber-50 px-2 py-2 text-amber-700">%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(dashboard.sections ?? []).flatMap((section) => {
                                                const rows: React.ReactNode[] = []
                                                rows.push(
                                                    <tr key={`section-${section.id}`}>
                                                        <td
                                                            colSpan={21}
                                                            className="border border-slate-300 bg-slate-200 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-900"
                                                        >
                                                            {section.name}
                                                        </td>
                                                    </tr>,
                                                )

                                                ;(section.indicators ?? []).forEach((indicator) => {
                                                    rows.push(
                                                        <tr key={`indicator-${indicator.id}`} className="bg-white">
                                                            <td className="sticky left-0 z-10 border border-slate-200 bg-white px-4 py-2.5 text-left text-xs font-medium text-slate-700">
                                                                {indicator.name}
                                                            </td>
                                                            {[1, 2, 3, 4].map((quarter) => {
                                                                const q = indicator.quarters?.[String(quarter)]
                                                                return (
                                                                    <React.Fragment key={quarter}>
                                                                        <td className="border border-slate-200 px-2 py-2 text-center text-xs">{formatNumber(q?.male)}</td>
                                                                        <td className="border border-slate-200 px-2 py-2 text-center text-xs">{formatNumber(q?.female)}</td>
                                                                        <td className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold">{formatNumber(q?.total)}</td>
                                                                        <td className="border border-slate-200 bg-amber-50/60 px-2 py-2 text-center text-xs">
                                                                            {q?.percentage !== null &&
                                                                            q?.percentage !== undefined &&
                                                                            Number(q.percentage) > 100 ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        setGenericRedIndicator({
                                                                                            label: indicator.name,
                                                                                            quarter: `Quarter ${quarter}`,
                                                                                            percentage: Number(q.percentage),
                                                                                            total: q.total ?? null,
                                                                                            denominator: null,
                                                                                            denominatorLabel:
                                                                                                q.formula_configured
                                                                                                    ? 'Formula'
                                                                                                    : 'Calculated',
                                                                                            formulaConfigured:
                                                                                                Boolean(q.formula_configured),
                                                                                            formula: q.formula ?? null,
                                                                                        })
                                                                                    }
                                                                                    className="font-bold text-red-600 underline decoration-red-300 underline-offset-2 hover:text-red-800"
                                                                                >
                                                                                    {formatPercent(q.percentage)}
                                                                                </button>
                                                                            ) : (
                                                                                <span className="text-slate-500">
                                                                                    {q?.percentage === null || q?.percentage === undefined
                                                                                        ? 'N/A'
                                                                                        : `${Number(q.percentage).toFixed(2)}%`}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    </React.Fragment>
                                                                )
                                                            })}
                                                            <td className="border border-slate-700 bg-slate-800 px-2 py-2 text-center text-xs text-white">{formatNumber(indicator.annual?.male)}</td>
                                                            <td className="border border-slate-700 bg-slate-800 px-2 py-2 text-center text-xs text-white">{formatNumber(indicator.annual?.female)}</td>
                                                            <td className="border border-slate-700 bg-slate-800 px-2 py-2 text-center text-xs font-semibold text-white">{formatNumber(indicator.annual?.total)}</td>
                                                            <td className="border border-slate-200 bg-amber-50 px-2 py-2 text-center text-xs">
                                                                {indicator.annual?.percentage !== null &&
                                                                indicator.annual?.percentage !== undefined &&
                                                                Number(indicator.annual.percentage) > 100 ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setGenericRedIndicator({
                                                                                label: indicator.name,
                                                                                quarter: 'Annual Total',
                                                                                percentage: Number(indicator.annual?.percentage),
                                                                                total: indicator.annual?.total ?? null,
                                                                                denominator: null,
                                                                                denominatorLabel:
                                                                                    indicator.annual?.formula_configured
                                                                                        ? 'Formula'
                                                                                        : 'Calculated',
                                                                                formulaConfigured:
                                                                                    Boolean(indicator.annual?.formula_configured),
                                                                                formula:
                                                                                    indicator.annual?.formula ?? null,
                                                                            })
                                                                        }
                                                                        className="font-bold text-red-600 underline decoration-red-300 underline-offset-2 hover:text-red-800"
                                                                    >
                                                                        {formatPercent(indicator.annual.percentage)}
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-slate-500">
                                                                        {indicator.annual?.percentage === null ||
                                                                        indicator.annual?.percentage === undefined
                                                                            ? 'N/A'
                                                                            : `${Number(indicator.annual.percentage).toFixed(2)}%`}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>,
                                                    )
                                                })
                                                return rows
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        <p className="text-xs text-slate-400">
                            Indicators, sections, LGUs and formulas are loaded dynamically from the selected report type.
                        </p>
                    </section>

                    {/* Configured Dashboard */}
                    {nonKpiSections.length > 0 ? (
                        nonKpiSections.map((section) => (
                            <DashboardSection
                                key={section.id}
                                section={section}
                                reportType={reportType}
                                year={year}
                            />
                        ))
                    ) : (
                        <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                            <CardContent className="py-12 text-center">
                                <p className="text-sm font-medium text-slate-700">
                                    No dashboard widgets configured.
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Configure this report from Dashboard Configuration.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    

                    {genericRedIndicator && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
                            <div
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="generic-red-indicator-title"
                                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
                            >
                                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h3
                                                id="generic-red-indicator-title"
                                                className="font-bold text-slate-950"
                                            >
                                                Why is this indicator red?
                                            </h3>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {genericRedIndicator.label} • {genericRedIndicator.quarter}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setGenericRedIndicator(null)}
                                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                        aria-label="Close explanation"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 px-5 py-5">
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                        <p className="text-sm font-semibold text-red-900">
                                            The calculated percentage is above 100%.
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-red-800">
                                            The reported {genericRedIndicator.label.toLowerCase()} total is higher than its comparison value.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                                Reported
                                            </p>
                                            <p className="mt-1 text-lg font-bold text-slate-950">
                                                {formatNumber(genericRedIndicator.total)}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                                Calculated
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-slate-950">
                                                —
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-red-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                                                Percentage
                                            </p>
                                            <p className="mt-1 text-lg font-bold text-red-700">
                                                {genericRedIndicator.percentage.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs leading-5 text-slate-500">
                                        Review the underlying LGU report values if the percentage
                                        exceeds the expected target or screening population.
                                    </p>
                                </div>

                                <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-3">
                                    <button
                                        type="button"
                                        onClick={() => setGenericRedIndicator(null)}
                                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                        <CardHeader className="border-b border-slate-100 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                    <FileCheck2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold">
                                        FHSIS Comparison
                                    </CardTitle>
                                    <p className="text-xs text-slate-500">
                                        FHSIS availability for this report type and period.
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            {dashboard.fhsis.available ? (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <p className="font-semibold text-emerald-800">
                                        FHSIS report available
                                    </p>
                                    <p className="mt-1 text-sm text-emerald-700">
                                        Report ID: {dashboard.fhsis.report_id ?? '—'}
                                        {' • '}
                                        Version: {dashboard.fhsis.version ?? '—'}
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-300 p-4">
                                    <p className="text-sm text-slate-500">
                                        {dashboard.fhsis.message ??
                                            'No FHSIS report is available.'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card> */}

                    {/* FHSIS validation */}
                    <section className="space-y-4">
                        <SectionHeading
                            eyebrow="Data Quality"
                            title="FHSIS Validation"
                            description="Compare current LGU reporting data with the current FHSIS dataset."
                            action={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                >
                                    <Link
                                        href={`/justine/fhsis/${reportType.slug}/comparison?year=${year}`}
                                    >
                                        Open FHSIS Comparison
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            }
                        />

                        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                            <CardContent className="p-5">
                                {!dashboard.fhsis.available ? (
                                    <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="rounded-xl bg-slate-200 p-2.5">
                                            <AlertTriangle className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                FHSIS data unavailable
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                {dashboard.fhsis.message ??
                                                    'No FHSIS dataset is available for the selected reporting scope.'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                        </div>

                                        <div className="flex-1">
                                            <p className="font-bold text-emerald-900">
                                                FHSIS dataset available
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-emerald-800">
                                                A current FHSIS dataset is available
                                                for the selected reporting scope.
                                            </p>
                                        </div>

                                        <div className="sm:text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                                REPORT / VERSION
                                            </p>
                                            <p className="mt-1 text-xl font-bold text-emerald-900">
                                                {dashboard.fhsis.report_id ?? '—'}
                                                {' / '}
                                                {dashboard.fhsis.version ?? '—'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    {/* <div className="pb-6 text-center text-xs text-slate-400">
                        Generated {dashboard.meta.generated_at}
                    </div> */}
                     <footer className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            {reportType.name} • NCR Reporting Dashboard
                        </p>

                        <p>
                             • Gawa ni Bingbing astig, sana ma appreciate mo 
                        </p>

                       <p>
                            Last updated:{' '}
                            {formatGeneratedAt(dashboard.meta.generated_at)}
                        </p>
                    </footer>
                </main>
            </div>
        </>
    )
}

// function GenericChart({
//     widget,
// }: {
//     widget: GenericDashboardWidget
// }) {
//     const data = widget.data ?? []
//     const config = widget.config ?? {}
//     const indicatorCodes = Array.isArray(config.indicator_codes)
//         ? config.indicator_codes.filter(
//               (code): code is string => typeof code === 'string',
//           )
//         : []

//     if (!data.length) {
//         return (
//             <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
//                 No chart data available.
//             </div>
//         )
//     }

//     const keys = indicatorCodes.length
//         ? indicatorCodes
//         : Object.keys(data[0]).filter(
//               (key) =>
//                   key !== 'quarter' &&
//                   key !== 'quarter_id' &&
//                   key !== 'lgu_id' &&
//                   key !== 'lgu',
//           )

//     const chartData = data.map((row) => ({
//         ...row,
//         label:
//             String(row.quarter ?? row.lgu ?? row.label ?? ''),
//     }))

//     if (widget.type === 'line_chart') {
//         return (
//             <div className="h-[300px] w-full">
//                 <ResponsiveContainer width="100%" height="100%">
//                     <LineChart data={chartData}>
//                         <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
//                         <XAxis dataKey="label" />
//                         <YAxis />
//                         <Tooltip />
//                         {keys.map((key, index) => (
//                             <Line
//                                 key={key}
//                                 type="monotone"
//                                 dataKey={key}
//                                 stroke={
//                                     [
//                                         COLORS.male,
//                                         COLORS.positive,
//                                         COLORS.referred,
//                                         COLORS.influenza,
//                                         COLORS.pneumococcal,
//                                     ][index % 5]
//                                 }
//                                 strokeWidth={2}
//                                 dot={false}
//                             />
//                         ))}
//                     </LineChart>
//                 </ResponsiveContainer>
//             </div>
//         )
//     }

//     return (
//         <div className="h-[300px] w-full">
//             <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={chartData}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
//                     <XAxis dataKey="label" />
//                     <YAxis />
//                     <Tooltip />
//                     {keys.map((key, index) => (
//                         <Bar
//                             key={key}
//                             dataKey={key}
//                             fill={
//                                 [
//                                     COLORS.male,
//                                     COLORS.positive,
//                                     COLORS.referred,
//                                     COLORS.influenza,
//                                     COLORS.pneumococcal,
//                                 ][index % 5]
//                             }
//                             radius={[4, 4, 0, 0]}
//                         />
//                     ))}
//                 </BarChart>
//             </ResponsiveContainer>
//         </div>
//     )
// }

// function GenericTableWidget({
//     widget,
// }: {
//     widget: GenericDashboardWidget
// }) {
//     const data = widget.data ?? []

//     return (
//         <ChartCard
//             title={widget.title}
//             description={widget.description ?? undefined}
//             badge={widget.type.replace('_', ' ')}
//         >
//             {!data.length ? (
//                 <div className="py-10 text-center text-sm text-slate-500">
//                     No data available.
//                 </div>
//             ) : widget.type === 'ranking' ? (
//                 <div className="space-y-3">
//                     {data.map((row, index) => (
//                         <div
//                             key={`${String(row.lgu_id ?? row.id ?? index)}`}
//                             className="flex items-center justify-between gap-4 border-b pb-3 last:border-0"
//                         >
//                             <div className="flex min-w-0 items-center gap-3">
//                                 <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
//                                     {index + 1}
//                                 </div>
//                                 <span className="truncate text-sm font-medium">
//                                     {String(row.lgu ?? row.name ?? 'Unknown LGU')}
//                                 </span>
//                             </div>
//                             <span className="font-semibold">
//                                 {formatValue(row.value)}
//                             </span>
//                         </div>
//                     ))}
//                 </div>
//             ) : (
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-sm">
//                         <thead>
//                             <tr className="border-b bg-slate-50">
//                                 {Object.keys(data[0]).map((key) => (
//                                     <th
//                                         key={key}
//                                         className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500"
//                                     >
//                                         {key.replace(/_/g, ' ')}
//                                     </th>
//                                 ))}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {data.map((row, index) => (
//                                 <tr
//                                     key={index}
//                                     className="border-b last:border-0"
//                                 >
//                                     {Object.entries(row).map(([key, value]) => (
//                                         <td
//                                             key={key}
//                                             className="px-3 py-3"
//                                         >
//                                             {formatValue(value)}
//                                         </td>
//                                     ))}
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             )}
//         </ChartCard>
//     )
// }

function formatColumnName(value: string) {
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatCellValue(value: unknown) {
    return formatValue(value)
}

function formatValue(value: unknown) {
    if (value === null || value === undefined || value === '') {
        return '—'
    }

    if (typeof value === 'number') {
        return formatNumber(value)
    }

    return String(value)
}
