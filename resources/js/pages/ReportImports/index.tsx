import { Head, Link } from '@inertiajs/react'
import { Eye } from 'lucide-react'

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
    quarters_count: number
    created_at: string
}

interface Props {
    imports: ReportImport[]
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) {
        return '-'
    }

    if (bytes < 1024) {
        return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: string): string {
    return new Date(date).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

export default function Index({ imports }: Props) {
    return (
        <>
            <Head title="Import Audit Trail" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Import Audit Trail
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        View the history and changes made by report imports.
                    </p>
                </div>

                <div className="rounded-xl border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Date / Time
                                    </th>

                                    <th className="px-4 py-3 text-left">
                                        Imported By
                                    </th>

                                    <th className="px-4 py-3 text-left">
                                        LGU
                                    </th>

                                    <th className="px-4 py-3 text-left">
                                        Report
                                    </th>

                                    <th className="px-4 py-3 text-left">
                                        Year
                                    </th>

                                    <th className="px-4 py-3 text-left">
                                        File
                                    </th>

                                    <th className="px-4 py-3 text-center">
                                        New
                                    </th>

                                    <th className="px-4 py-3 text-center">
                                        Updated
                                    </th>

                                    <th className="px-4 py-3 text-center">
                                        Blocked
                                    </th>

                                    <th className="px-4 py-3 text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {imports.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="px-4 py-12 text-center text-muted-foreground"
                                        >
                                            No import history found.
                                        </td>
                                    </tr>
                                ) : (
                                    imports.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b last:border-0 hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3">
                                                {formatDate(
                                                    item.created_at
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                {item.user?.name ?? 'Unknown'}
                                            </td>

                                            <td className="px-4 py-3 font-medium">
                                                {item.lgu.name}
                                            </td>

                                            <td className="px-4 py-3">
                                                {item.report_type.code}
                                            </td>

                                            <td className="px-4 py-3">
                                                {item.year}
                                            </td>

                                            <td className="max-w-[220px] px-4 py-3">
                                                <div className="truncate font-medium">
                                                    {item.file_name}
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    {formatFileSize(
                                                        item.file_size
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                                    {
                                                        item.new_quarters_count
                                                    }
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                                    {
                                                        item.updated_quarters_count
                                                    }
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                                                    {
                                                        item.blocked_changes_count
                                                    }
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/report-imports/${item.id}`}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    )
}