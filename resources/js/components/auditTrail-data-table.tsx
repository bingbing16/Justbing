import * as React from 'react'

import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

import { Input } from '@/components/ui/input'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import { Button } from '@/components/ui/button'

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    years?: number[]
    quarters?: {
        id: number
        code: string
        name: string
    }[]
    statuses?: {
        id: number
        code: string
        name: string
    }[]
}

export function DataTable<TData, TValue>({
    columns,
    data,
    years,
    quarters,
    statuses,
}: DataTableProps<TData, TValue>) {

    const [sorting, setSorting] =
        React.useState<SortingState>([])

    const [globalFilter, setGlobalFilter] =
        React.useState('')

    const [columnFilters, setColumnFilters] =
        React.useState<any[]>([])

    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})

    const table = useReactTable({
        data,
        columns,

        state: {
            sorting,
            globalFilter,
            columnFilters,
            columnVisibility,
        },

        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,

        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),

        globalFilterFn: 'includesString',
    })

    return (
        <div className="space-y-4">

            {/* Search + Filters */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center">

                {/* Search */}
                <Input
                    placeholder="Search LGU..."
                    value={globalFilter ?? ''}
                    onChange={(event) =>
                        setGlobalFilter(event.target.value)
                    }
                    className="w-full md:w-[300px]"
                />

                {/* Status */}
                <Select
                    value={
                        (table
                            .getColumn('status')
                            ?.getFilterValue() as string) ?? 'all'
                    }
                    onValueChange={(value) => {
                        table
                            .getColumn('status')
                            ?.setFilterValue(
                                value === 'all' ? undefined : value
                            )
                    }}
                >
                    <SelectTrigger className="w-full md:w-[160px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">
                            All Status
                        </SelectItem>

                        {statuses?.map((status) => (
                            <SelectItem
                                key={status.id}
                                value={status.code}
                            >
                                {status.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Year */}
                <Select
                    value={
                        (table
                            .getColumn('year')
                            ?.getFilterValue() as string) ?? 'all'
                    }
                    onValueChange={(value) => {
                        table
                            .getColumn('year')
                            ?.setFilterValue(
                                value === 'all' ? undefined : value
                            )
                    }}
                >
                    <SelectTrigger className="w-full md:w-[140px]">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">
                            All Years
                        </SelectItem>

                        {years?.map((year) => (
                            <SelectItem
                                key={year}
                                value={String(year)}
                            >
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Quarter */}
                <Select
                    value={
                        (table
                            .getColumn('quarter')
                            ?.getFilterValue() as string) ?? 'all'
                    }
                    onValueChange={(value) => {
                        table
                            .getColumn('quarter')
                            ?.setFilterValue(
                                value === 'all' ? undefined : value
                            )
                    }}
                >
                    <SelectTrigger className="w-full md:w-[150px]">
                        <SelectValue placeholder="Quarter" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">
                            All Quarters
                        </SelectItem>

                        {quarters?.map((quarter) => (
                            <SelectItem
                                key={quarter.id}
                                value={quarter.code}
                            >
                                {quarter.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Reset */}
                <Button
                    variant="outline"
                    onClick={() => {
                        setGlobalFilter('')
                        setColumnFilters([])
                    }}
                >
                    Reset
                </Button>

            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-md border bg-white">

                <Table>

                    <TableHeader className="bg-gray-800">

                        {table.getHeaderGroups().map(
                            (headerGroup) => (
                                <TableRow
                                    key={headerGroup.id}
                                >

                                    {headerGroup.headers.map(
                                        (header) => (
                                            <TableHead
                                                key={header.id}
                                                className="text-white"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header
                                                              .column
                                                              .columnDef
                                                              .header,
                                                          header.getContext()
                                                      )}
                                            </TableHead>
                                        )
                                    )}

                                </TableRow>
                            )
                        )}

                    </TableHeader>

                    <TableBody>

                        {table.getRowModel().rows.length ? (

                            table
                                .getRowModel()
                                .rows
                                .map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="hover:bg-gray-50"
                                    >

                                        {row
                                            .getVisibleCells()
                                            .map((cell) => (
                                                <TableCell
                                                    key={cell.id}
                                                >
                                                    {flexRender(
                                                        cell
                                                            .column
                                                            .columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}

                                    </TableRow>
                                ))

                        ) : (

                            <TableRow>

                                <TableCell
                                    colSpan={
                                        columns.length
                                    }
                                    className="h-24 text-center text-gray-500"
                                >
                                    No HWPSC reports found.
                                </TableCell>

                            </TableRow>

                        )}

                    </TableBody>

                </Table>

            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">

                <div className="text-sm text-gray-500">
                    Showing{' '}
                    {table.getRowModel().rows.length}{' '}
                    of{' '}
                    {table.getFilteredRowModel().rows.length}{' '}
                    reports
                </div>

                <div className="flex items-center gap-2">

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            table.previousPage()
                        }
                        disabled={
                            !table.getCanPreviousPage()
                        }
                    >
                        Previous
                    </Button>

                    <span className="text-sm">
                        Page{' '}
                        {table.getState().pagination.pageIndex +
                            1}{' '}
                        of{' '}
                        {table.getPageCount()}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            table.nextPage()
                        }
                        disabled={
                            !table.getCanNextPage()
                        }
                    >
                        Next
                    </Button>

                </div>

            </div>

        </div>
    )
}