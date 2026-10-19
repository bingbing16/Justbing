import { Head, Link } from '@inertiajs/react'
import {
    ArrowRight,
    FileSpreadsheet,
    Plus,
    Settings2,
} from 'lucide-react'

import AppLayout from '@/layouts/app-layout'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

import { DataTable } from '@/components/report-import-mapping-data-table'

import {
    columns,
    type ReportImportMapping,
} from './columns'

interface Props {
    mappings: ReportImportMapping[]
}

export default function Index({
    mappings,
}: Props) {

    /*
    |--------------------------------------------------------------------------
    | Group mappings by report type
    |--------------------------------------------------------------------------
    */

    const groupedMappings = mappings.reduce<
        Record<
            string,
            {
                id: number
                code: string
                name: string
                mappings: ReportImportMapping[]
            }
        >
    >((groups, mapping) => {

        const reportType = mapping.report_type

        if (!reportType) {
            return groups
        }

        if (!groups[reportType.id]) {
            groups[reportType.id] = {
                id: reportType.id,
                code: reportType.code,
                name: reportType.name,
                mappings: [],
            }
        }

        groups[reportType.id].mappings.push(mapping)

        return groups

    }, {})

    const reportTypeGroups = Object.values(groupedMappings)

    return (
        <>
            <Head title="Report Import Mappings" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">

                {/* =========================================================
                    PAGE HEADER
                ========================================================== */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <div className="flex items-center gap-2">

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FileSpreadsheet className="h-5 w-5 text-primary" />
                            </div>

                            <div>

                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Report Import Mappings
                                </h1>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Configure how imported report fields are
                                    matched with system indicators.
                                </p>

                            </div>

                        </div>

                    </div>


                    <Button asChild>

                        <Link href="/report-import-mappings/create">

                            <Plus className="mr-2 h-4 w-4" />

                            New Mapping

                        </Link>

                    </Button>

                </div>


                {/* =========================================================
                    INFORMATION CARD
                ========================================================== */}

                <Card>

                    <CardContent className="p-5">

                        <div className="flex items-start gap-3">

                            <div className="rounded-lg bg-muted p-2">

                                <Settings2 className="h-5 w-5 text-muted-foreground" />

                            </div>

                            <div>

                                <p className="font-medium">
                                    Import Mapping Configuration
                                </p>

                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    Import mappings determine which fields
                                    from uploaded reports correspond to the
                                    indicators used by the system. Each report
                                    type has its own mapping configuration.
                                </p>

                            </div>

                        </div>

                    </CardContent>

                </Card>


                {/* =========================================================
                    REPORT TYPE SECTIONS
                ========================================================== */}

                {reportTypeGroups.length > 0 ? (

                    <div className="space-y-6">

                        {reportTypeGroups.map((group) => (

                            <Card
                                key={group.id}
                                className="overflow-hidden"
                            >

                                {/* =================================================
                                    REPORT TYPE HEADER
                                ================================================== */}

                                <CardHeader className="border-b bg-muted/30">

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                        <div>

                                            <div className="flex items-center gap-2">

                                                <CardTitle className="text-lg">
                                                    {group.name}
                                                </CardTitle>

                                                <Badge variant="outline">
                                                    {group.code}
                                                </Badge>

                                            </div>

                                            <CardDescription className="mt-1">
                                                Import mappings configured for
                                                this report type.
                                            </CardDescription>

                                        </div>


                                        {/* Mapping Count */}

                                        <div className="flex items-center gap-2">

                                            <Badge variant="secondary">

                                                {group.mappings.length}

                                                {' '}

                                                {group.mappings.length === 1
                                                    ? 'Mapping'
                                                    : 'Mappings'}

                                            </Badge>

                                        </div>

                                    </div>

                                </CardHeader>


                                {/* =================================================
                                    MAPPING TABLE
                                ================================================== */}

                                <CardContent className="p-0">

                                    <DataTable
                                        columns={columns}
                                        data={group.mappings}
                                    />

                                </CardContent>

                            </Card>

                        ))}

                    </div>

                ) : (

                    /* =========================================================
                       EMPTY STATE
                    ========================================================== */

                    <Card>

                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">

                            <div className="rounded-full bg-muted p-4">

                                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />

                            </div>

                            <h2 className="mt-4 text-lg font-semibold">
                                No import mappings found
                            </h2>

                            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                No report import mappings have been configured
                                yet. Create a mapping to connect imported report
                                fields with system indicators.
                            </p>

                            <Button
                                asChild
                                className="mt-5"
                            >

                                <Link href="/report-import-mappings/create">

                                    <Plus className="mr-2 h-4 w-4" />

                                    Create First Mapping

                                </Link>

                            </Button>

                        </CardContent>

                    </Card>

                )}

            </div>
        </>
    )
}