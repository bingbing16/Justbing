import { ColumnDef } from '@tanstack/react-table'
import { Link } from '@inertiajs/react'

export interface ReportImport {
    id: number
    user: {
        id: number
        name: string
    } | null
    lgu: {
        id: number
        name: string
    }
    report_type: {
        id: number
        code: string
        name: string
    }
    year: number
    file_name: string
    new_quarters_count: number
    updated_quarters_count: number
    unchanged_quarters_count: number
    blocked_quarters_count: number
    changed_indicators_count: number
    blocked_changes_count: number
    created_at: string
}

export const columns: ColumnDef<ReportImport>[] = [
    {
        accessorKey: 'user.name',
        header: 'Imported By',
        cell: ({ row }) =>
            row.original.user?.name ?? 'System',
    },

    {
        accessorKey: 'lgu.name',
        header: 'LGU',
        cell: ({ row }) =>
            row.original.lgu.name,
    },

    {
        accessorKey: 'report_type.code',
        header: 'Report',
        cell: ({ row }) =>
            row.original.report_type.code,
    },

    {
        accessorKey: 'year',
        header: 'Year',
    },

    {
        accessorKey: 'file_name',
        header: 'File',
    },

    {
        accessorKey: 'new_quarters_count',
        header: 'New',
    },

    {
        accessorKey: 'updated_quarters_count',
        header: 'Updated',
    },

    {
        accessorKey: 'unchanged_quarters_count',
        header: 'Unchanged',
    },

    {
        accessorKey: 'blocked_quarters_count',
        header: 'Blocked',
    },

    {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
            <Link
                href={`/report-imports/${row.original.id}`}
                className="text-sm font-medium hover:underline"
            >
                View
            </Link>
        ),
    },
]