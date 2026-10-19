import { Link, router } from '@inertiajs/react'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Power } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { Lgu } from './index'

export const columns: ColumnDef<Lgu>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(
                        column.getIsSorted() === 'asc',
                    )
                }
            >
                LGU
                <span>
                    {column.getIsSorted() === 'asc'
                        ? '↑'
                        : column.getIsSorted() === 'desc'
                        ? '↓'
                        : '↕'}
                </span>
            </Button>
        ),
        cell: ({ row }) => (
            <div className="font-medium max-w-[400px] truncate">
                {row.original.name}
            </div>
        ),
    },

    {
        accessorKey: 'code',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(
                        column.getIsSorted() === 'asc',
                    )
                }
            >
                Code
                <span>
                    {column.getIsSorted() === 'asc'
                        ? '↑'
                        : column.getIsSorted() === 'desc'
                        ? '↓'
                        : '↕'}
                </span>
            </Button>
        ),
        cell: ({ row }) => (
            <span className='max-w-[400px] truncate'>{row.original.code || '—'}</span>
        ),
    },

    {
        accessorKey: 'province',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(
                        column.getIsSorted() === 'asc',
                    )
                }
            >
                Province
                <span className='max-w-[400px] truncate'>
                    {column.getIsSorted() === 'asc'
                        ? '↑'
                        : column.getIsSorted() === 'desc'
                        ? '↓'
                        : '↕'}
                </span>
            </Button>
        ),
        cell: ({ row }) => (
            <span className='max-w-[400px] truncate'>{row.original.province || '—'}</span>
        ),
    },

    {
        accessorKey: 'municipality',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(
                        column.getIsSorted() === 'asc',
                    )
                }
            >
                Municipality
                <span>
                    {column.getIsSorted() === 'asc'
                        ? '↑'
                        : column.getIsSorted() === 'desc'
                        ? '↓'
                        : '↕'}
                </span>
            </Button>
        ),
        cell: ({ row }) => (
            <span className='max-w-[400px] truncate'>{row.original.municipality || '—'}</span>
        ),
    },

    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
            const active = row.original.is_active

            return (
                <span
                    className={
                        active
                            ? 'rounded-md bg-green-100 px-2 py-1 text-xs text-green-600'
                            : 'rounded-md bg-red-100 px-2 py-1 text-xs text-red-500'
                    }
                >
                    {active ? 'Active' : 'Inactive'}
                </span>
            )
        },
    },

    {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
            const lgu = row.original

            const toggleStatus = () => {
                router.patch(
                    `/lgus/${lgu.id}/status`,
                    {
                        is_active: !lgu.is_active,
                    },
                    {
                        preserveScroll: true,
                    },
                )
            }

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                        >
                            <span className="sr-only">
                                Open menu
                            </span>

                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/lgus/${lgu.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={toggleStatus}
                        >
                            <Power className="mr-2 h-4 w-4" />

                            {lgu.is_active
                                ? 'Deactivate'
                                : 'Activate'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]