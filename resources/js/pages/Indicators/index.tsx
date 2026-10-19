import { Head, Link, usePage } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/indicator-data-table'

import {
    columns,
    type Indicator,
} from './columns'

interface Section {
    id: number
    code: string
    name: string
}

interface Props {
    indicators: Indicator[]
    sections: Section[]
}

// interface PageProps {
//     flash: {
//         success?: string
//         error?: string
//     }
// }

export default function Index({
    indicators,
    sections,
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
            <Head title="Indicators" />

            <div className="space-y-6 p-6">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Indicators
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Manage indicators used by LGU reporting forms.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/indicators/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Indicator
                        </Link>
                    </Button>
                </div>

                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <DataTable
                        columns={columns}
                        data={indicators}
                        sections={sections}
                    />
                </div>

            </div>
        </>
    )
}