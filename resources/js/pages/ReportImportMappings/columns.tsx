import { router } from '@inertiajs/react'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface ReportImportMapping {
    id: number

    report_type_id: number
    indicator_id: number

    source_label: string
    source_key: string | null

    is_active: boolean

    report_type: {
        id: number
        code: string
        name: string
    }

    indicator: {
        id: number
        report_section_id: number
        code: string
        name: string

        section: {
            id: number
            report_type_id: number
            code: string
            name: string
        }
    }
}

export const columns: ColumnDef<ReportImportMapping>[] = [
    {
        id: 'report_type',
        accessorFn: (row) => row.report_type.name,
        header: 'Report Type',

        cell: ({ row }) => (
            <div>
                <div className="font-medium">
                    {row.original.report_type.name}
                </div>

                <div className="text-xs text-muted-foreground">
                    {row.original.report_type.code}
                </div>
            </div>
        ),
    },

    {
        id: 'section',
        accessorFn: (row) =>
            row.indicator.section.name,
        header: 'Section',

        cell: ({ row }) => (
            <div className='max-w-[400px] truncate'>
                {row.original.indicator.section.name}
            </div>
        ),
    },

    // {
    //     id: 'indicator',
    //     accessorFn: (row) =>
    //         row.indicator.name,
    //     header: 'Indicator',

    //     cell: ({ row }) => (
    //         <div className="max-w-md">
    //             <div className="font-medium">
    //                 {row.original.indicator.name}
    //             </div>

    //             <div className="text-xs text-muted-foreground">
    //                 {row.original.indicator.code}
    //             </div>
    //         </div>
    //     ),
    // },

    {
        id: 'indicator',
        accessorFn: (row) => row.indicator.name,
        header: 'Indicator',

        cell: ({ row }) => (
            <div className="max-w-[400px]">
                <div
                    className="font-medium truncate"
                    title={row.original.indicator.name}
                >
                    {row.original.indicator.name}
                </div>

                {/* <div className="text-xs text-muted-foreground">
                    {row.original.indicator.code}
                </div> */}
            </div>
        ),
    },
    

    {
        accessorKey: 'source_label',
        header: 'Source Label',

        cell: ({ row }) => (
            <div className="max-w-md truncate">
                {row.original.source_label}
            </div>
        ),
    },

    {
        accessorKey: 'source_key',
        header: 'Source Key',

        cell: ({ row }) => (
            <code className="rounded bg-muted px-2 py-1 text-xs truncate">
                {row.original.source_key ?? '—'}
            </code>
        ),
    },

    {
        id: 'status',

        accessorFn: (row) =>
            row.is_active
                ? 'Active'
                : 'Inactive',

        header: 'Status',

        cell: ({ row }) => {
            const mapping = row.original

            return (
                <button
                    type="button"
                    onClick={() =>
                        router.patch(
                            `/report-import-mappings/${mapping.id}/status`,
                            {
                                is_active:
                                    !mapping.is_active,
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
                            mapping.is_active
                                ? 'bg-green-100 text-green-600 hover:bg-green-100'
                                : 'bg-red-100 text-red-500 hover:bg-red-100'
                        }
                    >
                        {mapping.is_active
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
                    href={`/report-import-mappings/${row.original.id}/edit`}
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </a>
            </Button>
        ),
    },
]