import { Link, router } from '@inertiajs/react'
import { ArrowUpDown, Pencil } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'

export interface ReportSection {
    id: number
    report_type_id: number
    parent_id: number | null
    code: string
    name: string
    description: string | null
    display_order: number
    is_active: boolean
    indicators_count: number
    report_type: {
        id: number
        code: string
        name: string
    }
    parent: {
        id: number
        name: string
    } | null
}

export const columns: ColumnDef<ReportSection>[] = [
    {
        accessorKey: 'report_type.name',
        id: 'report_type',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(
                        column.getIsSorted() === 'asc'
                    )
                }
            >
                Report Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div>
                <div className="font-medium truncate">
                    {row.original.report_type.name}
                </div>

                {/* <div className="text-xs text-muted-foreground">
                    {row.original.report_type.code}
                </div> */}
            </div>
        ),
    },

    {
        accessorKey: 'name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(
                        column.getIsSorted() === 'asc'
                    )
                }
            >
                Section
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className='max-w-[400px]'>
                <div className="font-medium truncate">
                    {row.original.name}
                </div>

                {/* <div className="text-xs text-muted-foreground">
                    {row.original.code}
                </div> */}
            </div>
        ),
    },

    {
        id: 'parent',
        header: 'Parent Section',
        cell: ({ row }) =>
            row.original.parent?.name ?? (
                <span className="text-muted-foreground max-w-[400px] truncate">
                    Top Level
                </span>
            ),
    },

    {
        accessorKey: 'display_order',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(
                        column.getIsSorted() === 'asc'
                    )
                }
            >
                Order
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },

    {
        accessorKey: 'indicators_count',
        header: 'Indicators',
    },

    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
            const section = row.original

            return (
                <button
                    type="button"
                    onClick={() =>
                        router.patch(
                            `/report-sections/${section.id}/status`,
                            {
                                is_active:
                                    !section.is_active,
                            },
                            {
                                preserveScroll: true,
                            }
                        )
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                        section.is_active
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-500'
                    }`}
                >
                    {section.is_active
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
        enableColumnFilter: false,
        cell: ({ row }) => (
            <Button
                variant="outline"
                size="sm"
                asChild
            >
                <Link
                    href={`/report-sections/${row.original.id}/edit`}
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </Link>
            </Button>
        ),
    },
]