import { Head, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'

interface ReportType {
    id: number
    code: string
    name: string
    slug: string
}

interface Indicator {
    id: number
    report_section_id: number
    code: string
    name: string
    display_order: number
    section?: {
        id: number
        name: string
        code?: string
        display_order?: number
    } | null
}

interface DashboardWidget {
    id: number
    dashboard_section_id: number
    type: string
    key: string
    title: string
    description?: string | null
    config?: Record<string, unknown> | null
    display_order: number
    is_active: boolean
}

interface DashboardSection {
    id: number
    report_type_id: number
    code: string
    name: string
    description?: string | null
    display_order: number
    is_active: boolean
    widgets: DashboardWidget[]
}

interface WidgetType {
    value: string
    label: string
}

interface Props {
    reportType: ReportType
    reportTypes: ReportType[]
    sections: DashboardSection[]
    indicators: Indicator[]
    widgetTypes: WidgetType[]
}

type WidgetFormState = {
    dashboard_section_id: number
    type: string
    key: string
    title: string
    description: string
    display_order: number
    is_active: boolean
    indicator_code: string
    indicator_codes: string[]
    value: 'male' | 'female' | 'total'
    aggregation: 'sum' | 'average' | 'latest'
    denominator_code: string

    // KPI calculation configuration
    formula_enabled: boolean
    formula_type: 'percentage' | 'ratio' | 'add' | 'subtract' | 'multiply' | 'divide'
    formula_numerator_field: 'male' | 'female' | 'total'
    formula_denominator_field: 'male' | 'female' | 'total'
    formula_multiplier: number
    formula_decimal_places: number
    sample_numerator: number
    sample_denominator: number

    series: Array<'male' | 'female' | 'total'>
    group_by: 'quarter' | 'sex' | 'lgu' | 'indicator'
    ranking_mode: 'lgu' | 'indicator_progress'
    orientation: 'vertical' | 'horizontal'
    col_span: 1 | 2 | 3
    height: number
    color: string
    series_colors: { male: string; female: string; total: string }
}

type SectionFormState = {
    code: string
    name: string
    description: string
    display_order: number
    is_active: boolean
}

const INPUT_CLASS = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'

const TEXTAREA_CLASS = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'

const emptySection: SectionFormState = {
    code: '',
    name: '',
    description: '',
    display_order: 0,
    is_active: true,
}

function emptyWidget(sectionId = 0): WidgetFormState {
    return {
        dashboard_section_id: sectionId,
        type: 'kpi',
        key: '',
        title: '',
        description: '',
        display_order: 0,
        is_active: true,
        indicator_code: '',
        indicator_codes: [],
        value: 'total',
        aggregation: 'sum',
        denominator_code: '',

        formula_enabled: false,
        formula_type: 'percentage',
        formula_numerator_field: 'total',
        formula_denominator_field: 'total',
        formula_multiplier: 100,
        formula_decimal_places: 2,
        sample_numerator: 37,
        sample_denominator: 100,

        group_by: 'quarter',
        ranking_mode: 'lgu',
        orientation: 'vertical',
        col_span: 1,
        height: 330,
        color: '#2563eb',
        series_colors: {
            male: '#2563eb',
            female: '#e11d48',
            total: '#07549a',
        },
        series: ['total'], 
    }
}

function normalizeWidget(widget: DashboardWidget): WidgetFormState {
    const config = widget.config ?? {}

    return {
        dashboard_section_id: widget.dashboard_section_id,
        type: widget.type,
        key: widget.key,
        title: widget.title,
        description: widget.description ?? '',
        display_order: widget.display_order ?? 0,
        is_active: widget.is_active,
        indicator_code: String(config.indicator_code ?? ''),
        indicator_codes: Array.isArray(config.indicator_codes)
            ? config.indicator_codes.map(String)
            : [],
        value:
            config.value === 'male' || config.value === 'female'
                ? config.value
                : 'total',
        aggregation:
            config.aggregation === 'average' ||
            config.aggregation === 'latest'
                ? config.aggregation
                : 'sum',
        denominator_code: String(config.denominator_code ?? ''),

        formula_enabled:
            typeof config.formula === 'object' &&
            config.formula !== null &&
            !Array.isArray(config.formula)
                ? Boolean((config.formula as Record<string, unknown>).enabled)
                : Boolean(config.formula_enabled),

        formula_type:
            typeof config.formula === 'object' &&
            config.formula !== null &&
            !Array.isArray(config.formula) &&
            ['percentage', 'ratio', 'add', 'subtract', 'multiply', 'divide'].includes(
                String((config.formula as Record<string, unknown>).type ?? '')
            )
                ? ((config.formula as Record<string, unknown>).type as WidgetFormState['formula_type'])
                : (['percentage', 'ratio', 'add', 'subtract', 'multiply', 'divide'].includes(String(config.formula_type))
                    ? String(config.formula_type) as WidgetFormState['formula_type']
                    : 'percentage'),

        formula_numerator_field:
            typeof config.formula === 'object' && config.formula !== null && !Array.isArray(config.formula)
                ? ((['male', 'female', 'total'].includes(String((config.formula as Record<string, unknown>).numerator_field ?? ''))
                    ? String((config.formula as Record<string, unknown>).numerator_field)
                    : 'total') as WidgetFormState['formula_numerator_field'])
                : (['male', 'female', 'total'].includes(String(config.formula_numerator_field))
                    ? String(config.formula_numerator_field) as WidgetFormState['formula_numerator_field']
                    : 'total'),

        formula_denominator_field:
            typeof config.formula === 'object' && config.formula !== null && !Array.isArray(config.formula)
                ? ((['male', 'female', 'total'].includes(String((config.formula as Record<string, unknown>).denominator_field ?? ''))
                    ? String((config.formula as Record<string, unknown>).denominator_field)
                    : 'total') as WidgetFormState['formula_denominator_field'])
                : (['male', 'female', 'total'].includes(String(config.formula_denominator_field))
                    ? String(config.formula_denominator_field) as WidgetFormState['formula_denominator_field']
                    : 'total'),

        formula_multiplier:
            typeof config.formula === 'object' && config.formula !== null && !Array.isArray(config.formula) &&
            typeof (config.formula as Record<string, unknown>).multiplier === 'number'
                ? Number((config.formula as Record<string, unknown>).multiplier)
                : Number(config.formula_multiplier ?? 100),

        formula_decimal_places:
            typeof config.formula === 'object' && config.formula !== null && !Array.isArray(config.formula) &&
            typeof (config.formula as Record<string, unknown>).decimal_places === 'number'
                ? Number((config.formula as Record<string, unknown>).decimal_places)
                : Number(config.formula_decimal_places ?? 2),

        sample_numerator: Number(config.sample_numerator ?? 37),
        sample_denominator: Number(config.sample_denominator ?? 100),

        series: Array.isArray(config.series)
            ? config.series.filter((value): value is 'male' | 'female' | 'total' =>
                  value === 'male' || value === 'female' || value === 'total',
              )
            : typeof config.series === 'string' &&
                (config.series === 'male' || config.series === 'female' || config.series === 'total')
              ? [config.series]
              : ['male', 'female'],
        group_by:
            config.group_by === 'sex' ||
            config.group_by === 'lgu' ||
            config.group_by === 'indicator'
                ? config.group_by
                : 'quarter',
        ranking_mode:
            config.ranking_mode === 'indicator_progress'
                ? 'indicator_progress'
                : 'lgu',
        orientation:
            config.orientation === 'horizontal'
                ? 'horizontal'
                : 'vertical',
        col_span:
            [1, 2, 3].includes(Number(config.col_span))
                ? (Number(config.col_span) as WidgetFormState['col_span'])
                : 1,
        height: Math.max(180, Math.min(900, Number(config.height ?? 330))),
        color: String(config.color ?? '#2563eb'),
        series_colors: {
            male: String((config.series_colors as Record<string, unknown> | undefined)?.male ?? '#2563eb'),
            female: String((config.series_colors as Record<string, unknown> | undefined)?.female ?? '#e11d48'),
            total: String((config.series_colors as Record<string, unknown> | undefined)?.total ?? '#07549a'),
        },
    }
}

export default function DashboardConfiguration({
    reportType,
    reportTypes,
    sections,
    indicators,
    widgetTypes,
}: Props) {
    const [sectionForm, setSectionForm] = useState<SectionFormState>(emptySection)
    const [editingSectionId, setEditingSectionId] = useState<number | null>(null)
    const [widgetForm, setWidgetForm] = useState<WidgetFormState>(emptyWidget())
    const [editingWidgetId, setEditingWidgetId] = useState<number | null>(null)
    const [showSectionForm, setShowSectionForm] = useState(false)
    const [showWidgetForm, setShowWidgetForm] = useState(false)
    const [showDashboardPreview, setShowDashboardPreview] = useState(false)

    const [errorModal, setErrorModal] = useState<{
        title: string
        message: string
        errors: string[]
    } | null>(null)

    const showRequestError = (
        title: string,
        errors: Record<string, string>,
    ) => {
        const messages = Object.entries(errors ?? {})
            .map(([field, message]) => {
                const text = String(message ?? '').trim()
                if (!text) {
                    return ''
                }

                if (field === 'error' || field === 'message') {
                    return text
                }

                const label = field
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (letter) => letter.toUpperCase())

                return `${label}: ${text}`
            })
            .filter(Boolean)

        setErrorModal({
            title,
            message:
                messages.length > 0
                    ? 'The server rejected the request. Please review the details below.'
                    : 'The server rejected the request. Please check your configuration and try again.',
            errors: messages,
        })
    }

    const groupedIndicators = useMemo(() => {
        const groups = new Map<string, Indicator[]>()

        for (const indicator of indicators) {
            const sectionName = indicator.section?.name ?? 'Other Indicators'
            const current = groups.get(sectionName) ?? []
            current.push(indicator)
            groups.set(sectionName, current)
        }

        return Array.from(groups.entries())
    }, [indicators])

    const openNewSection = () => {
        setEditingSectionId(null)
        setSectionForm(emptySection)
        setShowSectionForm(true)
    }

    const openEditSection = (section: DashboardSection) => {
        setEditingSectionId(section.id)
        setSectionForm({
            code: section.code,
            name: section.name,
            description: section.description ?? '',
            display_order: section.display_order,
            is_active: section.is_active,
        })
        setShowSectionForm(true)
    }

    const saveSection = () => {
        const url = editingSectionId
            ? `/justine/dashboard-configuration/${reportType.slug}/sections/${editingSectionId}`
            : `/justine/dashboard-configuration/${reportType.slug}/sections`

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setShowSectionForm(false)
                setEditingSectionId(null)
                setSectionForm(emptySection)
            },
            onError: (errors: Record<string, string>) => {
                showRequestError(
                    editingSectionId
                        ? 'Unable to update dashboard section'
                        : 'Unable to create dashboard section',
                    errors,
                )
            },
        }

        if (editingSectionId) {
            router.put(url, sectionForm, options)
        } else {
            router.post(url, sectionForm, options)
        }
    }

    const deleteSection = (section: DashboardSection) => {
        if (!window.confirm(`Delete dashboard section "${section.name}" and its widgets?`)) {
            return
        }

        router.delete(
            `/justine/dashboard-configuration/${reportType.slug}/sections/${section.id}`,
            {
                preserveScroll: true,
                onError: (errors: Record<string, string>) => {
                    showRequestError('Unable to delete dashboard section', errors)
                },
            },
        )
    }

    const openNewWidget = (sectionId: number) => {
        setEditingWidgetId(null)
        setWidgetForm(emptyWidget(sectionId))
        setShowWidgetForm(true)
    }

    const openEditWidget = (widget: DashboardWidget) => {
        setEditingWidgetId(widget.id)
        setWidgetForm(normalizeWidget(widget))
        setShowWidgetForm(true)
    }

    const saveWidget = () => {
        const url = editingWidgetId
            ? `/justine/dashboard-configuration/${reportType.slug}/widgets/${editingWidgetId}`
            : `/justine/dashboard-configuration/${reportType.slug}/widgets`

        const config =
            widgetForm.type === 'kpi'
                ? {
                      indicator_code: widgetForm.indicator_code,
                      value: widgetForm.value,
                      aggregation: widgetForm.aggregation,
                      denominator_code: widgetForm.formula_enabled
                          ? widgetForm.denominator_code || null
                          : null,
                      formula: widgetForm.formula_enabled
                          ? {
                                enabled: true,
                                type: widgetForm.formula_type,
                                numerator_code: widgetForm.indicator_code,
                                denominator_code: widgetForm.denominator_code || null,
                                numerator_field: widgetForm.formula_numerator_field,
                                denominator_field: widgetForm.formula_denominator_field,
                                multiplier: widgetForm.formula_multiplier,
                                decimal_places: widgetForm.formula_decimal_places,
                            }
                          : null,
                      // These are configuration-only preview values. They are
                      // never used by the dashboard calculation.
                      sample_numerator: widgetForm.sample_numerator,
                      sample_denominator: widgetForm.sample_denominator,
                      color: widgetForm.color,
                      series_colors: widgetForm.series_colors,
                  }
                : widgetForm.type === 'lgu_status'
                  ? {
                        indicator_code: widgetForm.indicator_code,
                        value: widgetForm.value,
                        aggregation: widgetForm.aggregation,
                        denominator_code: widgetForm.denominator_code || null,
                        color: widgetForm.color,
                        series_colors: widgetForm.series_colors,
                    }
                : widgetForm.type === 'ranking'
                  ? {
                        indicator_code:
                            widgetForm.ranking_mode === 'indicator_progress'
                                ? null
                                : widgetForm.indicator_code,
                        indicator_codes:
                            widgetForm.ranking_mode === 'indicator_progress'
                                ? widgetForm.indicator_codes
                                : [],
                        ranking_mode: widgetForm.ranking_mode,
                        value: widgetForm.value,
                        aggregation: widgetForm.aggregation,
                        color: widgetForm.color,
                        series_colors: widgetForm.series_colors,
                    }
                  : {
                      indicator_codes: widgetForm.indicator_codes,
                      value: widgetForm.value,
                      aggregation: widgetForm.aggregation,
                      group_by: widgetForm.group_by,
                      series: widgetForm.series,
                      orientation:
                          widgetForm.type === 'bar_chart'
                              ? widgetForm.orientation
                              : undefined,
                      color: widgetForm.color,
                      series_colors: widgetForm.series_colors,
                  }

        const widgetConfig = {
            ...config,
            col_span: widgetForm.col_span,
            height: widgetForm.height,
        }

        const payload = {
            dashboard_section_id: widgetForm.dashboard_section_id,
            type: widgetForm.type,
            key: widgetForm.key,
            title: widgetForm.title,
            description: widgetForm.description || null,
            display_order: widgetForm.display_order,
            is_active: widgetForm.is_active,
            config: widgetConfig,
        }

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setShowWidgetForm(false)
                setEditingWidgetId(null)
                setWidgetForm(emptyWidget())
            },
            onError: (errors: Record<string, string>) => {
                showRequestError(
                    editingWidgetId
                        ? 'Unable to update dashboard widget'
                        : 'Unable to create dashboard widget',
                    errors,
                )
            },
        }

        if (editingWidgetId) {
            router.put(url, payload, options)
        } else {
            router.post(url, payload, options)
        }
    }

    const deleteWidget = (widget: DashboardWidget) => {
        if (!window.confirm(`Delete widget "${widget.title}"?`)) {
            return
        }

        router.delete(
            `/justine/dashboard-configuration/${reportType.slug}/widgets/${widget.id}`,
            {
                preserveScroll: true,
                onError: (errors: Record<string, string>) => {
                    showRequestError('Unable to delete dashboard widget', errors)
                },
            },
        )
    }

    const toggleIndicator = (code: string) => {
        setWidgetForm((current) => ({
            ...current,
            indicator_codes: current.indicator_codes.includes(code)
                ? current.indicator_codes.filter((item) => item !== code)
                : [...current.indicator_codes, code],
        }))
    }

    const selectedWidgetType = widgetTypes.find(
        (type) => type.value === widgetForm.type,
    )

    const isKpi = widgetForm.type === 'kpi'
    const isRanking = widgetForm.type === 'ranking'
    const isIndicatorProgressRanking =
        isRanking && widgetForm.ranking_mode === 'indicator_progress'
    const isLguStatus = widgetForm.type === 'lgu_status'

    return (
        <>
            <Head title={`Dashboard Configuration - ${reportType.name}`} />

            <div className="min-h-screen bg-slate-50">
                <main className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
                    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                    Dashboard Configuration
                                </p>
                                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                                    {reportType.name}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Configure sections, KPIs, Q1–Q4 trends, flow charts, rankings, and detailed monitoring for this report type.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Report Type
                                </label>
                                <select
                                    value={reportType.slug}
                                    onChange={(event) => {
                                        const next = reportTypes.find(
                                            (type) => type.slug === event.target.value,
                                        )
                                        if (next) {
                                            router.get(
                                                `/justine/dashboard-configuration/${next.slug}`,
                                                {},
                                                { preserveState: false },
                                            )
                                        }
                                    }}
                                    className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium outline-none ring-primary focus:ring-2"
                                >
                                    {reportTypes.map((type) => (
                                        <option key={type.id} value={type.slug}>
                                            {type.name} ({type.code})
                                        </option>
                                    ))}
                                </select>

                                <button
                                    type="button"
                                    onClick={() => setShowDashboardPreview(true)}
                                    className="h-10 rounded-lg border border-primary bg-white px-4 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/5"
                                >
                                    Preview Dashboard
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.get(
                                            `/justine/reports/${reportType.slug}/dashboard`,
                                        )
                                    }
                                    className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                                >
                                    View Dashboard
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-950">Dashboard Sections</h2>
                                    <p className="text-sm text-slate-500">
                                        Organize widgets into Executive, Q1–Q4, Flow, Detailed Monitoring, FHSIS, or any report-specific section.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={openNewSection}
                                    className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                >
                                    + Section
                                </button>
                            </div>

                            {sections.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                                    <p className="font-semibold text-slate-700">No dashboard sections yet.</p>
                                    <p className="mt-1 text-sm text-slate-500">Create the first section for {reportType.name}.</p>
                                </div>
                            ) : (
                                sections.map((section) => (
                                    <div
                                        key={section.id}
                                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                                    >
                                        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-950">{section.name}</h3>
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                                                        {section.code}
                                                    </span>
                                                    {!section.is_active && (
                                                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                                            INACTIVE
                                                        </span>
                                                    )}
                                                </div>
                                                {section.description && (
                                                    <p className="mt-1 text-sm text-slate-500">{section.description}</p>
                                                )}
                                            </div>

                                            <div className="flex shrink-0 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditSection(section)}
                                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteSection(section)}
                                                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openNewWidget(section.id)}
                                                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                                                >
                                                    + Widget
                                                </button>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {section.widgets.length === 0 ? (
                                                <div className="p-6 text-sm text-slate-500">
                                                    No widgets configured in this section.
                                                </div>
                                            ) : (
                                                section.widgets.map((widget) => (
                                                    <div key={widget.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-semibold text-slate-900">{widget.title}</span>
                                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                                                                    {widget.type.replace('_', ' ')}
                                                                </span>
                                                                {!widget.is_active && (
                                                                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                                                        INACTIVE
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                                {widget.description || widget.key}
                                                            </p>
                                                        </div>
                                                        <div className="flex shrink-0 gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditWidget(widget)}
                                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteWidget(widget)}
                                                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </section>

                        <aside className="space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Available Indicators</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Only indicators belonging to <strong>{reportType.name}</strong> are available here.
                                </p>

                                <div className="mt-4 space-y-2">
                                    {groupedIndicators.map(([sectionName, items]) => (
                                        <div key={sectionName} className="rounded-lg bg-slate-50 p-3">
                                            <p className="text-xs font-bold text-slate-700">{sectionName}</p>
                                            <div className="mt-2 space-y-1">
                                                {items.map((indicator) => (
                                                    <div key={indicator.id} className="flex items-start justify-between gap-2 text-xs">
                                                        <span className="text-slate-700">{indicator.name}</span>
                                                        <code className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-500 ring-1 ring-slate-200">
                                                            {indicator.code}
                                                        </code>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {indicators.length === 0 && (
                                        <p className="py-4 text-center text-xs text-slate-500">
                                            No active indicators configured for this report type.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                                <p className="text-sm font-bold text-blue-950">Configuration rule</p>
                                <p className="mt-1 text-xs leading-5 text-blue-800">
                                    Widget indicators are validated against this report type on the server. You cannot accidentally configure a PBP widget with an HWPSC indicator code.
                                </p>
                            </div>
                        </aside>
                    </div>
                </main>
            </div>

            {showSectionForm && (
                <Modal title={editingSectionId ? 'Edit Dashboard Section' : 'Create Dashboard Section'} onClose={() => setShowSectionForm(false)}>
                    <div className="grid gap-4">
                        <Field label="Section Code">
                            <input
                                value={sectionForm.code}
                                onChange={(e) => setSectionForm({ ...sectionForm, code: e.target.value })}
                                placeholder="PERFORMANCE_ANALYTICS"
                                className={INPUT_CLASS}
                            />
                        </Field>
                        <Field label="Section Name">
                            <input
                                value={sectionForm.name}
                                onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                                placeholder="Performance Analytics"
                                className={INPUT_CLASS}
                            />
                        </Field>
                        <Field label="Description">
                            <textarea
                                value={sectionForm.description}
                                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                                rows={3}
                                className={INPUT_CLASS}
                            />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Display Order">
                                <input
                                    type="number"
                                    min={0}
                                    value={sectionForm.display_order}
                                    onChange={(e) => setSectionForm({ ...sectionForm, display_order: Number(e.target.value) })}
                                    className={INPUT_CLASS}
                                />
                            </Field>
                            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={sectionForm.is_active}
                                    onChange={(e) => setSectionForm({ ...sectionForm, is_active: e.target.checked })}
                                />
                                Active
                            </label>
                        </div>
                    </div>
                    <ModalActions onCancel={() => setShowSectionForm(false)} onSave={saveSection} />
                </Modal>
            )}

            {showWidgetForm && (
                <Modal title={editingWidgetId ? 'Edit Dashboard Widget' : 'Create Dashboard Widget'} onClose={() => setShowWidgetForm(false)} wide>
                    <div className="grid gap-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Dashboard Section">
                                <select
                                    value={widgetForm.dashboard_section_id}
                                    onChange={(e) => setWidgetForm({ ...widgetForm, dashboard_section_id: Number(e.target.value) })}
                                    className={INPUT_CLASS}
                                >
                                    <option value={0}>Select section</option>
                                    {sections.map((section) => (
                                        <option key={section.id} value={section.id}>{section.name}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Widget Type">
                                <select
                                    value={widgetForm.type}
                                    onChange={(e) => {
                                            const nextType = e.target.value
                                            setWidgetForm({
                                                ...widgetForm,
                                                type: nextType,
                                                indicator_codes: [],
                                                indicator_code: '',
                                                orientation: 'vertical',
                                                col_span: 1,
                                                height: 330,
                                                series:
                                                    nextType === 'flow'
                                                        ? ['total']
                                                        : nextType === 'summary_table'
                                                          ? ['male', 'female', 'total']
                                                          : ['male', 'female'],
                                            })
                                        }}
                                    className={INPUT_CLASS}
                                >
                                    {widgetTypes.map((type) => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </Field>

                            {widgetForm.type === 'bar_chart' && (
                                <Field label="Bar Chart Orientation">
                                    <select
                                        value={widgetForm.orientation}
                                        onChange={(e) =>
                                            setWidgetForm({
                                                ...widgetForm,
                                                orientation: e.target.value as WidgetFormState['orientation'],
                                            })
                                        }
                                        className={`${INPUT_CLASS} bg-white`}
                                    >
                                        <option value="vertical">Vertical — Columns</option>
                                        <option value="horizontal">Horizontal — Bars</option>
                                    </select>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Vertical uses columns. Horizontal uses bars with indicator labels on the left.
                                    </p>
                                </Field>
                            )}

                            <Field label="Group By">
                                <select
                                    value={widgetForm.group_by}
                                    onChange={(e) =>
                                        setWidgetForm({
                                            ...widgetForm,
                                            group_by:
                                                e.target.value as WidgetFormState['group_by'],
                                        })
                                    }
                                    className={`${INPUT_CLASS} bg-white`}
                                >
                                    <option value="quarter">
                                        Quarterly — Q1 to Q4
                                    </option>

                                    <option value="sex">
                                        Sex — Male / Female / Total
                                    </option>

                                    <option value="lgu">
                                        LGU
                                    </option>

                                    <option value="indicator">
                                        Indicator
                                    </option>
                                </select>
                            </Field>
                            <Field label="Series">
                                <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                                    {(['male', 'female', 'total'] as const).map((series) => (
                                        <label
                                            key={series}
                                            className="flex cursor-pointer items-center gap-2 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={widgetForm.series.includes(series)}
                                                onChange={(e) => {
                                                    const nextSeries = e.target.checked
                                                        ? [...widgetForm.series, series]
                                                        : widgetForm.series.filter(
                                                            (item) => item !== series,
                                                        )

                                                    setWidgetForm({
                                                        ...widgetForm,
                                                        series: nextSeries,
                                                    })
                                                }}
                                            />

                                            <span className="capitalize">
                                                {series}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Widget Key">
                                <input
                                    value={widgetForm.key}
                                    onChange={(e) => setWidgetForm({ ...widgetForm, key: e.target.value })}
                                    placeholder="screening_progression"
                                    className={INPUT_CLASS}
                                />
                            </Field>
                            <Field label="Display Order">
                                <input
                                    type="number"
                                    min={0}
                                    value={widgetForm.display_order}
                                    onChange={(e) => setWidgetForm({ ...widgetForm, display_order: Number(e.target.value) })}
                                    className={INPUT_CLASS}
                                />
                            </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Card Width">
                                <select
                                    value={widgetForm.col_span}
                                    onChange={(e) =>
                                        setWidgetForm({
                                            ...widgetForm,
                                            col_span: Number(e.target.value) as WidgetFormState['col_span'],
                                        })
                                    }
                                    className={`${INPUT_CLASS} bg-white`}
                                >
                                    <option value={1}>1 column — One third</option>
                                    <option value={2}>2 columns — Two thirds</option>
                                    <option value={3}>3 columns — Full width</option>
                                </select>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Controls the widget width on large screens.
                                </p>
                            </Field>

                            <Field label="Card Height (px)">
                                <input
                                    type="number"
                                    min={180}
                                    max={900}
                                    step={10}
                                    value={widgetForm.height}
                                    onChange={(e) =>
                                        setWidgetForm({
                                            ...widgetForm,
                                            height: Math.max(180, Math.min(900, Number(e.target.value) || 330)),
                                        })
                                    }
                                    className={INPUT_CLASS}
                                />
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Recommended: 280–500px for most charts and tables.
                                </p>
                            </Field>
                        </div>

                        <Field label="Title">
                            <input
                                value={widgetForm.title}
                                onChange={(e) => setWidgetForm({ ...widgetForm, title: e.target.value })}
                                placeholder="Quarterly Screening Trend"
                                className={INPUT_CLASS}
                            />
                        </Field>

                        <Field label="Description">
                            <textarea
                                value={widgetForm.description}
                                onChange={(e) => setWidgetForm({ ...widgetForm, description: e.target.value })}
                                rows={2}
                                className={INPUT_CLASS}
                            />
                        </Field>

                        {isRanking && (
                            <Field label="Ranking Mode">
                                <select
                                    value={widgetForm.ranking_mode}
                                    onChange={(e) =>
                                        setWidgetForm({
                                            ...widgetForm,
                                            ranking_mode: e.target.value as WidgetFormState['ranking_mode'],
                                            indicator_code:
                                                e.target.value === 'indicator_progress'
                                                    ? ''
                                                    : widgetForm.indicator_code,
                                        })
                                    }
                                    className={`${INPUT_CLASS} bg-white`}
                                >
                                    <option value="lgu">LGU Ranking</option>
                                    <option value="indicator_progress">Indicator Progress Bars</option>
                                </select>
                            </Field>
                        )}

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-3">
                                <p className="text-sm font-bold text-slate-900">Indicator Configuration</p>
                                <p className="text-xs text-slate-500">Only {reportType.name} indicators are shown for this dashboard.</p>
                            </div>

                            {isIndicatorProgressRanking ? (
                                <div className="space-y-4">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {groupedIndicators.map(([sectionName, items]) => (
                                            <div key={sectionName} className="contents">
                                                {items.map((indicator) => {
                                                    const checked = widgetForm.indicator_codes.includes(indicator.code)
                                                    return (
                                                        <label
                                                            key={indicator.id}
                                                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${checked ? 'border-primary bg-white ring-1 ring-primary/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleIndicator(indicator.code)}
                                                                className="mt-0.5"
                                                            />
                                                            <span className="min-w-0">
                                                                <span className="block text-sm font-medium text-slate-800">{indicator.name}</span>
                                                                <code className="mt-0.5 block text-[10px] text-slate-500">{indicator.code}</code>
                                                            </span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Value">
                                            <select
                                                value={widgetForm.value}
                                                onChange={(e) => setWidgetForm({ ...widgetForm, value: e.target.value as WidgetFormState['value'] })}
                                                className={`${INPUT_CLASS} bg-white`}
                                            >
                                                <option value="total">Total</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                        </Field>
                                        <Field label="Widget Color">
                                            <div className="flex items-center gap-3">
                                                <input type="color" value={widgetForm.color} onChange={(e) => setWidgetForm({ ...widgetForm, color: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
                                                <input value={widgetForm.color} onChange={(e) => setWidgetForm({ ...widgetForm, color: e.target.value })} className={`${INPUT_CLASS} flex-1`} />
                                            </div>
                                        </Field>
                                    </div>

                                    {widgetForm.indicator_codes.length === 0 && (
                                        <p className="text-xs font-medium text-amber-700">Select at least one indicator.</p>
                                    )}
                                </div>
                            ) : isKpi ? (
                                <div className="space-y-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Indicator / Numerator">
                                            <select
                                                value={widgetForm.indicator_code}
                                                onChange={(e) =>
                                                    setWidgetForm({
                                                        ...widgetForm,
                                                        indicator_code: e.target.value,
                                                    })
                                                }
                                                className={`${INPUT_CLASS} bg-white`}
                                            >
                                                <option value="">Select numerator indicator</option>
                                                {groupedIndicators.map(([sectionName, items]) => (
                                                    <optgroup key={sectionName} label={sectionName}>
                                                        {items.map((indicator) => (
                                                            <option key={indicator.id} value={indicator.code}>
                                                                {indicator.name} ({indicator.code})
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </Field>

                                        <Field label="Value">
                                            <select
                                                value={widgetForm.value}
                                                onChange={(e) =>
                                                    setWidgetForm({
                                                        ...widgetForm,
                                                        value: e.target.value as WidgetFormState['value'],
                                                    })
                                                }
                                                className={`${INPUT_CLASS} bg-white`}
                                            >
                                                <option value="total">Total</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                        </Field>
                                    </div>

                                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-bold text-blue-950">KPI Calculation</p>
                                                <p className="mt-1 text-xs leading-5 text-blue-800">
                                                    Turn this on when the KPI should be calculated from two indicators instead of displaying the raw indicator value.
                                                </p>
                                            </div>

                                            <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-blue-950">
                                                <input
                                                    type="checkbox"
                                                    checked={widgetForm.formula_enabled}
                                                    onChange={(e) =>
                                                        setWidgetForm({
                                                            ...widgetForm,
                                                            formula_enabled: e.target.checked,
                                                        })
                                                    }
                                                    className="h-4 w-4"
                                                />
                                                Enabled
                                            </label>
                                        </div>

                                        {widgetForm.formula_enabled && (
                                            <div className="mt-4 space-y-4">
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <Field label="Denominator">
                                                        <select
                                                            value={widgetForm.denominator_code}
                                                            onChange={(e) =>
                                                                setWidgetForm({
                                                                    ...widgetForm,
                                                                    denominator_code: e.target.value,
                                                                })
                                                            }
                                                            className={`${INPUT_CLASS} bg-white`}
                                                        >
                                                            <option value="">Select denominator indicator</option>
                                                            {groupedIndicators.map(([sectionName, items]) => (
                                                                <optgroup key={sectionName} label={sectionName}>
                                                                    {items.map((indicator) => (
                                                                        <option key={indicator.id} value={indicator.code}>
                                                                            {indicator.name} ({indicator.code})
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                            ))}
                                                        </select>
                                                    </Field>

                                                    <Field label="Calculation Type">
                                                        <select
                                                            value={widgetForm.formula_type}
                                                            onChange={(e) =>
                                                                setWidgetForm({
                                                                    ...widgetForm,
                                                                    formula_type: e.target.value as WidgetFormState['formula_type'],
                                                                })
                                                            }
                                                            className={`${INPUT_CLASS} bg-white`}
                                                        >
                                                            <option value="percentage">Percentage</option>
                                                            <option value="ratio">Ratio</option>
                                                            <option value="add">Addition</option>
                                                            <option value="subtract">Subtraction</option>
                                                            <option value="multiply">Multiplication</option>
                                                            <option value="divide">Division</option>
                                                        </select>
                                                    </Field>

                                                    <Field label="Numerator Value">
                                                        <select
                                                            value={widgetForm.formula_numerator_field}
                                                            onChange={(e) =>
                                                                setWidgetForm({
                                                                    ...widgetForm,
                                                                    formula_numerator_field: e.target.value as WidgetFormState['formula_numerator_field'],
                                                                })
                                                            }
                                                            className={`${INPUT_CLASS} bg-white`}
                                                        >
                                                            <option value="total">Total</option>
                                                            <option value="male">Male</option>
                                                            <option value="female">Female</option>
                                                        </select>
                                                    </Field>

                                                    <Field label="Denominator Value">
                                                        <select
                                                            value={widgetForm.formula_denominator_field}
                                                            onChange={(e) =>
                                                                setWidgetForm({
                                                                    ...widgetForm,
                                                                    formula_denominator_field: e.target.value as WidgetFormState['formula_denominator_field'],
                                                                })
                                                            }
                                                            className={`${INPUT_CLASS} bg-white`}
                                                        >
                                                            <option value="total">Total</option>
                                                            <option value="male">Male</option>
                                                            <option value="female">Female</option>
                                                        </select>
                                                    </Field>

                                                    {widgetForm.formula_type === 'percentage' && (
                                                        <Field label="Multiply By">
                                                            <input
                                                                type="number"
                                                                value={widgetForm.formula_multiplier}
                                                                onChange={(e) =>
                                                                    setWidgetForm({
                                                                        ...widgetForm,
                                                                        formula_multiplier: Number(e.target.value) || 0,
                                                                    })
                                                                }
                                                                className={`${INPUT_CLASS} bg-white`}
                                                            />
                                                        </Field>
                                                    )}

                                                    <Field label="Decimal Places">
                                                        <select
                                                            value={widgetForm.formula_decimal_places}
                                                            onChange={(e) =>
                                                                setWidgetForm({
                                                                    ...widgetForm,
                                                                    formula_decimal_places: Number(e.target.value),
                                                                })
                                                            }
                                                            className={`${INPUT_CLASS} bg-white`}
                                                        >
                                                            <option value={0}>0</option>
                                                            <option value={1}>1</option>
                                                            <option value={2}>2</option>
                                                            <option value={3}>3</option>
                                                            <option value={4}>4</option>
                                                            <option value={5}>5</option>
                                                            <option value={6}>6</option>
                                                        </select>
                                                    </Field>
                                                </div>

                                                <KpiFormulaPreview
                                                    numeratorLabel={
                                                        indicators.find((item) => item.code === widgetForm.indicator_code)?.name
                                                        ?? 'Numerator'
                                                    }
                                                    denominatorLabel={
                                                        indicators.find((item) => item.code === widgetForm.denominator_code)?.name
                                                        ?? 'Denominator'
                                                    }
                                                    formulaType={widgetForm.formula_type}
                                                    multiplier={widgetForm.formula_multiplier}
                                                    decimalPlaces={widgetForm.formula_decimal_places}
                                                    sampleNumerator={widgetForm.sample_numerator}
                                                    sampleDenominator={widgetForm.sample_denominator}
                                                    onSampleNumeratorChange={(value) =>
                                                        setWidgetForm({ ...widgetForm, sample_numerator: value })
                                                    }
                                                    onSampleDenominatorChange={(value) =>
                                                        setWidgetForm({ ...widgetForm, sample_denominator: value })
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <Field label="Aggregation">
                                        <select
                                            value={widgetForm.aggregation}
                                            onChange={(e) =>
                                                setWidgetForm({
                                                    ...widgetForm,
                                                    aggregation: e.target.value as WidgetFormState['aggregation'],
                                                })
                                            }
                                            className={`${INPUT_CLASS} bg-white`}
                                        >
                                            <option value="sum">Sum</option>
                                            <option value="average">Average</option>
                                            <option value="latest">Latest</option>
                                        </select>
                                    </Field>

                                    <Field label="Widget Color">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={widgetForm.color}
                                                onChange={(e) => setWidgetForm({ ...widgetForm, color: e.target.value })}
                                                className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                                            />
                                            <input
                                                value={widgetForm.color}
                                                onChange={(e) => setWidgetForm({ ...widgetForm, color: e.target.value })}
                                                className={`${INPUT_CLASS} flex-1`}
                                            />
                                        </div>
                                    </Field>

                                    {!widgetForm.indicator_code && (
                                        <p className="text-xs font-medium text-amber-700">Select a numerator indicator.</p>
                                    )}
                                </div>
                            ) : isLguStatus || (isRanking && !isIndicatorProgressRanking) ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Indicator">
                                        <select
                                            value={widgetForm.indicator_code}
                                            onChange={(e) => setWidgetForm({ ...widgetForm, indicator_code: e.target.value })}
                                            className={`${INPUT_CLASS} bg-white`}
                                        >
                                            <option value="">Select indicator</option>
                                            {groupedIndicators.map(([sectionName, items]) => (
                                                <optgroup key={sectionName} label={sectionName}>
                                                    {items.map((indicator) => (
                                                        <option key={indicator.id} value={indicator.code}>
                                                            {indicator.name} ({indicator.code})
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Value">
                                        <select
                                            value={widgetForm.value}
                                            onChange={(e) => setWidgetForm({ ...widgetForm, value: e.target.value as WidgetFormState['value'] })}
                                            className={`${INPUT_CLASS} bg-white`}
                                        >
                                            <option value="total">Total</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </Field>
                                    <Field label="Aggregation">
                                        <select
                                            value={widgetForm.aggregation}
                                            onChange={(e) => setWidgetForm({ ...widgetForm, aggregation: e.target.value as WidgetFormState['aggregation'] })}
                                            className={`${INPUT_CLASS} bg-white`}
                                        >
                                            <option value="sum">Sum</option>
                                            <option value="average">Average</option>
                                            <option value="latest">Latest</option>
                                        </select>
                                    </Field>
                                    <Field label="Widget Color">
                                        <div className="flex items-center gap-3">
                                            <input type="color" value={widgetForm.color} onChange={(e) => setWidgetForm({ ...widgetForm, color: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
                                            <input value={widgetForm.color} onChange={(e) => setWidgetForm({ ...widgetForm, color: e.target.value })} className={`${INPUT_CLASS} flex-1`} />
                                        </div>
                                    </Field>

                                    {isLguStatus && (
                                        <Field label="Denominator (optional)">
                                            <select
                                                value={widgetForm.denominator_code}
                                                onChange={(e) => setWidgetForm({ ...widgetForm, denominator_code: e.target.value })}
                                                className={`${INPUT_CLASS} bg-white`}
                                            >
                                                <option value="">None</option>
                                                {indicators.map((indicator) => (
                                                    <option key={indicator.id} value={indicator.code}>
                                                        {indicator.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {groupedIndicators.map(([sectionName, items]) => (
                                            <div key={sectionName} className="contents">
                                                {items.map((indicator) => {
                                                    const checked = widgetForm.indicator_codes.includes(indicator.code)

                                                    return (
                                                        <label
                                                            key={indicator.id}
                                                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${checked ? 'border-primary bg-white ring-1 ring-primary/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleIndicator(indicator.code)}
                                                                className="mt-0.5"
                                                            />
                                                            <span className="min-w-0">
                                                                <span className="block text-sm font-medium text-slate-800">{indicator.name}</span>
                                                                <code className="mt-0.5 block text-[10px] text-slate-500">{indicator.code}</code>
                                                            </span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Data Series">
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['male', 'female', 'total'] as const).map((series) => {
                                                    const checked = widgetForm.series.includes(series)
                                                    return (
                                                        <label
                                                            key={series}
                                                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold capitalize ${checked ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white text-slate-600'}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() =>
                                                                    setWidgetForm((current) => ({
                                                                        ...current,
                                                                        series: checked
                                                                            ? current.series.filter((item) => item !== series)
                                                                            : [...current.series, series],
                                                                    }))
                                                                }
                                                            />
                                                            {series}
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </Field>

                                        <Field label="Widget Color">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={widgetForm.color}
                                                    onChange={(e) => setWidgetForm({ ...widgetForm, color: e.target.value })}
                                                    className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                                                />
                                                <input
                                                    value={widgetForm.color}
                                                    onChange={(e) => setWidgetForm({ ...widgetForm, color: e.target.value })}
                                                    className={`${INPUT_CLASS} flex-1`}
                                                />
                                            </div>
                                        </Field>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {(['male', 'female', 'total'] as const).map((series) => (
                                            <Field key={series} label={`${series} Color`}>
                                                <input
                                                    type="color"
                                                    value={widgetForm.series_colors[series]}
                                                    onChange={(e) =>
                                                        setWidgetForm({
                                                            ...widgetForm,
                                                            series_colors: {
                                                                ...widgetForm.series_colors,
                                                                [series]: e.target.value,
                                                            },
                                                        })
                                                    }
                                                    className="h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                                                />
                                            </Field>
                                        ))}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Value">
                                            <select
                                                value={widgetForm.value}
                                                onChange={(e) => setWidgetForm({ ...widgetForm, value: e.target.value as WidgetFormState['value'] })}
                                                className={`${INPUT_CLASS} bg-white`}
                                            >
                                                <option value="total">Total</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                        </Field>
                                        <Field label="Aggregation">
                                            <select
                                                value={widgetForm.aggregation}
                                                onChange={(e) => setWidgetForm({ ...widgetForm, aggregation: e.target.value as WidgetFormState['aggregation'] })}
                                                className={`${INPUT_CLASS} bg-white`}
                                            >
                                                <option value="sum">Sum</option>
                                                <option value="average">Average</option>
                                                <option value="latest">Latest</option>
                                            </select>
                                        </Field>
                                    </div>

                                    {widgetForm.series.length === 0 && (
                                        <p className="text-xs font-medium text-amber-700">Select at least one data series.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                                type="checkbox"
                                checked={widgetForm.is_active}
                                onChange={(e) => setWidgetForm({ ...widgetForm, is_active: e.target.checked })}
                            />
                            Widget is active
                        </label>

                        <div className="rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-800">
                            <strong>{selectedWidgetType?.label}</strong> will use the selected {reportType.name} indicators. The server validates the indicator/report-type relationship before saving.
                        </div>
                    </div>

                    <ModalActions onCancel={() => setShowWidgetForm(false)} onSave={saveWidget} />
                </Modal>
            )}

            {showDashboardPreview && (
                <DashboardPreviewModal
                    reportType={reportType}
                    onClose={() => setShowDashboardPreview(false)}
                />
            )}

            {errorModal && (
                <ErrorModal
                    title={errorModal.title}
                    message={errorModal.message}
                    errors={errorModal.errors}
                    onClose={() => setErrorModal(null)}
                />
            )}
        </>
    )
}

function KpiFormulaPreview({
    numeratorLabel,
    denominatorLabel,
    formulaType,
    multiplier,
    decimalPlaces,
    sampleNumerator,
    sampleDenominator,
    onSampleNumeratorChange,
    onSampleDenominatorChange,
}: {
    numeratorLabel: string
    denominatorLabel: string
    formulaType: WidgetFormState['formula_type']
    multiplier: number
    decimalPlaces: number
    sampleNumerator: number
    sampleDenominator: number
    onSampleNumeratorChange: (value: number) => void
    onSampleDenominatorChange: (value: number) => void
}) {
    const operator =
        formulaType === 'add'
            ? '+'
            : formulaType === 'subtract'
                ? '−'
                : formulaType === 'multiply'
                    ? '×'
                    : '÷'

    const result = (() => {
        if (formulaType === 'percentage') {
            if (sampleDenominator === 0) return null
            return (sampleNumerator / sampleDenominator) * multiplier
        }

        if (formulaType === 'ratio' || formulaType === 'divide') {
            if (sampleDenominator === 0) return null
            return sampleNumerator / sampleDenominator
        }

        if (formulaType === 'add') return sampleNumerator + sampleDenominator
        if (formulaType === 'subtract') return sampleNumerator - sampleDenominator
        if (formulaType === 'multiply') return sampleNumerator * sampleDenominator

        return null
    })()

    const formattedResult =
        result === null
            ? 'Cannot calculate'
            : formulaType === 'percentage'
                ? `${result.toFixed(decimalPlaces)}%`
                : result.toFixed(decimalPlaces)

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Calculation Preview
                    </p>
                    <p className="mt-2 text-base font-bold text-slate-900">
                        {numeratorLabel} {operator} {denominatorLabel}
                        {formulaType === 'percentage' && ` × ${multiplier}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        This is a configuration sample only. The dashboard calculates the result from live report data.
                    </p>
                </div>

                <div className="rounded-lg bg-slate-950 px-5 py-3 text-right text-white">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Sample Result
                    </p>
                    <p className="mt-1 text-2xl font-black">
                        {formattedResult}
                    </p>
                </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Sample Numerator">
                    <input
                        type="number"
                        value={sampleNumerator}
                        onChange={(e) => onSampleNumeratorChange(Number(e.target.value) || 0)}
                        className={`${INPUT_CLASS} bg-white`}
                    />
                </Field>

                <Field label="Sample Denominator">
                    <input
                        type="number"
                        value={sampleDenominator}
                        onChange={(e) => onSampleDenominatorChange(Number(e.target.value) || 0)}
                        className={`${INPUT_CLASS} bg-white`}
                    />
                </Field>
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                {sampleNumerator} {operator} {sampleDenominator}
                {formulaType === 'percentage' && ` × ${multiplier}`}
                {' = '}
                <span className="font-bold text-slate-950">{formattedResult}</span>
            </div>
        </div>
    )
}

function DashboardPreviewModal({
    reportType,
    onClose,
}: {
    reportType: ReportType
    onClose: () => void
}) {
    const dashboardUrl = `/justine/reports/${reportType.slug}/dashboard`

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="dashboard-preview-title"
                className="flex h-[94vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl"
            >
                <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2
                                id="dashboard-preview-title"
                                className="text-lg font-bold text-slate-950"
                            >
                                Dashboard Preview
                            </h2>
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                                {reportType.name}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            Preview the saved dashboard layout without leaving the configuration page. The preview uses the current dashboard data and configuration.
                        </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                        <button
                            type="button"
                            onClick={() => window.open(dashboardUrl, '_blank', 'noopener,noreferrer')}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Open Full Dashboard
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close dashboard preview"
                            className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                            Close
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 bg-slate-200 p-2 sm:p-3">
                    <div className="h-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                        <iframe
                            title={`${reportType.name} dashboard preview`}
                            src={dashboardUrl}
                            className="h-full w-full border-0 bg-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function ErrorModal({
    title,
    message,
    errors,
    onClose,
}: {
    title: string
    message: string
    errors: string[]
    onClose: () => void
}) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="dashboard-error-title"
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 px-6 py-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
                        !
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2
                            id="dashboard-error-title"
                            className="text-lg font-bold text-red-950"
                        >
                            {title}
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-red-800">
                            {message}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close error"
                        className="text-xl text-red-400 hover:text-red-700"
                    >
                        ×
                    </button>
                </div>

                {errors.length > 0 && (
                    <div className="max-h-72 overflow-y-auto px-6 py-5">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Error Details
                        </p>
                        <div className="space-y-2">
                            {errors.map((error, index) => (
                                <div
                                    key={`${error}-${index}`}
                                    className="rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-sm text-red-800"
                                >
                                    {error}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end border-t border-slate-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

function Field({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</span>
            {children}
        </label>
    )
}

function Modal({
    title,
    children,
    onClose,
    wide = false,
}: {
    title: string
    children: React.ReactNode
    onClose: () => void
    wide?: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-950">{title}</h2>
                    <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-slate-700">×</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    )
}

function ModalActions({
    onCancel,
    onSave,
}: {
    onCancel: () => void
    onSave: () => void
}) {
    return (
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
            </button>
            <button type="button" onClick={onSave} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Save Configuration
            </button>
        </div>
    )
}
