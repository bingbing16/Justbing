import { Head, Link, usePage } from '@inertiajs/react'
import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/report-period-data-table'
import { columns, type ReportingPeriod } from './columns'

interface Props {
    reportingPeriods: ReportingPeriod[]
}

// interface PageProps {
//     flash: {
//         success?: string
//         error?: string
//     }
// }

export default function ReportingPeriodsIndex({
    reportingPeriods,
}: Props) {
    // const { flash } = usePage<PageProps>().props

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
            <Head title="Reporting Periods" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Reporting Periods
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Manage reporting years, quarters, and
                            reporting date ranges.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/reporting-periods/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New Reporting Period
                        </Link>
                    </Button>
                </div>

                {/* Table */}
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <DataTable
                        columns={columns}
                        data={reportingPeriods}
                    />
                </div>
            </div>
        </>
    )
}