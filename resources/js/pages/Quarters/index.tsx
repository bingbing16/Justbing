import { Head, Link, usePage } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/quarter-data-table'

import {
    columns,
    type Quarter,
} from './columns'

interface Props {
    quarters: Quarter[]
}

// interface PageProps {
//     flash: {
//         success?: string
//         error?: string
//     }
// }

export default function Index({
    quarters,
}: Props) {
    // const { flash } =
    //     usePage<PageProps>().props

    // useEffect(() => {
    //     if (flash.success) {
    //         toast.success(flash.success)
    //     }

    //     if (flash.error) {
    //         toast.error(flash.error)
    //     }
    // }, [flash])

    return (
        <>
            <Head title="Quarters" />

            <div className="space-y-6 p-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Quarters
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Manage reporting quarters used by the system.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/quarters/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Quarter
                        </Link>
                    </Button>
                </div>

                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <DataTable
                        columns={columns}
                        data={quarters}
                    />
                </div>

            </div>
        </>
    )
}