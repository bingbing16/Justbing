import { Head, Link, useForm } from '@inertiajs/react'
import { FormEvent, useEffect } from 'react'
import { ArrowLeft, CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface Quarter {
    id: number
    code: string
    name: string
    sort_order: number
}

interface Props {
    quarters: Quarter[]
}

export default function ReportingPeriodsCreate({
    quarters,
}: Props) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        year: new Date().getFullYear().toString(),
        quarter_id: '',
        start_date: '',
        end_date: '',
        is_active: true,
    })

    useEffect(() => {
        if (!data.year || !data.quarter_id) {
            return
        }

        const quarter = quarters.find(
            (item) =>
                String(item.id) === data.quarter_id
        )

        if (!quarter) {
            return
        }

        const year = Number(data.year)

        const dates: Record<
            number,
            { start: string; end: string }
        > = {
            1: {
                start: `${year}-01-01`,
                end: `${year}-03-31`,
            },
            2: {
                start: `${year}-04-01`,
                end: `${year}-06-30`,
            },
            3: {
                start: `${year}-07-01`,
                end: `${year}-09-30`,
            },
            4: {
                start: `${year}-10-01`,
                end: `${year}-12-31`,
            },
        }

        const dateRange =
            dates[quarter.sort_order]

        if (!dateRange) {
            return
        }

        setData((current) => ({
            ...current,
            start_date: dateRange.start,
            end_date: dateRange.end,
        }))
    }, [
        data.year,
        data.quarter_id,
        quarters,
    ])

    const submit = (e: FormEvent) => {
        e.preventDefault()

        post('/reporting-periods')
    }

    return (
        <>
            <Head title="Create Reporting Period" />

            <div className="mx-auto max-w-5xl space-y-6 p-6">
                {/* Page Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        asChild
                    >
                        <Link href="/reporting-periods">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>

                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Create Reporting Period
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Configure a reporting year, quarter,
                            and date range.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div className="rounded-xl border bg-white shadow-sm">
                        {/* Card Header */}
                        <div className="border-b px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                    <CalendarDays className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        Reporting Period
                                    </h2>

                                    <p className="text-sm text-gray-500">
                                        Select the year, quarter,
                                        and official reporting dates.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                            {/* Year */}
                            <div className="grid gap-2">
                                <Label htmlFor="year">
                                    Year
                                </Label>

                                <Input
                                    id="year"
                                    type="number"
                                    min={2000}
                                    max={2100}
                                    value={data.year}
                                    onChange={(e) =>
                                        setData(
                                            'year',
                                            e.target.value
                                        )
                                    }
                                />

                                {errors.year && (
                                    <p className="text-sm text-red-500">
                                        {errors.year}
                                    </p>
                                )}
                            </div>

                            {/* Quarter */}
                            <div className="grid gap-2">
                                <Label htmlFor="quarter">
                                    Quarter
                                </Label>

                                <Select
                                    value={data.quarter_id}
                                    onValueChange={(value) =>
                                        setData(
                                            'quarter_id',
                                            value
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="quarter"
                                        className="h-11 bg-white"
                                    >
                                        <SelectValue placeholder="Select quarter" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {quarters.map(
                                            (quarter) => (
                                                <SelectItem
                                                    key={
                                                        quarter.id
                                                    }
                                                    value={String(
                                                        quarter.id
                                                    )}
                                                >
                                                    {quarter.code} —{' '}
                                                    {quarter.name}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>

                                {errors.quarter_id && (
                                    <p className="text-sm text-red-500">
                                        {errors.quarter_id}
                                    </p>
                                )}
                            </div>

                            {/* Start Date */}
                            <div className="grid gap-2">
                                <Label htmlFor="start_date">
                                    Start Date
                                </Label>

                                <Input
                                    id="start_date"
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) =>
                                        setData(
                                            'start_date',
                                            e.target.value
                                        )
                                    }
                                />

                                {errors.start_date && (
                                    <p className="text-sm text-red-500">
                                        {errors.start_date}
                                    </p>
                                )}
                            </div>

                            {/* End Date */}
                            <div className="grid gap-2">
                                <Label htmlFor="end_date">
                                    End Date
                                </Label>

                                <Input
                                    id="end_date"
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) =>
                                        setData(
                                            'end_date',
                                            e.target.value
                                        )
                                    }
                                />

                                {errors.end_date && (
                                    <p className="text-sm text-red-500">
                                        {errors.end_date}
                                    </p>
                                )}
                            </div>

                            {/* Active */}
                            <div className="md:col-span-2">
                                <div className="rounded-lg border bg-gray-50 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">
                                                Reporting Period Status
                                            </p>

                                            <p className="text-sm text-muted-foreground">
                                                Inactive periods will
                                                not be available for
                                                report submission.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData(
                                                    'is_active',
                                                    !data.is_active
                                                )
                                            }
                                            className={
                                                data.is_active
                                                    ? 'relative h-6 w-11 rounded-full bg-blue-600 transition'
                                                    : 'relative h-6 w-11 rounded-full bg-gray-300 transition'
                                            }
                                        >
                                            <span
                                                className={
                                                    data.is_active
                                                        ? 'absolute left-6 top-1 h-4 w-4 rounded-full bg-white transition'
                                                        : 'absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition'
                                                }
                                            />
                                        </button>
                                    </div>
                                </div>

                                {errors.is_active && (
                                    <p className="mt-2 text-sm text-red-500">
                                        {errors.is_active}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Review the reporting period before saving.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                asChild
                            >
                                <Link href="/reporting-periods">
                                    Cancel
                                </Link>
                            </Button>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="min-w-[130px]"
                            >
                                {processing
                                    ? 'Saving...'
                                    : 'Save Period'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    )
}