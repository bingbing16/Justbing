import { router } from '@inertiajs/react'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface ReportType {
    id: number
    code: string
    name: string
    description: string | null
    is_active: boolean
    sections_count: number
}

export const columns: ColumnDef<ReportType>[] = [
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
        header: 'Report Type',
        cell: ({ row }) => (
            <div>
                <div className="font-medium">
                    {row.original.name}
                </div>

                {row.original.description && (
                    <div className="max-w-md truncate text-xs text-muted-foreground">
                        {row.original.description}
                    </div>
                )}
            </div>
        ),
    },

    {
        accessorKey: 'sections_count',
        header: 'Sections',
        cell: ({ row }) => (
            <div className="text-center">
                {row.original.sections_count}
            </div>
        ),
    },

    {
        id: 'status',
        accessorFn: (row) =>
            row.is_active ? 'Active' : 'Inactive',
        header: 'Status',
        cell: ({ row }) => {
            const reportType = row.original

            return (
                <button
                    type="button"
                    onClick={() =>
                        router.patch(
                            `/report-types/${reportType.id}/status`,
                            {
                                is_active:
                                    !reportType.is_active,
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
                            reportType.is_active
                                ? 'bg-green-100 text-green-600 hover:bg-green-100'
                                : 'bg-red-100 text-red-500 hover:bg-red-100'
                        }
                    >
                        {reportType.is_active
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
                    href={`/report-types/${row.original.id}/edit`}
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </a>
            </Button>
        ),
    },
]