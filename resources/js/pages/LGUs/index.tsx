import { Head, Link } from '@inertiajs/react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-tables'

import { columns } from './columns'

export interface Lgu {
    id: number
    name: string
    code: string | null
    province: string | null
    municipality: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

interface Props {
    lgus: Lgu[]
}

export default function Index({ lgus }: Props) {
    return (
        <>
            <Head title="LGUs" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            LGUs
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Manage Local Government Units.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/lgus/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add LGU
                        </Link>
                    </Button>
                </div>

                {/* DataTable */}
                <DataTable
                    columns={columns}
                    data={lgus}
                />
            </div>
        </>
    )
}