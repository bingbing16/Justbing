import { router } from '@inertiajs/react'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface Quarter {
    id: number
    code: string
    name: string
    sort_order: number
    is_active: boolean
    reporting_periods_count: number
}

export const columns: ColumnDef<Quarter>[] = [
    {
        accessorKey: 'sort_order',
        header: 'Order',
        cell: ({ row }) => (
            <div className="text-center font-medium">
                {row.original.sort_order}
            </div>
        ),
    },

    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => (
            <code className="rounded bg-muted px-2 py-1 text-xs">
                {row.original.code}
            </code>
        ),
    },

    {
        accessorKey: 'name',
        header: 'Quarter',
        cell: ({ row }) => (
            <div className="font-medium">
                {row.original.name}
            </div>
        ),
    },

    {
        id: 'reporting_periods',
        accessorFn: (row) =>
            row.reporting_periods_count,
        header: 'Reporting Periods',
        cell: ({ row }) => (
            <div className="text-center">
                {row.original.reporting_periods_count}
            </div>
        ),
    },

    {
        id: 'status',
        accessorFn: (row) =>
            row.is_active ? 'Active' : 'Inactive',
        header: 'Status',
        cell: ({ row }) => {
            const quarter = row.original

            return (
                <button
                    type="button"
                    onClick={() =>
                        router.patch(
                            `/quarters/${quarter.id}/status`,
                            {
                                is_active:
                                    !quarter.is_active,
                            },
                            {
                                preserveScroll: true,
                            }
                        )
                    }
                >
                    <Badge
                        variant="secondary"
                        className={
                            quarter.is_active
                                ? 'bg-green-100 text-green-600 hover:bg-green-100'
                                : 'bg-red-100 text-red-500 hover:bg-red-100'
                        }
                    >
                        {quarter.is_active
                            ? 'Active'
                            : 'Inactive'}
                    </Badge>
                </button>
            )
        },
    },

    {
        id: 'actions',
        enableSorting: false,
        enableColumnFilter: false,
        header: 'Actions',
        cell: ({ row }) => (
            <Button
                variant="outline"
                size="sm"
                asChild
            >
                <a
                    href={`/quarters/${row.original.id}/edit`}
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </a>
            </Button>
        ),
    },
]