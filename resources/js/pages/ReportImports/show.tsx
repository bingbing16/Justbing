import { Head, Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'

import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'

interface User {
    id: number
    name: string
}

interface Lgu {
    id: number
    name: string
}

interface ReportType {
    id: number
    code: string
    name: string
}

interface ReportingPeriod {
    id: number
    year: number
    quarter: {
        id: number
        code: string
        name: string
    }
}

interface Change {
    id: number
    indicator_id: number
    indicator_code: string
    indicator_name: string

    old_male: number | null
    old_female: number | null
    old_total: number | null

    new_male: number | null
    new_female: number | null
    new_total: number | null

    status: string
    reason: string | null
}

interface ImportQuarter {
    id: number
    quarter_code: string
    status: string
    reason: string | null
    reporting_period: ReportingPeriod | null
    changes: Change[]
}

interface ReportImport {
    id: number
    user: User | null
    lgu: Lgu
    report_type: ReportType
    year: number
    file_name: string
    file_extension: string | null
    file_size: number | null

    new_quarters_count: number
    updated_quarters_count: number
    unchanged_quarters_count: number
    blocked_quarters_count: number
    changed_indicators_count: number
    blocked_changes_count: number

    created_at: string
    quarters: ImportQuarter[]
}

interface Props {
    import: ReportImport
}

function formatDate(date: string): string {
    return new Date(date).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

function formatValue(value: number | null): string {
    if (value === null || value === undefined) {
        return '—'
    }

    return Number(value).toLocaleString()
}

function statusClass(status: string): string {
    switch (status) {
        case 'new':
            return 'bg-green-100 text-green-700'

        case 'updated':
            return 'bg-blue-100 text-blue-700'

        case 'unchanged':
            return 'bg-gray-100 text-gray-700'

        case 'blocked':
            return 'bg-red-100 text-red-700'

        case 'changed':
            return 'bg-blue-100 text-blue-700'

        default:
            return 'bg-gray-100 text-gray-700'
    }
}

export default function Show({ import: reportImport }: Props) {
    return (
        <>
            <Head title={`Import Audit #${reportImport.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/report-imports">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>

                    <div>
                        <h1 className="text-2xl font-semibold">
                            Import Audit #{reportImport.id}
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Detailed history of this report import.
                        </p>
                    </div>
                </div>

                {/* Import information */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Imported By
                        </p>

                        <p className="mt-1 font-medium">
                            {reportImport.user?.name ?? 'Unknown'}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            LGU
                        </p>

                        <p className="mt-1 font-medium">
                            {reportImport.lgu.name}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Report
                        </p>

                        <p className="mt-1 font-medium">
                            {reportImport.report_type.code} —{' '}
                            {reportImport.year}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">
                            Imported At
                        </p>

                        <p className="mt-1 font-medium">
                            {formatDate(reportImport.created_at)}
                        </p>
                    </div>
                </div>

                {/* File */}
                <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        Source File
                    </p>

                    <p className="mt-1 font-medium">
                        {reportImport.file_name}
                    </p>

                    {reportImport.file_extension && (
                        <p className="text-xs text-muted-foreground">
                            .{reportImport.file_extension}
                        </p>
                    )}
                </div>

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                    <SummaryCard
                        label="New Quarters"
                        value={reportImport.new_quarters_count}
                    />

                    <SummaryCard
                        label="Updated Quarters"
                        value={reportImport.updated_quarters_count}
                    />

                    <SummaryCard
                        label="Unchanged"
                        value={reportImport.unchanged_quarters_count}
                    />

                    <SummaryCard
                        label="Blocked Quarters"
                        value={reportImport.blocked_quarters_count}
                    />

                    <SummaryCard
                        label="Changed Indicators"
                        value={reportImport.changed_indicators_count}
                    />

                    <SummaryCard
                        label="Blocked Changes"
                        value={reportImport.blocked_changes_count}
                    />
                </div>

                {/* Quarter details */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">
                        Quarter Details
                    </h2>

                    {reportImport.quarters.map((quarter) => (
                        <div
                            key={quarter.id}
                            className="rounded-xl border bg-card"
                        >
                            <div className="flex items-center justify-between border-b p-5">
                                <div>
                                    <h3 className="font-semibold">
                                        {quarter.quarter_code}
                                    </h3>

                                    {quarter.reporting_period && (
                                        <p className="text-sm text-muted-foreground">
                                            {
                                                quarter.reporting_period
                                                    .year
                                            }{' '}
                                            —{' '}
                                            {
                                                quarter.reporting_period
                                                    .quarter.name
                                            }
                                        </p>
                                    )}
                                </div>

                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass(
                                        quarter.status
                                    )}`}
                                >
                                    {quarter.status}
                                </span>
                            </div>

                            {quarter.reason && (
                                <div className="border-b bg-red-50 px-5 py-3 text-sm text-red-700">
                                    <strong>Reason:</strong>{' '}
                                    {quarter.reason}
                                </div>
                            )}

                            {quarter.changes.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left">
                                                    Indicator
                                                </th>

                                                <th className="px-4 py-3 text-center">
                                                    Old M
                                                </th>

                                                <th className="px-4 py-3 text-center">
                                                    New M
                                                </th>

                                                <th className="px-4 py-3 text-center">
                                                    Old F
                                                </th>

                                                <th className="px-4 py-3 text-center">
                                                    New F
                                                </th>

                                                <th className="px-4 py-3 text-center">
                                                    Old Total
                                                </th>

                                                <th className="px-4 py-3 text-center">
                                                    New Total
                                                </th>

                                                <th className="px-4 py-3 text-center">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {quarter.changes.map(
                                                (change) => (
                                                    <tr
                                                        key={change.id}
                                                        className="border-b last:border-0"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium">
                                                                {
                                                                    change.indicator_name
                                                                }
                                                            </div>

                                                            <div className="text-xs text-muted-foreground">
                                                                {
                                                                    change.indicator_code
                                                                }
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-3 text-center">
                                                            {formatValue(
                                                                change.old_male
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 text-center font-medium">
                                                            {formatValue(
                                                                change.new_male
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 text-center">
                                                            {formatValue(
                                                                change.old_female
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 text-center font-medium">
                                                            {formatValue(
                                                                change.new_female
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 text-center">
                                                            {formatValue(
                                                                change.old_total
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 text-center font-medium">
                                                            {formatValue(
                                                                change.new_total
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 text-center">
                                                            <span
                                                                className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusClass(
                                                                    change.status
                                                                )}`}
                                                            >
                                                                {
                                                                    change.status
                                                                }
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-5 text-sm text-muted-foreground">
                                    No indicator changes recorded for this
                                    quarter.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

function SummaryCard({
    label,
    value,
}: {
    label: string
    value: number
}) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 text-2xl font-semibold">
                {value}
            </p>
        </div>
    )
}