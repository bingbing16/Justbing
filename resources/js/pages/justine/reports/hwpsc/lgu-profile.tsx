import { Link } from '@inertiajs/react'
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    FileCheck2,
    HeartPulse,
    ShieldAlert,
    Target,
    Users,
} from 'lucide-react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QuarterValue {
    submission_id: number | null
    status: string | null
    status_name: string | null
    male: number | null
    female: number | null
    total: number | null
    has_data: boolean
}

interface IndicatorRow {
    id: number
    code: string
    name: string
    display_order: number
    quarters: Record<string, QuarterValue>
}

interface ReportSection {
    id: number
    code: string
    name: string
    description: string | null
    display_order: number
    indicators: IndicatorRow[]
}

interface Profile {
    year: number
    lgu: { id: number; name: string }
    report_type: { id: number; code: string; name: string; slug: string }
    quarters: Array<{ id: number; code: string; name: string }>
    summary: {
        indicator_count: number
        reported_quarters: number
        total_quarters: number
        latest_status: string | null
        latest_status_name: string | null
        value_count: number
    }
    sections: ReportSection[]
    submissions: Array<{
        id: number
        quarter_id: number | null
        quarter: string | null
        quarter_name: string | null
        year: number | null
        status: string | null
        status_name: string | null
        validation_status: string | null
        validated_at: string | null
        validation_remarks: string | null
        validator: string | null
        remarks: string | null
    }>
    generated_at: string
}

interface ReportType {
    id: number
    code: string
    name: string
    slug?: string
}

interface Props {
    profile: Profile
    reportType: ReportType
    reportTypes?: ReportType[]
    year: number
}

const COLORS = {
    blue: '#07549a',
    positive: '#f59e0b',
    referred: '#16a34a',
    grid: '#e2e8f0',
} as const

const number = (value: number | null | undefined) =>
    value === null || value === undefined
        ? '—'
        : new Intl.NumberFormat('en-PH', {
              maximumFractionDigits: 0,
          }).format(value)

const dateTime = (value: string | null | undefined) =>
    value
        ? new Date(value).toLocaleString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
          })
        : '—'

const statusClass = (status: string | null | undefined) => {
    switch (status) {
        case 'approved':
        case 'validated':
        case 'match':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700'
        case 'discrepancy':
            return 'border-red-200 bg-red-50 text-red-700'
        case 'submitted':
            return 'border-blue-200 bg-blue-50 text-blue-700'
        case 'not_comparable':
            return 'border-amber-200 bg-amber-50 text-amber-700'
        default:
            return 'border-slate-200 bg-slate-50 text-slate-600'
    }
}

const statusLabel = (status: string | null | undefined) => {
    switch (status) {
        case 'validated':
            return 'Validated'
        case 'discrepancy':
            return 'Discrepancy'
        case 'not_comparable':
            return 'Not Comparable'
        case 'approved':
            return 'Approved'
        case 'submitted':
            return 'Submitted'
        case 'draft':
            return 'Draft'
        case 'rejected':
            return 'Rejected'
        default:
            return 'Not Checked'
    }
}

function MetricCard({
    label,
    value,
    icon: Icon,
    tone,
    subtitle,
}: {
    label: string
    value: string
    icon: React.ElementType
    tone: 'blue' | 'cyan' | 'amber' | 'violet' | 'green'
    subtitle?: string
}) {
    const styles = {
        blue: {
            icon: 'bg-blue-50 text-blue-700',
            bar: 'bg-blue-600',
        },
        cyan: {
            icon: 'bg-cyan-50 text-cyan-700',
            bar: 'bg-cyan-600',
        },
        amber: {
            icon: 'bg-amber-50 text-amber-700',
            bar: 'bg-amber-500',
        },
        violet: {
            icon: 'bg-violet-50 text-violet-700',
            bar: 'bg-violet-600',
        },
        green: {
            icon: 'bg-emerald-50 text-emerald-700',
            bar: 'bg-emerald-600',
        },
    }

    const style = styles[tone]

    return (
        <Card className="relative overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} />

            <CardContent className="p-5 pl-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            {label}
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

                    <div className={`rounded-xl p-2.5 ${style.icon}`}>
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
}: {
    eyebrow?: string
    title: string
    description?: string
}) {
    return (
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
    )
}

