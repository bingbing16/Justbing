import { Head, Link } from '@inertiajs/react'

import {
    AlertTriangle,
    ArrowLeft,
    Download,
    FileWarning,
    Printer,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type Quarter = {
    id: number
    code: string
    name: string
}

type Lgu = {
    id: number
    name: string
}

type Value = {
    male: number | null
    female: number | null
    total: number | null
}

type DiscrepancyRow = {
    lgu_id: number
    lgu_name: string

    indicator_id: number
    indicator_code: string
    indicator_name: string

    lgu: Value
    fhsis: Value
    difference: Value

    status: string
}

type Group = {
    lgu_id: number
    lgu_name: string
    discrepancy_count: number
    rows: DiscrepancyRow[]
}

type Props = {
    reportType: ReportType
    year: number
    quarter: Quarter | null
    lgu: Lgu | null

    groups: Group[]

    total_discrepancies: number
    total_lgus: number
}

type ReportType = {
    id: number
    code: string
    name: string
    slug: string
}

export default function DiscrepancyReport({
    reportType,
    year,
    quarter,
    lgu,
    groups,
    total_discrepancies,
    total_lgus,
}: Props) {

    const reportBaseUrl = `/justine/fhsis/${reportType.slug}`
    const formatNumber = (
        value: number | null,
    ) => {
        if (
            value === null ||
            value === undefined
        ) {
            return '—'
        }

        return new Intl.NumberFormat(
            'en-US',
            {
                maximumFractionDigits: 2,
            },
        ).format(Number(value))
    }

    const exportReport = () => {
        const params = new URLSearchParams()

        params.set('year', String(year))

        if (quarter) {
            params.set(
                'quarter_id',
                String(quarter.id),
            )
        }

        if (lgu) {
            params.set(
                'lgu_id',
                String(lgu.id),
            )
        }

        window.location.href =
            `${reportBaseUrl}/discrepancy-report/export?${params.toString()}`
    }

    return (
        <>
            <Head title="FHSIS Discrepancy Report" />

            <div className="min-h-screen bg-muted/20">

                {/* ==================================================
                    TOP ACTION BAR
                ================================================== */}

                <div className="border-b bg-background print:hidden">
                    <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">

                        <Button
                            asChild
                            variant="ghost"
                        >
                            <Link href={`${reportBaseUrl}/comparison`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Comparison
                            </Link>
                        </Button>

                        <div className="flex gap-2">

                            <Button
                                variant="outline"
                                onClick={exportReport}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>

                            <Button
                                onClick={() =>
                                    window.print()
                                }
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Print Report
                            </Button>

                        </div>
                    </div>
                </div>

                {/* ==================================================
                    REPORT
                ================================================== */}

                <main className="mx-auto max-w-[1600px] p-6">

                    {/* REPORT HEADER */}

                    <div className="mb-6 rounded-xl border bg-background p-8 shadow-sm">

                        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

                            <div>

                                <div className="flex items-center gap-2">
                                    <FileWarning className="h-6 w-6 text-red-600" />

                                    <h1 className="text-2xl font-semibold">
                                        FHSIS Discrepancy Report
                                    </h1>
                                </div>

                                <p className="mt-2 text-sm text-muted-foreground">
                                    Reconciliation of approved LGU {reportType.name}
                                    reports against imported FHSIS data.
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">

                                    <Badge variant="secondary">
                                        {reportType.name}
                                    </Badge>

                                    <Badge variant="secondary">
                                        {year}
                                    </Badge>

                                    {quarter && (
                                        <Badge variant="secondary">
                                            {quarter.code}
                                        </Badge>
                                    )}

                                    {lgu && (
                                        <Badge variant="secondary">
                                            {lgu.name}
                                        </Badge>
                                    )}

                                </div>
                            </div>

                            <div className="text-left md:text-right">
                                <div className="text-sm text-muted-foreground">
                                    Generated Report
                                </div>

                                <div className="mt-1 text-sm font-medium">
                                    FHSIS vs LGU Reconciliation
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ==================================================
                        SUMMARY
                    ================================================== */}

                    <div className="mb-6 grid gap-4 md:grid-cols-2">

                        <Card className="border-red-200">
                            <CardContent className="p-5">

                                <div className="flex items-center justify-between">

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Total Discrepancies
                                        </p>

                                        <p className="mt-2 text-3xl font-semibold text-red-600">
                                            {total_discrepancies}
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Indicator comparisons requiring review
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-red-50 p-3">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-5">

                                <div className="flex items-center justify-between">

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            LGUs With Discrepancies
                                        </p>

                                        <p className="mt-2 text-3xl font-semibold">
                                            {total_lgus}
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            LGUs requiring review
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-muted p-3">
                                        <FileWarning className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ==================================================
                        NO DISCREPANCIES
                    ================================================== */}

                    {groups.length === 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center">

                                <div className="rounded-full bg-emerald-50 p-4">
                                    <FileWarning className="h-8 w-8 text-emerald-600" />
                                </div>

                                <h2 className="mt-4 text-lg font-semibold">
                                    No Discrepancies Found
                                </h2>

                                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                    No differences were detected between
                                    the approved LGU report and FHSIS data
                                    for the selected reporting period.
                                </p>

                            </CardContent>
                        </Card>
                    )}

                    {/* ==================================================
                        GROUPED LGUs
                    ================================================== */}

                    <div className="space-y-6">

                        {groups.map((group) => (
                            <Card
                                key={group.lgu_id}
                                className="overflow-hidden"
                            >

                                {/* LGU HEADER */}

                                <div className="border-b bg-muted/30 px-6 py-5">

                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                                        <div>
                                            <h2 className="text-lg font-semibold">
                                                {group.lgu_name}
                                            </h2>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {group.discrepancy_count}{' '}
                                                {group.discrepancy_count === 1
                                                    ? 'indicator'
                                                    : 'indicators'}{' '}
                                                with discrepancies
                                            </p>
                                        </div>

                                        <Badge className="w-fit gap-1 border-0 bg-red-100 text-red-700 hover:bg-red-100">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            {group.discrepancy_count}{' '}
                                            Discrepancies
                                        </Badge>

                                    </div>
                                </div>

                                {/* TABLE */}

                                <div className="overflow-x-auto">

                                    <table className="w-full text-sm">

                                        <thead>
                                            <tr className="border-b bg-muted/20">

                                                <th className="min-w-[260px] px-5 py-3 text-left font-semibold">
                                                    Indicator
                                                </th>

                                                <th className="min-w-[230px] px-5 py-3 text-right font-semibold">
                                                    LGU Report

                                                    <div className="mt-1 grid grid-cols-3 gap-3 text-[10px] font-normal text-muted-foreground">
                                                        <span>Male</span>
                                                        <span>Female</span>
                                                        <span>Total</span>
                                                    </div>
                                                </th>

                                                <th className="min-w-[230px] px-5 py-3 text-right font-semibold">
                                                    FHSIS

                                                    <div className="mt-1 grid grid-cols-3 gap-3 text-[10px] font-normal text-muted-foreground">
                                                        <span>Male</span>
                                                        <span>Female</span>
                                                        <span>Total</span>
                                                    </div>
                                                </th>

                                                <th className="min-w-[230px] px-5 py-3 text-right font-semibold">
                                                    Difference

                                                    <div className="mt-1 grid grid-cols-3 gap-3 text-[10px] font-normal text-muted-foreground">
                                                        <span>M</span>
                                                        <span>F</span>
                                                        <span>T</span>
                                                    </div>
                                                </th>

                                            </tr>
                                        </thead>

                                        <tbody>

                                            {group.rows.map(
                                                (row) => (
                                                    <tr
                                                        key={`${row.lgu_id}-${row.indicator_id}`}
                                                        className="border-b bg-red-50/30 last:border-0 dark:bg-red-950/10"
                                                    >

                                                        {/* INDICATOR */}

                                                        <td className="px-5 py-4">

                                                            <div className="font-medium">
                                                                {row.indicator_name}
                                                            </div>

                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                {row.indicator_code}
                                                            </div>

                                                        </td>

                                                        {/* LGU */}

                                                        <td className="px-5 py-4">
                                                            <div className="grid grid-cols-3 gap-3 text-right">
                                                                <span>
                                                                    {formatNumber(
                                                                        row.lgu.male,
                                                                    )}
                                                                </span>

                                                                <span>
                                                                    {formatNumber(
                                                                        row.lgu.female,
                                                                    )}
                                                                </span>

                                                                <span className="font-semibold">
                                                                    {formatNumber(
                                                                        row.lgu.total,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* FHSIS */}

                                                        <td className="px-5 py-4">
                                                            <div className="grid grid-cols-3 gap-3 text-right">
                                                                <span>
                                                                    {formatNumber(
                                                                        row.fhsis.male,
                                                                    )}
                                                                </span>

                                                                <span>
                                                                    {formatNumber(
                                                                        row.fhsis.female,
                                                                    )}
                                                                </span>

                                                                <span className="font-semibold">
                                                                    {formatNumber(
                                                                        row.fhsis.total,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* DIFFERENCE */}

                                                        <td className="px-5 py-4">

                                                            <div className="grid grid-cols-3 gap-3 text-right font-semibold text-red-600">

                                                                <span>
                                                                    {formatNumber(
                                                                        row.difference.male,
                                                                    )}
                                                                </span>

                                                                <span>
                                                                    {formatNumber(
                                                                        row.difference.female,
                                                                    )}
                                                                </span>

                                                                <span>
                                                                    {formatNumber(
                                                                        row.difference.total,
                                                                    )}
                                                                </span>

                                                            </div>

                                                        </td>

                                                    </tr>
                                                ),
                                            )}

                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ))}

                    </div>

                    {/* ==================================================
                        REPORT FOOTER
                    ================================================== */}

                    <div className="mt-8 border-t pt-5 text-xs text-muted-foreground">

                        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">

                            <span>
                                FHSIS vs LGU Reconciliation Report
                            </span>

                            <span>
                                Reporting Period:{' '}
                                {year}
                                {quarter
                                    ? ` — ${quarter.code}`
                                    : ''}
                            </span>

                        </div>
                    </div>

                </main>
            </div>
        </>
    )
}