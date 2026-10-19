import { Head } from '@inertiajs/react'
import {
    Activity,
    BarChart3,
    ClipboardList,
    FileCheck2,
    Layers3,
    Users,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export interface ReportType {
    id: number
    code: string
    slug: string
    name: string
}

export interface Lgu {
    id: number
    name: string
}

export interface DashboardValue {
    male: number | null
    female: number | null
    total: number | null
}

export interface DashboardIndicator {
    id: number
    code: string
    name: string
    display_order: number
    quarters: Record<string, DashboardValue>
    annual: DashboardValue
}

export interface DashboardSection {
    id: number
    code: string
    name: string
    description?: string | null
    indicators: DashboardIndicator[]
}

export interface DashboardWidget {
    id: number
    key: string
    type: string
    title: string
    description?: string | null
    value?: number | null
    config?: Record<string, any>
    data?: Record<string, any>[]
}

export interface GenericDashboardData {
    filters: {
        year: number
        quarterId: number | null
        lguId: number | null
        status: string
    }

    sections: DashboardSection[]

    widgets: DashboardWidget[]

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

interface GenericDashboardProps {
    dashboard: GenericDashboardData

    year: number

    reportType: ReportType

    reportTypes: ReportType[]

    lgus: Array<{
        id: number
        name: string
    }>
}

interface Props {
    dashboard: GenericDashboardData
    year: number
    reportType: ReportType
    reportTypes: ReportType[]
    lgus: Lgu[]
}

/*
|--------------------------------------------------------------------------
| Main Dashboard
|--------------------------------------------------------------------------
*/

export default function GenericDashboard({
    dashboard,
    year,
    reportType,
    reportTypes,
    lgus,
}: GenericDashboardProps) {
    return (
        <>
            <Head title={`${reportType.name} Dashboard`} />

            <div className="space-y-6">
                {/* ---------------------------------------------------------
                    Header
                --------------------------------------------------------- */}

                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <BarChart3 className="size-5 text-primary" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {reportType.name} Dashboard
                            </h1>

                            <p className="text-sm text-muted-foreground">
                                Reporting summary and performance indicators
                            </p>
                        </div>
                    </div>
                </div>

                {/* ---------------------------------------------------------
                    Summary cards
                --------------------------------------------------------- */}

                <MetaCards dashboard={dashboard} />

                {/* ---------------------------------------------------------
                    Configured dashboard widgets
                --------------------------------------------------------- */}

                <WidgetGrid widgets={dashboard.widgets} />

                {/* ---------------------------------------------------------
                    Report sections / indicators
                --------------------------------------------------------- */}

                <SectionSummary
                    sections={dashboard.sections}
                    filters={dashboard.filters}
                />

                {/* ---------------------------------------------------------
                    FHSIS
                --------------------------------------------------------- */}

                <FhsisStatus fhsis={dashboard.fhsis} />
            </div>
        </>
    )
}

/*
|--------------------------------------------------------------------------
| Meta Cards
|--------------------------------------------------------------------------
*/

function MetaCards({
    dashboard,
}: {
    dashboard: GenericDashboardData
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetaCard
                title="LGUs"
                value={dashboard.meta.lgu_count}
                icon={Users}
                description="LGUs included in this dashboard"
            />

            <MetaCard
                title="Submissions"
                value={dashboard.meta.submission_count}
                icon={ClipboardList}
                description="Report submissions included"
            />

            <MetaCard
                title="Reporting Year"
                value={dashboard.filters.year}
                icon={Activity}
                description={
                    dashboard.filters.quarterId
                        ? `Quarter ${dashboard.filters.quarterId}`
                        : 'Annual view'
                }
            />
        </div>
    )
}

function MetaCard({
    title,
    value,
    icon: Icon,
    description,
}: {
    title: string
    value: number | string
    icon: React.ElementType
    description: string
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>

                <Icon className="size-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
                <div className="text-3xl font-bold">
                    {formatNumber(value)}
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}

/*
|--------------------------------------------------------------------------
| Widget Grid
|--------------------------------------------------------------------------
*/

function WidgetGrid({
    widgets,
}: {
    widgets: DashboardWidget[]
}) {
    if (!widgets.length) {
        return null
    }

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">
                    Dashboard Overview
                </h2>

                <p className="text-sm text-muted-foreground">
                    Configured indicators and visualizations
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {widgets.map((widget) => (
                    <DashboardWidget
                        key={widget.id}
                        widget={widget}
                    />
                ))}
            </div>
        </section>
    )
}

/*
|--------------------------------------------------------------------------
| Widget Router
|--------------------------------------------------------------------------
*/

function DashboardWidget({
    widget,
}: {
    widget: DashboardWidget
}) {
    switch (widget.type) {
        case 'kpi':
            return <KpiWidget widget={widget} />

        case 'summary_table':
            return <SummaryTableWidget widget={widget} />

        case 'bar_chart':
            return <ChartWidget widget={widget} />

        case 'line_chart':
            return <ChartWidget widget={widget} />

        case 'ranking':
            return <RankingWidget widget={widget} />

        default:
            return null
    }
}

/*
|--------------------------------------------------------------------------
| KPI Widget
|--------------------------------------------------------------------------
*/

function KpiWidget({
    widget,
}: {
    widget: DashboardWidget
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">
                    {widget.title}
                </CardTitle>

                {widget.description && (
                    <p className="text-xs text-muted-foreground">
                        {widget.description}
                    </p>
                )}
            </CardHeader>

            <CardContent>
                <div className="text-3xl font-bold">
                    {widget.value === null ||
                    widget.value === undefined
                        ? '—'
                        : formatNumber(widget.value)}
                </div>
            </CardContent>
        </Card>
    )
}

/*
|--------------------------------------------------------------------------
| Summary Table Widget
|--------------------------------------------------------------------------
*/

function SummaryTableWidget({
    widget,
}: {
    widget: DashboardWidget
}) {
    const data = widget.data ?? []

    return (
        <Card className="md:col-span-2 xl:col-span-3">
            <CardHeader>
                <CardTitle>{widget.title}</CardTitle>

                {widget.description && (
                    <p className="text-sm text-muted-foreground">
                        {widget.description}
                    </p>
                )}
            </CardHeader>

            <CardContent>
                {data.length === 0 ? (
                    <EmptyState message="No summary data available." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    {Object.keys(data[0]).map(
                                        (key) => (
                                            <th
                                                key={key}
                                                className="px-3 py-3 text-left font-medium"
                                            >
                                                {formatColumnName(key)}
                                            </th>
                                        ),
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {data.map((row, index) => (
                                    <tr
                                        key={index}
                                        className="border-b last:border-0"
                                    >
                                        {Object.entries(row).map(
                                            ([key, value]) => (
                                                <td
                                                    key={key}
                                                    className="px-3 py-3"
                                                >
                                                    {formatCellValue(
                                                        value,
                                                    )}
                                                </td>
                                            ),
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

/*
|--------------------------------------------------------------------------
| Chart Widget
|--------------------------------------------------------------------------
|
| This is intentionally a generic table-based representation.
| You can replace it with Recharts later without changing
| the dashboard service contract.
|--------------------------------------------------------------------------
*/

function ChartWidget({
    widget,
}: {
    widget: DashboardWidget
}) {
    const data = widget.data ?? []

    return (
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>{widget.title}</CardTitle>

                {widget.description && (
                    <p className="text-sm text-muted-foreground">
                        {widget.description}
                    </p>
                )}
            </CardHeader>

            <CardContent>
                {data.length === 0 ? (
                    <EmptyState message="No chart data available." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    {Object.keys(data[0]).map(
                                        (key) => (
                                            <th
                                                key={key}
                                                className="px-3 py-3 text-left"
                                            >
                                                {formatColumnName(key)}
                                            </th>
                                        ),
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {data.map((row, index) => (
                                    <tr
                                        key={index}
                                        className="border-b last:border-0"
                                    >
                                        {Object.entries(row).map(
                                            ([key, value]) => (
                                                <td
                                                    key={key}
                                                    className="px-3 py-3"
                                                >
                                                    {formatCellValue(
                                                        value,
                                                    )}
                                                </td>
                                            ),
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

/*
|--------------------------------------------------------------------------
| Ranking Widget
|--------------------------------------------------------------------------
*/

function RankingWidget({
    widget,
}: {
    widget: DashboardWidget
}) {
    const data = widget.data ?? []

    return (
        <Card>
            <CardHeader>
                <CardTitle>{widget.title}</CardTitle>

                {widget.description && (
                    <p className="text-sm text-muted-foreground">
                        {widget.description}
                    </p>
                )}
            </CardHeader>

            <CardContent>
                {data.length === 0 ? (
                    <EmptyState message="No ranking data available." />
                ) : (
                    <div className="space-y-3">
                        {data.map((item, index) => (
                            <div
                                key={`${item.lgu_id ?? index}`}
                                className="flex items-center justify-between gap-4 border-b pb-3 last:border-0"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                        {index + 1}
                                    </div>

                                    <span className="truncate text-sm">
                                        {item.lgu ?? 'Unknown LGU'}
                                    </span>
                                </div>

                                <span className="font-semibold">
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

/*
|--------------------------------------------------------------------------
| Report Section Summary
|--------------------------------------------------------------------------
*/

function SectionSummary({
    sections,
    filters,
}: {
    sections: DashboardSection[]
    filters: GenericDashboardData['filters']
}) {
    if (!sections.length) {
        return (
            <Card>
                <CardContent className="py-10">
                    <EmptyState
                        message="No active report sections have been configured."
                    />
                </CardContent>
            </Card>
        )
    }

    return (
        <section className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">
                    Report Summary
                </h2>

                <p className="text-sm text-muted-foreground">
                    Indicators configured for this report type
                </p>
            </div>

            {sections.map((section) => (
                <ReportSectionCard
                    key={section.id}
                    section={section}
                    filters={filters}
                />
            ))}
        </section>
    )
}

/*
|--------------------------------------------------------------------------
| Individual Report Section
|--------------------------------------------------------------------------
*/

function ReportSectionCard({
    section,
    filters,
}: {
    section: DashboardSection
    filters: GenericDashboardData['filters']
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Layers3 className="size-4" />
                    </div>

                    <div>
                        <CardTitle>{section.name}</CardTitle>

                        {section.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {section.description}
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="px-3 py-3 text-left">
                                    Indicator
                                </th>

                                <th className="px-3 py-3 text-right">
                                    Male
                                </th>

                                <th className="px-3 py-3 text-right">
                                    Female
                                </th>

                                <th className="px-3 py-3 text-right">
                                    Total
                                </th>

                                {!filters.quarterId && (
                                    <>
                                        <th className="px-3 py-3 text-right">
                                            Q1
                                        </th>

                                        <th className="px-3 py-3 text-right">
                                            Q2
                                        </th>

                                        <th className="px-3 py-3 text-right">
                                            Q3
                                        </th>

                                        <th className="px-3 py-3 text-right">
                                            Q4
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {section.indicators.map(
                                (indicator) => {
                                    const annual =
                                        indicator.annual

                                    return (
                                        <tr
                                            key={indicator.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-3 py-3">
                                                <div className="font-medium">
                                                    {indicator.name}
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    {indicator.code}
                                                </div>
                                            </td>

                                            <td className="px-3 py-3 text-right">
                                                {formatValue(
                                                    annual.male,
                                                )}
                                            </td>

                                            <td className="px-3 py-3 text-right">
                                                {formatValue(
                                                    annual.female,
                                                )}
                                            </td>

                                            <td className="px-3 py-3 text-right font-semibold">
                                                {formatValue(
                                                    annual.total,
                                                )}
                                            </td>

                                            {!filters.quarterId && (
                                                <>
                                                    <QuarterCell
                                                        value={
                                                            indicator
                                                                .quarters[
                                                                '1'
                                                            ]
                                                                ?.total
                                                        }
                                                    />

                                                    <QuarterCell
                                                        value={
                                                            indicator
                                                                .quarters[
                                                                '2'
                                                            ]
                                                                ?.total
                                                        }
                                                    />

                                                    <QuarterCell
                                                        value={
                                                            indicator
                                                                .quarters[
                                                                '3'
                                                            ]
                                                                ?.total
                                                        }
                                                    />

                                                    <QuarterCell
                                                        value={
                                                            indicator
                                                                .quarters[
                                                                '4'
                                                            ]
                                                                ?.total
                                                        }
                                                    />
                                                </>
                                            )}
                                        </tr>
                                    )
                                },
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

function QuarterCell({
    value,
}: {
    value: number | null | undefined
}) {
    return (
        <td className="px-3 py-3 text-right text-muted-foreground">
            {formatValue(value)}
        </td>
    )
}

/*
|--------------------------------------------------------------------------
| FHSIS
|--------------------------------------------------------------------------
*/

function FhsisStatus({
    fhsis,
}: {
    fhsis: GenericDashboardData['fhsis']
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <FileCheck2 className="size-4" />
                    </div>

                    <div>
                        <CardTitle>
                            FHSIS Comparison
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            FHSIS data availability for this report
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {fhsis.available ? (
                    <div className="rounded-lg border p-4">
                        <div className="font-medium">
                            FHSIS report available
                        </div>

                        <div className="mt-1 text-sm text-muted-foreground">
                            Report ID:{' '}
                            {fhsis.report_id ?? '—'}
                        </div>

                        <div className="text-sm text-muted-foreground">
                            Version:{' '}
                            {fhsis.version ?? '—'}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed p-4">
                        <p className="text-sm text-muted-foreground">
                            {fhsis.message ??
                                'No FHSIS report is available.'}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

function EmptyState({
    message,
}: {
    message: string
}) {
    return (
        <div className="py-8 text-center text-sm text-muted-foreground">
            {message}
        </div>
    )
}

/*
|--------------------------------------------------------------------------
| Formatting Helpers
|--------------------------------------------------------------------------
*/

function formatNumber(
    value: number | string | null | undefined,
) {
    if (value === null || value === undefined) {
        return '—'
    }

    if (typeof value === 'number') {
        return value.toLocaleString()
    }

    return value
}

function formatValue(
    value: unknown,
) {
    if (value === null || value === undefined || value === '') {
        return '—'
    }

    if (typeof value === 'number') {
        return value.toLocaleString()
    }

    return String(value)
}

function formatCellValue(
    value: unknown,
) {
    return formatValue(value)
}

function formatColumnName(
    value: string,
) {
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
}