function ChartCard({
    title,
    description,
    children,
    badge,
}: {
    title: string
    description?: string
    children: React.ReactNode
    badge?: string
}) {
    return (
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
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
                            className="border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
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

function WrappedYAxisTick({ x, y, payload }: any) {
    const text = String(payload?.value ?? '')
    const words = text.split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let current = ''

    for (const word of words) {
        const next = current ? `${current} ${word}` : word
        if (next.length > 22 && current) {
            lines.push(current)
            current = word
        } else {
            current = next
        }
    }
    if (current) lines.push(current)

    return (
        <g transform={`translate(${x},${y})`}>
            {lines.slice(0, 3).map((line, index) => (
                <text
                    key={`${line}-${index}`}
                    x={-8}
                    y={(index - (Math.min(lines.length, 3) - 1) / 2) * 13}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize={10}
                >
                    {line}
                </text>
            ))}
        </g>
    )
}

export default function LguProfile({
    profile,
    reportType,
    year,
}: Props) {
    const quarters = profile.quarters ?? []
    const sections = profile.sections ?? []
    const submissions = profile.submissions ?? []

    const indicatorRows = sections.flatMap((section) =>
        (section.indicators ?? []).map((indicator) => ({
            ...indicator,
            sectionName: section.name,
        })),
    )

    const reportedQuarters = profile.summary.reported_quarters
    const totalQuarters = profile.summary.total_quarters
    const latestStatus = profile.summary.latest_status
    const latestStatusName = profile.summary.latest_status_name

    const latestSubmission = [...submissions]
        .sort((a, b) => (b.quarter_id ?? 0) - (a.quarter_id ?? 0))
        .find((submission) => submission.status)

    const chartIndicators = indicatorRows.slice(0, 3)

    const indicatorTrend = quarters.map((quarter) => {
        const point: Record<string, string | number | null> = {
            quarter: quarter.code,
        }

        chartIndicators.forEach((indicator) => {
            point[indicator.code] =
                indicator.quarters[quarter.code]?.total ?? null
        })

        return point
    })

    const summaryCards = [
        {
            label: 'Indicators',
            value: number(profile.summary.indicator_count),
            icon: Target,
            tone: 'blue' as const,
            subtitle: `Active ${reportType.code} indicators`,
        },
        {
            label: 'Reported',
            value: `${number(reportedQuarters)} / ${number(totalQuarters)}`,
            icon: FileCheck2,
            tone: 'green' as const,
            subtitle: 'Quarterly submissions',
        },
        {
            label: 'Values',
            value: number(profile.summary.value_count),
            icon: Users,
            tone: 'cyan' as const,
            subtitle: 'Submitted indicator values',
        },
        {
            label: 'Latest Status',
            value: statusLabel(latestStatus),
            icon: CheckCircle2,
            tone: latestStatus === 'approved' || latestStatus === 'submitted'
                ? 'green' as const
                : latestStatus === 'draft'
                  ? 'amber' as const
                  : 'violet' as const,
            subtitle: latestStatusName ?? 'No submission yet',
        },
        {
            label: 'LGU',
            value: profile.lgu.name,
            icon: HeartPulse,
            tone: 'violet' as const,
            subtitle: `${reportType.name} report`,
        },
    ]

    return (
        <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
            {/* Header */}
            <header className="relative overflow-hidden bg-[#063b6f] text-white shadow-lg">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_15%_90%,rgba(255,255,255,0.06),transparent_30%)]" />

                <div className="relative mx-auto max-w-[1800px] px-5 py-6 lg:px-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="mt-0.5 border border-white/10 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                <Link
                                    href={`/justine/reports/${reportType.slug ?? 'hwpsc'}/dashboard?year=${year}`}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>

                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm">
                                <HeartPulse className="h-7 w-7" />
                            </div>

                            <div>
                                <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200">
                                    <span>LGU Profile</span>
                                    <span className="h-1 w-1 rounded-full bg-blue-300" />
                                    <span>{reportType.code}</span>
                                </div>

                                <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                                    {profile.lgu.name}
                                </h1>

                                <p className="mt-1 text-sm text-blue-100">
                                    {reportType.name} • Reporting Year {year}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-200">
                                    Reporting Year
                                </p>
                                <p className="mt-0.5 text-xl font-bold">{year}</p>
                            </div>

                            <Badge className="border-white/20 bg-white/10 px-4 py-2 text-white hover:bg-white/10">
                                {reportType.name}
                            </Badge>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1800px] space-y-7 px-5 py-6 lg:px-8">
                {/* Profile summary */}
                <section className="space-y-4">
                    <SectionHeading
                        eyebrow="LGU Overview"
                        title={`${profile.lgu.name} Performance Snapshot`}
                        description={`Current-year ${reportType.name.toLowerCase()} reporting, indicators and submission status.`}
                    />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {summaryCards.map((card) => (
                            <MetricCard key={card.label} {...card} />
                        ))}
                    </div>
                </section>

                {/* Current reporting status */}
                <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                    <div
                        className={`h-1 ${
                            latestStatus === 'approved' || latestStatus === 'submitted'
                                ? 'bg-emerald-500'
                                : latestStatus === 'rejected'
                                  ? 'bg-red-500'
                                  : latestStatus === 'draft'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-300'
                        }`}
                    />

                    <CardContent className="p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-slate-50 p-2.5 text-slate-600">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                        Current Reporting Status
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={statusClass(latestStatus)}
                                        >
                                            {statusLabel(latestStatus)}
                                        </Badge>
                                        {latestStatusName && (
                                            <span className="text-sm font-medium text-slate-700">
                                                {latestStatusName}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Latest submission status for this LGU and report type.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                <span className="font-semibold text-slate-800">
                                    {reportedQuarters}
                                </span>{' '}
                                of{' '}
                                <span className="font-semibold text-slate-800">
                                    {totalQuarters}
                                </span>{' '}
                                quarters reported
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quarterly trends */}
                <section className="space-y-4">
                    <SectionHeading
                        eyebrow="Performance Analytics"
                        title="Quarterly Trends"
                        description={`Monitor ${reportType.name.toLowerCase()} indicator values across the reporting year.`}
                    />

                    <div className="grid gap-4 lg:grid-cols-2">
                        <ChartCard
                            title="Indicator Progression"
                            description="Total values by quarter for the first active indicators of this report type."
                            badge={`${chartIndicators.length} INDICATORS`}
                        >
                            {chartIndicators.length === 0 ? (
                                <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                                    No active indicators configured for this report type.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={indicatorTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                                        <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Legend />
                                        {chartIndicators.map((indicator, index) => (
                                            <Line
                                                key={indicator.id}
                                                type="monotone"
                                                dataKey={indicator.code}
                                                name={indicator.name}
                                                stroke={
                                                    [
                                                        COLORS.blue,
                                                        COLORS.positive,
                                                        COLORS.referred,
                                                    ][index % 3]
                                                }
                                                strokeWidth={2}
                                                dot={{ r: 3 }}
                                                connectNulls={false}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard
                            title="Reported Indicator Values"
                            description="Total indicator values across each quarter."
                            badge={`${indicatorRows.length} INDICATORS`}
                        >
                            {indicatorRows.length === 0 ? (
                                <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                                    No indicator data available.
                                </div>
                            ) : (
                                <div className="max-h-[650px] overflow-y-auto pr-2">
                                    <ResponsiveContainer
                                        width="100%"
                                        height={Math.max(320, indicatorRows.length * 58 + 90)}
                                    >
                                        <BarChart
                                            data={indicatorRows.map((indicator) => ({
                                                name: indicator.name,
                                                total: quarters.reduce(
                                                    (sum, quarter) =>
                                                        sum +
                                                        (indicator.quarters[quarter.code]?.total ?? 0),
                                                    0,
                                                ),
                                            }))}
                                            layout="vertical"
                                            margin={{
                                                left: 25,
                                                right: 25,
                                                top: 10,
                                                bottom: 10,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke={COLORS.grid}
                                            />

                                            <XAxis
                                                type="number"
                                                tick={{ fontSize: 11 }}
                                            />

                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                width={190}
                                                tick={<WrappedYAxisTick />}
                                            />

                                            <Tooltip />

                                            <Bar
                                                dataKey="total"
                                                name="Total"
                                                fill={COLORS.blue}
                                                radius={[0, 6, 6, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </ChartCard>
                    </div>
                </section>

                {/* Dynamic indicators */}
                <section className="space-y-4">
                    <SectionHeading
                        eyebrow="Report Indicators"
                        title={`${reportType.name} Indicators`}
                        description="Indicator data is loaded from the active sections and indicators configured for this report type."
                    />

                    <div className="space-y-4">
                        {sections.map((section) => (
                            <ChartCard
                                key={section.id}
                                title={section.name}
                                description={section.description ?? undefined}
                                badge={`${section.indicators.length} INDICATORS`}
                            >
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px] text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                <th className="px-4 py-3 text-left">Indicator Name</th>
                                                {quarters.map((quarter) => (
                                                    <th key={quarter.id} className="px-4 py-3 text-center">
                                                        {quarter.code}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.indicators.map((indicator) => (
                                                <tr
                                                    key={indicator.id}
                                                    className="border-t border-slate-100 hover:bg-slate-50"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold leading-5 text-slate-800">
                                                            {indicator.name || indicator.code}
                                                        </div>
                                                    </td>

                                                    {quarters.map((quarter) => {
                                                        const value = indicator.quarters[quarter.code]

                                                        return (
                                                            <td key={quarter.id} className="px-4 py-3 align-top">
                                                                <div className="flex flex-col items-center gap-1.5">
                                                                    <span className="font-bold text-slate-900">
                                                                        {number(value?.total)}
                                                                    </span>

                                                                    <div className="flex gap-1">
                                                                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">
                                                                            M {number(value?.male)}
                                                                        </span>
                                                                        <span className="rounded bg-pink-50 px-1.5 py-0.5 text-[9px] font-semibold text-pink-700">
                                                                            F {number(value?.female)}
                                                                        </span>
                                                                    </div>

                                                                    <Badge
                                                                        variant="outline"
                                                                        className={statusClass(value?.status)}
                                                                    >
                                                                        {value?.has_data
                                                                            ? statusLabel(value.status)
                                                                            : 'No Data'}
                                                                    </Badge>
                                                                </div>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </ChartCard>
                        ))}

                        {sections.length === 0 && (
                            <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                                <CardContent className="p-10 text-center text-sm text-slate-400">
                                    No active sections or indicators are configured for {reportType.name}.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </section>

                {/* Quarterly performance */}
                <section className="space-y-4">
                    <SectionHeading
                        eyebrow="Quarterly Status"
                        title="Quarterly Performance"
                        description="Submission status and indicator coverage for each reporting quarter."
                    />

                    <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px] text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            <th className="px-4 py-3 text-left">Quarter</th>
                                            <th className="px-4 py-3 text-left">Submission</th>
                                            <th className="px-4 py-3 text-left">Validation</th>
                                            <th className="px-4 py-3 text-center">Indicators</th>
                                            <th className="px-4 py-3 text-left">Validated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quarters.map((quarter) => {
                                            const submission = submissions.find(
                                                (item) => item.quarter_id === quarter.id,
                                            )

                                            const reportedIndicators = indicatorRows.filter(
                                                (indicator) => indicator.quarters[quarter.code]?.has_data,
                                            ).length

                                            return (
                                                <tr
                                                    key={quarter.id}
                                                    className="border-t border-slate-100 hover:bg-slate-50"
                                                >
                                                    <td className="px-4 py-3 font-semibold text-slate-800">
                                                        {quarter.code}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={statusClass(submission?.status)}
                                                        >
                                                            {statusLabel(submission?.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={statusClass(submission?.validation_status)}
                                                        >
                                                            {statusLabel(submission?.validation_status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                                        {reportedIndicators} / {indicatorRows.length}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-500">
                                                        {dateTime(submission?.validated_at)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* History */}
                <section className="space-y-4">
                    <SectionHeading
                        eyebrow="Audit Trail"
                        title="Submission History"
                        description="Reporting and validation activity for this LGU."
                    />

                    <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80">
                        <CardContent className="p-0">
                            {submissions.length === 0 ? (
                                <div className="p-8 text-center text-sm text-slate-400">
                                    No submissions found for this report type and year.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[760px] text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                <th className="px-4 py-3 text-left">Quarter</th>
                                                <th className="px-4 py-3 text-left">Submission</th>
                                                <th className="px-4 py-3 text-left">Validation</th>
                                                <th className="px-4 py-3 text-left">Validator</th>
                                                <th className="px-4 py-3 text-left">Validated</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {submissions.map((submission) => (
                                                <tr
                                                    key={submission.id}
                                                    className="border-t border-slate-100 hover:bg-slate-50"
                                                >
                                                    <td className="px-4 py-3 font-semibold text-slate-800">
                                                        {submission.quarter ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={statusClass(submission.status)}
                                                        >
                                                            {statusLabel(submission.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={statusClass(submission.validation_status)}
                                                        >
                                                            {statusLabel(submission.validation_status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-500">
                                                        {submission.validator ?? 'System'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-500">
                                                        {dateTime(submission.validated_at)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <footer className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        {reportType.name} • {profile.lgu.name} • {year}
                    </p>

                    <Link
                        href={`/justine/reports/${reportType.slug ?? 'hwpsc'}/dashboard?year=${year}`}
                        className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-[#07549a]"
                    >
                        Back to Dashboard
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </footer>
            </main>
        </div>
    )
}
