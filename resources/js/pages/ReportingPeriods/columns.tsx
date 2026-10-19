import { Link, router } from '@inertiajs/react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'

export interface ReportingPeriod {
    id: number
    year: number
    quarter_id: number
    start_date: string
    end_date: string
    is_active: boolean
    submissions_count: number

    quarter: {
        id: number
        code: string
        name: string
    }
}

export const columns: ColumnDef<ReportingPeriod>[] = [
    {
        accessorKey: 'year',

        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(
                        column.getIsSorted() === 'asc'
                    )
                }
            >
                Year
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },

    {
        id: 'quarter',

        accessorFn: (row) =>
            row.quarter?.code ?? '',

        header: 'Quarter',

        cell: ({ row }) => (
            <div>
                <div className="font-medium">
                    {row.original.quarter?.code}
                </div>

                <div className="text-xs text-muted-foreground">
                    {row.original.quarter?.name}
                </div>
            </div>
        ),
    },

    {
        id: 'start_date',

        accessorFn: (row) =>
            row.start_date,

        header: 'Start Date',

        cell: ({ row }) =>
            new Date(
                row.original.start_date
            ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }),
    },

    {
        id: 'end_date',

        accessorFn: (row) =>
            row.end_date,

        header: 'End Date',

        cell: ({ row }) =>
            new Date(
                row.original.end_date
            ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }),
    },

    {
        accessorKey: 'submissions_count',

        header: 'Submissions',

        cell: ({ row }) => (
            <span className="text-sm">
                {row.original.submissions_count}
            </span>
        ),
    },

    {
        id: 'status',

        header: 'Status',

        cell: ({ row }) => {
            const reportingPeriod =
                row.original

            const toggleStatus = () => {
                router.patch(
                    `/reporting-periods/${reportingPeriod.id}/status`,
                    {
                        is_active:
                            !reportingPeriod.is_active,
                    },
                    {
                        preserveScroll: true,
                    }
                )
            }

            return (
                <button
                    type="button"
                    onClick={toggleStatus}
                    className={
                        reportingPeriod.is_active
                            ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-600 transition hover:bg-green-200'
                            : 'rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-200'
                    }
                >
                    {reportingPeriod.is_active
                        ? 'Active'
                        : 'Inactive'}
                </button>
            )
        },
    },

    {
        id: 'actions',

        header: 'Actions',

        enableSorting: false,

        cell: ({ row }) => (
            <Button
                variant="outline"
                size="sm"
                asChild
            >
                <Link
                    href={`/reporting-periods/${row.original.id}/edit`}
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </Link>
            </Button>
        ),
    },
]