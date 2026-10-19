import { Head, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'

import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    FileBarChart,
    Filter,
    Search,
    SlidersHorizontal,
    Users,
    XCircle,
    FileWarning,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type Quarter = {
    id: number
    code: string
    name: string
}

type Lgu = {
    id: number
    name: string
}

type ComparisonValue = {
    male: number | null
    female: number | null
    total: number | null
}

type ComparisonRow = {
    lgu_id: number
    lgu_name: string
    indicator_id: number
    indicator_code: string
    indicator_name: string

    lgu: ComparisonValue
    fhsis: ComparisonValue
    difference: ComparisonValue

    status: 'match' | 'discrepancy' | 'not_comparable'
}

type Summary = {
    total: number
    matching: number
    discrepancies: number
    not_comparable: number
}

type ReportType = {
    id: number
    code: string
    name: string
    slug: string
}

type Props = {
    reportType: ReportType

    years: number[]
    quarters: Quarter[]
    lgus: Lgu[]

    filters: {
        year: number
        quarter_id: number
        lgu_id?: number | null
    }

    summary: Summary
    rows: ComparisonRow[]
}

export default function Comparison({
    reportType,
    years = [],
    quarters = [],
    lgus = [],
    filters,
    summary,
    rows = [],
}: Props) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const reportBaseUrl = `/justine/fhsis/${reportType.slug}`

    const pageSize = 12

    /*
    |--------------------------------------------------------------------------
    | Filters
    |--------------------------------------------------------------------------
    */

    const selectedYear = filters.year?.toString() ?? ''
    const selectedQuarter = filters.quarter_id?.toString() ?? ''
    const selectedLgu = filters.lgu_id
        ? filters.lgu_id.toString()
        : 'all'

    const applyFilters = (
        year: string = selectedYear,
        quarter: string = selectedQuarter,
        lgu: string = selectedLgu,
    ) => {
        router.get(
            `${reportBaseUrl}/comparison`,
            {
                year,
                quarter_id: quarter,
                lgu_id: lgu === 'all' ? undefined : lgu,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        )

        setCurrentPage(1)
    }

    /*
    |--------------------------------------------------------------------------
    | Client-side search / status filter
    |--------------------------------------------------------------------------
    */

    const filteredRows = useMemo(() => {
        const keyword = search.trim().toLowerCase()

        return rows.filter((row) => {
            const matchesSearch =
                !keyword ||
                row.lgu_name.toLowerCase().includes(keyword) ||
                row.indicator_name.toLowerCase().includes(keyword) ||
                row.indicator_code.toLowerCase().includes(keyword)

            const matchesStatus =
                statusFilter === 'all' ||
                row.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [rows, search, statusFilter])

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const totalPages = Math.max(
        1,
        Math.ceil(filteredRows.length / pageSize),
    )

    const safePage = Math.min(currentPage, totalPages)

    const paginatedRows = filteredRows.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize,
    )

    const startRow =
        filteredRows.length === 0
            ? 0
            : (safePage - 1) * pageSize + 1

    const endRow = Math.min(
        safePage * pageSize,
        filteredRows.length,
    )

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    const formatNumber = (value: number | null) => {
        if (value === null || value === undefined) {
            return '—'
        }

        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 2,
        }).format(Number(value))
    }

    const valueSet = (value: ComparisonValue) => (
        <div className="grid grid-cols-3 gap-3 text-right">
            <span>{formatNumber(value.male)}</span>
            <span>{formatNumber(value.female)}</span>
            <span className="font-semibold">
                {formatNumber(value.total)}
            </span>
        </div>
    )

    const differenceClass = (value: number | null) => {
        if (value === null || value === undefined) {
            return 'text-muted-foreground'
        }

        if (Number(value) === 0) {
            return 'text-emerald-600'
        }

        return 'font-semibold text-red-600'
    }

    const statusBadge = (status: ComparisonRow['status']) => {
        if (status === 'match') {
            return (
                <Badge className="gap-1 border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Match
                </Badge>
            )
        }

        if (status === 'discrepancy') {
            return (
                <Badge className="gap-1 border-0 bg-red-100 text-red-700 hover:bg-red-100">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Discrepancy
                </Badge>
            )
        }

        return (
            <Badge
                variant="secondary"
                className="gap-1 text-muted-foreground"
            >
                <CircleAlert className="h-3.5 w-3.5" />
                Not Comparable
            </Badge>
        )
    }

    const selectedQuarterObject = quarters.find(
        (quarter) =>
            quarter.id.toString() === selectedQuarter,
    )

    return (
        <>
            <Head title="FHSIS vs LGU Comparison" />

            <div className="flex flex-col gap-6 p-6">

                {/* ======================================================
                    HEADER
                ======================================================= */}

                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearch('')
                            setStatusFilter('all')
                            setCurrentPage(1)
                        }}
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Reset Filters
                    </Button>

                    <Button
                        variant="destructive"
                        disabled={summary.discrepancies === 0}
                        onClick={() => {
                            const params = new URLSearchParams()

                            params.set('year', String(filters.year))
                            params.set(
                                'quarter_id',
                                String(filters.quarter_id),
                            )

                            if (filters.lgu_id) {
                                params.set(
                                    'lgu_id',
                                    String(filters.lgu_id),
                                )
                            }

                            window.location.href =
                                `${reportBaseUrl}/discrepancy-report?${params.toString()}`
                        }}
                    >
                        <FileWarning className="mr-2 h-4 w-4" />

                        Discrepancy Report

                        {summary.discrepancies > 0 && (
                            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                                {summary.discrepancies}
                            </span>
                        )}
                    </Button>
                </div>

                {/* ======================================================
                    FILTERS
                ======================================================= */}

                <Card>
                    <CardContent className="p-5">

                        <div className="mb-4 flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />

                            <h2 className="text-sm font-semibold">
                                Comparison Filters
                            </h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">

                            {/* YEAR */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Reporting Year
                                </label>

                                <Select
                                    value={selectedYear}
                                    onValueChange={(value) =>
                                        applyFilters(
                                            value,
                                            selectedQuarter,
                                            selectedLgu,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {years.map((year) => (
                                            <SelectItem
                                                key={year}
                                                value={year.toString()}
                                            >
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* QUARTER */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Reporting Quarter
                                </label>

                                <Select
                                    value={selectedQuarter}
                                    onValueChange={(value) =>
                                        applyFilters(
                                            selectedYear,
                                            value,
                                            selectedLgu,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select quarter" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {quarters.map((quarter) => (
                                            <SelectItem
                                                key={quarter.id}
                                                value={quarter.id.toString()}
                                            >
                                                {quarter.code} —{' '}
                                                {quarter.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* LGU */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    LGU
                                </label>

                                <Select
                                    value={selectedLgu}
                                    onValueChange={(value) =>
                                        applyFilters(
                                            selectedYear,
                                            selectedQuarter,
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All LGUs" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">
                                            All LGUs
                                        </SelectItem>

                                        {lgus.map((lgu) => (
                                            <SelectItem
                                                key={lgu.id}
                                                value={lgu.id.toString()}
                                            >
                                                {lgu.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ======================================================
                    PERIOD CONTEXT
                ======================================================= */}

                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>Comparing:</span>

                    <Badge variant="secondary">
                        {reportType.name}
                    </Badge>

                    <Badge variant="secondary">
                        {filters.year}
                    </Badge>

                    {selectedQuarterObject && (
                        <Badge variant="secondary">
                            {selectedQuarterObject.code}
                        </Badge>
                    )}

                    <span>
                        Approved LGU report vs imported FHSIS snapshot
                    </span>
                </div>

                {/* ======================================================
                    SUMMARY CARDS
                ======================================================= */}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                    {/* TOTAL */}
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total Compared
                                    </p>

                                    <p className="mt-2 text-3xl font-semibold">
                                        {summary.total}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        LGU × indicator comparisons
                                    </p>
                                </div>

                                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* MATCHING */}
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Matching
                                    </p>

                                    <p className="mt-2 text-3xl font-semibold text-emerald-600">
                                        {summary.matching}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        No differences detected
                                    </p>
                                </div>

                                <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* DISCREPANCIES */}
                    <Card className="border-red-200">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Discrepancies
                                    </p>

                                    <p className="mt-2 text-3xl font-semibold text-red-600">
                                        {summary.discrepancies}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Values do not match
                                    </p>
                                </div>

                                <div className="rounded-lg bg-red-50 p-2.5 text-red-600">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* NOT COMPARABLE */}
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Not Comparable
                                    </p>

                                    <p className="mt-2 text-3xl font-semibold text-muted-foreground">
                                        {summary.not_comparable}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Missing source data
                                    </p>
                                </div>

                                <div className="rounded-lg bg-muted p-2.5 text-muted-foreground">
                                    <XCircle className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ======================================================
                    DISCREPANCY NOTICE
                ======================================================= */}

                {summary.discrepancies > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 dark:border-red-900 dark:bg-red-950/20">

                        <div className="flex gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                            <div>
                                <p className="font-medium text-red-700 dark:text-red-400">
                                    Discrepancies require review
                                </p>

                                <p className="mt-1 text-sm text-red-600/90 dark:text-red-400/90">
                                    {summary.discrepancies} comparison
                                    {summary.discrepancies !== 1
                                        ? 's'
                                        : ''}{' '}
                                    contain values that differ between
                                    the approved LGU report and FHSIS.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======================================================
                    RESULTS
                ======================================================= */}

                <Card>
                    <CardContent className="p-0">

                        {/* TABLE HEADER */}
                        <div className="border-b p-5">

                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                                <div>
                                    <h2 className="text-base font-semibold">
                                        Comparison Results
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Review male, female, total and
                                        difference values for each indicator.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">

                                    {/* SEARCH */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                        <Input
                                            value={search}
                                            onChange={(event) => {
                                                setSearch(
                                                    event.target.value,
                                                )
                                                setCurrentPage(1)
                                            }}
                                            placeholder="Search LGU or indicator..."
                                            className="w-full pl-9 sm:w-[280px]"
                                        />
                                    </div>

                                    {/* STATUS */}
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(value) => {
                                            setStatusFilter(value)
                                            setCurrentPage(1)
                                        }}
                                    >
                                        <SelectTrigger className="w-full sm:w-[170px]">
                                            <SelectValue />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Status
                                            </SelectItem>

                                            <SelectItem value="match">
                                                Matching
                                            </SelectItem>

                                            <SelectItem value="discrepancy">
                                                Discrepancies
                                            </SelectItem>

                                            <SelectItem value="not_comparable">
                                                Not Comparable
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* ==================================================
                            TABLE
                        =================================================== */}

                        <div className="overflow-x-auto">

                            <table className="w-full text-sm">

                                <thead>
                                    <tr className="border-b bg-muted/40">

                                        <th className="min-w-[150px] px-5 py-3 text-left font-semibold">
                                            LGU
                                        </th>

                                        <th className="min-w-[260px] px-5 py-3 text-left font-semibold">
                                            Indicator
                                        </th>

                                        <th className="min-w-[240px] px-5 py-3 text-right font-semibold">
                                            <div>
                                                LGU Report
                                            </div>

                                            <div className="mt-1 grid grid-cols-3 gap-3 text-[10px] font-normal text-muted-foreground">
                                                <span>Male</span>
                                                <span>Female</span>
                                                <span>Total</span>
                                            </div>
                                        </th>

                                        <th className="min-w-[240px] px-5 py-3 text-right font-semibold">
                                            <div>
                                                FHSIS
                                            </div>

                                            <div className="mt-1 grid grid-cols-3 gap-3 text-[10px] font-normal text-muted-foreground">
                                                <span>Male</span>
                                                <span>Female</span>
                                                <span>Total</span>
                                            </div>
                                        </th>

                                        <th className="min-w-[240px] px-5 py-3 text-right font-semibold">
                                            <div>
                                                Difference
                                            </div>

                                            <div className="mt-1 grid grid-cols-3 gap-3 text-[10px] font-normal text-muted-foreground">
                                                <span>M</span>
                                                <span>F</span>
                                                <span>T</span>
                                            </div>
                                        </th>

                                        <th className="px-5 py-3 text-left font-semibold">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {paginatedRows.map((row) => (
                                        <tr
                                            key={`${row.lgu_id}-${row.indicator_id}`}
                                            className={`border-b transition-colors hover:bg-muted/30 ${
                                                row.status === 'discrepancy'
                                                    ? 'bg-red-50/30 dark:bg-red-950/10'
                                                    : ''
                                            }`}
                                        >

                                            {/* LGU */}
                                            <td className="px-5 py-4">
                                                <div className="font-medium">
                                                    {row.lgu_name}
                                                </div>
                                            </td>

                                            {/* INDICATOR */}
                                            <td className="px-5 py-4">
                                                <div className="font-medium">
                                                    {row.indicator_name}
                                                </div>

                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {row.indicator_code}
                                                </div>
                                            </td>

                                            {/* LGU */}
                                            <td className="px-5 py-4">
                                                {valueSet(row.lgu)}
                                            </td>

                                            {/* FHSIS */}
                                            <td className="px-5 py-4">
                                                {valueSet(row.fhsis)}
                                            </td>

                                            {/* DIFFERENCE */}
                                            <td className="px-5 py-4">
                                                <div className="grid grid-cols-3 gap-3 text-right">

                                                    <span
                                                        className={differenceClass(
                                                            row.difference.male,
                                                        )}
                                                    >
                                                        {formatNumber(
                                                            row.difference.male,
                                                        )}
                                                    </span>

                                                    <span
                                                        className={differenceClass(
                                                            row.difference.female,
                                                        )}
                                                    >
                                                        {formatNumber(
                                                            row.difference.female,
                                                        )}
                                                    </span>

                                                    <span
                                                        className={differenceClass(
                                                            row.difference.total,
                                                        )}
                                                    >
                                                        {formatNumber(
                                                            row.difference.total,
                                                        )}
                                                    </span>

                                                </div>
                                            </td>

                                            {/* STATUS */}
                                            <td className="px-5 py-4">
                                                {statusBadge(row.status)}
                                            </td>

                                        </tr>
                                    ))}

                                    {paginatedRows.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-5 py-16 text-center"
                                            >
                                                <div className="flex flex-col items-center">

                                                    <FileBarChart className="h-10 w-10 text-muted-foreground/40" />

                                                    <p className="mt-3 font-medium">
                                                        No comparison results
                                                    </p>

                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        Try changing the
                                                        reporting period,
                                                        LGU, or filters.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                </tbody>
                            </table>
                        </div>

                        {/* ==================================================
                            PAGINATION
                        =================================================== */}

                        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">

                            <div className="text-xs text-muted-foreground">
                                Showing{' '}
                                <span className="font-medium text-foreground">
                                    {startRow}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium text-foreground">
                                    {endRow}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium text-foreground">
                                    {filteredRows.length}
                                </span>{' '}
                                comparisons
                            </div>

                            <div className="flex items-center gap-1">

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={safePage === 1}
                                    onClick={() =>
                                        setCurrentPage((page) =>
                                            Math.max(1, page - 1),
                                        )
                                    }
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {Array.from(
                                    {
                                        length: totalPages,
                                    },
                                    (_, index) => index + 1,
                                ).map((page) => (
                                    <Button
                                        key={page}
                                        variant={
                                            safePage === page
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                            setCurrentPage(page)
                                        }
                                    >
                                        {page}
                                    </Button>
                                ))}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={
                                        safePage === totalPages
                                    }
                                    onClick={() =>
                                        setCurrentPage((page) =>
                                            Math.min(
                                                totalPages,
                                                page + 1,
                                            ),
                                        )
                                    }
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}