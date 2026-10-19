import { router } from '@inertiajs/react'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface Indicator {
    id: number
    report_section_id: number
    code: string
    name: string
    display_order: number
    is_active: boolean

    section: {
        id: number
        report_type_id: number
        name: string
        code: string

        report_type: {
            id: number
            code: string
            name: string
        }
    }
}

export const columns: ColumnDef<Indicator>[] = [
    {
        id: 'report_type',
        accessorFn: (row) => row.section.report_type.name,
        header: 'Report Type',
        enableHiding: true,
        cell: ({ row }) => (
            <div>
                <div className="font-medium">
                    {row.original.section.report_type.name}
                </div>

                {/* <div className="text-xs text-muted-foreground">
                    {row.original.section.report_type.code}
                </div> */}
            </div>
        ),
    },

    {
        id: 'section',
        accessorFn: (row) => row.section.name,
        header: 'Section',
        enableHiding: true,
        cell: ({ row }) => (
            <div>
                <div className="font-medium">
                    {row.original.section.name}
                </div>

                {/* <div className="text-xs text-muted-foreground">
                    {row.original.section.code}
                </div> */}
            </div>
        ),
    },

    // {
    //     accessorKey: 'code',
    //     header: 'Indicator Code',
    //     cell: ({ row }) => (
    //         <code className="rounded bg-muted px-2 py-1 text-xs">
    //             {row.original.code}
    //         </code>
    //     ),
    // },

    {
        accessorKey: 'name',
        header: 'Indicator',
        enableHiding: true,
        cell: ({ row }) => (
            <div className="max-w-md">
                {row.original.name}
            </div>
        ),
    },

    {
        accessorKey: 'display_order',
        header: 'Order',
        enableHiding: true,
        cell: ({ row }) => (
            <div className="text-center">
                {row.original.display_order}
            </div>
        ),
    },

    {
        id: 'status',
        accessorFn: (row) =>
            row.is_active ? 'Active' : 'Inactive',
        header: 'Status',
        enableHiding: true,
        cell: ({ row }) => {
            const indicator = row.original

            return (
                <button
                    type="button"
                    onClick={() =>
                        router.patch(
                            `/indicators/${indicator.id}/status`,
                            {
                                is_active:
                                    !indicator.is_active,
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
                            indicator.is_active
                                ? 'bg-green-100 text-green-600 hover:bg-green-100'
                                : 'bg-red-100 text-red-500 hover:bg-red-100'
                        }
                    >
                        {indicator.is_active
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
        enableHiding: false,
        header: 'Actions',
        cell: ({ row }) => (
            <Button
                variant="outline"
                size="sm"
                asChild
            >
                <a
                    href={`/indicators/${row.original.id}/edit`}
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </a>
            </Button>
        ),
    },
]