import { Head, Link, usePage } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/report-type-data-table'

import {
    columns,
    type ReportType,
} from './columns'

interface Props {
    reportTypes: ReportType[]
}

// interface PageProps {
//     flash: {
//         success?: string
//         error?: string
//     }
// }

export default function Index({
    reportTypes,
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
            <Head title="Report Types" />

            <div className="space-y-6 p-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Report Types
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Manage the types of reports used by the system.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/report-types/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Report Type
                        </Link>
                    </Button>
                </div>

                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <DataTable
                        columns={columns}
                        data={reportTypes}
                    />
                </div>

            </div>
        </>
    )
}