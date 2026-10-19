import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Lgu {
    id: number;
    name: string;
}

interface ReportType {
    id: number
    code: string
    name: string
    slug: string
}

interface Quarter {
    id: number;
    code: string;
    name: string;
}

interface ReportingPeriod {
    id: number;
    year: number;
    quarter: Quarter;
}

interface Indicator {
    id: number;
    // code: string;
    name: string;
    display_order: number;
}

interface Section {
    id: number;
    code: string;
    name: string;
    indicators: Indicator[];
    children: Section[];
}

interface Props {
    lgus: Lgu[];
    reportingPeriods: ReportingPeriod[];
    quarters: Quarter[];
    sections: Section[];
    reportType: ReportType
    existingSubmissions: ExistingSubmission[];
}



interface ReportValue {
    indicator_id: number;
    male: string;
    female: string;
}

interface ExistingSubmission {
    id: number;
    lgu_id: number;
    reporting_period_id: number;
}

export default function CreateHWPSC({
    reportType,
    sections,
    lgus,
    reportingPeriods,
    quarters,
    existingSubmissions,
}: Props) {

    const [selectedYear, setSelectedYear] = useState('');
    const [selectedQuarter, setSelectedQuarter] = useState('');


    const START_YEAR = 2020;
    const FUTURE_YEARS = 5;

    const currentYear = new Date().getFullYear();

    const years = useMemo(() => {
        const endYear = currentYear + FUTURE_YEARS;

        return Array.from(
            { length: endYear - START_YEAR + 1 },
            (_, index) => endYear - index
        );
    }, [currentYear]);


    const selectedReportingPeriod = useMemo(() => {
        if (!selectedYear || !selectedQuarter) {
            return null;
        }

        return (
            reportingPeriods.find(
                (period) =>
                    period.year === Number(selectedYear) &&
                    period.quarter.code === selectedQuarter
            ) ?? null
        );
    }, [
        reportingPeriods,
        selectedYear,
        selectedQuarter,
    ]);

    const allIndicators = useMemo(() => {

        const indicators: Indicator[] = [];

        sections.forEach((section) => {

            section.indicators?.forEach((indicator) => {
                indicators.push(indicator);
            });

            section.children?.forEach((child) => {

                child.indicators?.forEach((indicator) => {
                    indicators.push(indicator);
                });

            });

        });

        return indicators;

    }, [sections]);

    const initialValues: ReportValue[] = allIndicators.map(
        (indicator) => ({
            indicator_id: indicator.id,
            male: '',
            female: '',
        })
    );

    const { data, setData, post, processing, errors } = useForm<{
        lgu_id: string;
        reporting_period_id: string;
        values: ReportValue[];
    }>
    ({
        lgu_id: '',
        reporting_period_id: '',
        values: initialValues,
    });

    const existingSubmission = existingSubmissions.find(
        (submission) =>
            submission.lgu_id === Number(data.lgu_id) &&
            submission.reporting_period_id === Number(data.reporting_period_id)
    );

    const updateValue = (
        indicatorId: number,
        field: 'male' | 'female',
        value: string
    ) => {

        setData(
            'values',
            data.values.map((item) =>
                item.indicator_id === indicatorId
                    ? {
                        ...item,
                        [field]: value,
                    }
                    : item
            )
        );
    };

    const getValue = (
        indicatorId: number,
        field: 'male' | 'female'
    ) => {

        return (
            data.values.find(
                (item) => item.indicator_id === indicatorId
            )?.[field] ?? ''
        );
    };

    const getTotal = (indicatorId: number) => {

        const value = data.values.find(
            (item) => item.indicator_id === indicatorId
        );

        const male = Number(value?.male || 0);
        const female = Number(value?.female || 0);

        return male + female;
    };

    const submit = (event: FormEvent) => {
        event.preventDefault()

        post(`/justine/reports/${reportType.slug}`)
    }

    return (
        <>
            <Head title={`${reportType.name} Quarterly Report`} />

            <div className="bg-gray-100 p-6">

                <div className="mx-auto">

                    {/* Header */}
                    <div className="mb-6">

                        <h1 className="text-2xl font-bold text-gray-900">
                            {reportType.name} Quarterly Report
                        </h1>

                        <p className="mt-1 text-sm text-gray-600">
                            LGU Quarterly Reporting Form
                        </p>

                    </div>

                    {/* Report Information */}
                    {/* <div className="mb-6 rounded-lg bg-white p-6 shadow">

                        <h2 className="mb-4 text-lg font-semibold">
                            Report Information
                        </h2>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2"> */}

                            {/* LGU */}
                            {/* <div className="grid gap-2">
                                <Label htmlFor="lgu">
                                    LGU <span className="text-red-500">*</span>
                                </Label>

                                <Select
                                    value={data.lgu_id}
                                    onValueChange={(value) => {
                                        setData('lgu_id', value);
                                    }}
                                >
                                    <SelectTrigger id="lgu" className="w-full md:w-[300px]">
                                        <SelectValue placeholder="Select LGU" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {lgus.map((lgu) => (
                                            <SelectItem
                                                key={lgu.id}
                                                value={String(lgu.id)}
                                            >
                                                {lgu.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {errors.lgu_id && (
                                    <p className="text-sm text-red-600">
                                        {errors.lgu_id}
                                    </p>
                                )}
                            </div> */}

                            {/* Reporting Period */}
                            {/* <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Reporting Period
                                </label>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2"> */}
                                    {/* Year */}
                                    {/* <div className="grid gap-2">
                                        <Label htmlFor="year">
                                            Year <span className="text-red-500">*</span>
                                        </Label>

                                        <Select
                                            value={selectedYear}
                                            onValueChange={(value) => {
                                                setSelectedYear(value);
                                                setSelectedQuarter('');
                                                setData('reporting_period_id', '');
                                            }}
                                        >
                                            <SelectTrigger id="year">
                                                <SelectValue placeholder="Select Year" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {years.map((year) => (
                                                    <SelectItem key={year} value={String(year)}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div> */}

                                    {/* Quarter */}
                                    {/* <div className="grid gap-2">
                                        <Label htmlFor="quarter">
                                            Quarter <span className="text-red-500">*</span>
                                        </Label>

                                        <Select
                                            value={selectedQuarter}
                                            disabled={!selectedYear}
                                            onValueChange={async (quarterCode) => {
                                                setSelectedQuarter(quarterCode);

                                                const quarter = quarters.find(
                                                    (quarter) => quarter.code === quarterCode
                                                );

                                                if (!quarter || !selectedYear) {
                                                    setData('reporting_period_id', '');
                                                    return;
                                                }

                                                const existingPeriod = reportingPeriods.find(
                                                    (period) =>
                                                        period.year === Number(selectedYear) &&
                                                        period.quarter.id === quarter.id
                                                );

                                                if (existingPeriod) {
                                                    setData(
                                                        'reporting_period_id',
                                                        String(existingPeriod.id)
                                                    );

                                                    return;
                                                }

                                                try {
                                                    const response = await fetch(
                                                        '/justine/reports/hwpsc/ensure-reporting-period',
                                                        {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'X-CSRF-TOKEN':
                                                                    document
                                                                        .querySelector(
                                                                            'meta[name="csrf-token"]'
                                                                        )
                                                                        ?.getAttribute('content') ?? '',
                                                                Accept: 'application/json',
                                                            },
                                                            body: JSON.stringify({
                                                                year: Number(selectedYear),
                                                                quarter_id: quarter.id,
                                                            }),
                                                        }
                                                    );

                                                    if (!response.ok) {
                                                        throw new Error(
                                                            'Failed to create reporting period.'
                                                        );
                                                    }

                                                    const period = await response.json();

                                                    setData(
                                                        'reporting_period_id',
                                                        String(period.id)
                                                    );
                                                } catch (error) {
                                                    console.error(error);
                                                    setData('reporting_period_id', '');
                                                }
                                            }}
                                        >
                                            <SelectTrigger id="quarter">
                                                <SelectValue placeholder="Select Quarter" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {quarters.map((quarter) => (
                                                    <SelectItem
                                                        key={quarter.id}
                                                        value={quarter.code}
                                                    >
                                                        {quarter.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {errors.reporting_period_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.reporting_period_id}
                                    </p>
                                )} */}

                                {/* Selected period
                                {selectedReportingPeriod && (
                                    <p className="mt-2 text-sm text-gray-500">
                                        Selected:{' '}
                                        <span className="font-medium text-gray-700">
                                            {selectedReportingPeriod.year} -{' '}
                                            {selectedReportingPeriod.quarter.name}
                                        </span>
                                    </p>
                                )}
                            </div>

                            {existingSubmission && (
                                <div className="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                                    <p className="font-semibold text-yellow-800">
                                        Report already exists
                                    </p>

                                    <p className="mt-1 text-sm text-yellow-700">
                                        A HWPSC report already exists for this LGU and reporting
                                        period. Creating another report would create a duplicate.
                                    </p>

                                    <Link
                                        href={`/justine/reports/hwpsc/${existingSubmission.id}/edit`}
                                        className="mt-3 inline-block rounded bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                                    >
                                        Edit Existing Report
                                    </Link>
                                </div>
                            )}

                        </div>

                    </div> */}

                    {/* Report Information */}
                    <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                        {/* Section Header */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Report Information
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Provide the LGU and reporting period for this report.
                            </p>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* LGU */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="lgu"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    LGU <span className="text-red-500">*</span>
                                </Label>

                                <Select
                                    value={data.lgu_id}
                                    onValueChange={(value) => {
                                        setData('lgu_id', value);
                                    }}
                                >
                                    <SelectTrigger
                                        id="lgu"
                                        className="h-10 w-full bg-white"
                                    >
                                        <SelectValue placeholder="Select LGU" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {lgus.map((lgu) => (
                                            <SelectItem
                                                key={lgu.id}
                                                value={String(lgu.id)}
                                            >
                                                {lgu.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {errors.lgu_id && (
                                    <p className="text-sm font-medium text-red-600">
                                        {errors.lgu_id}
                                    </p>
                                )}
                            </div>

                            {/* Reporting Period */}
                            <div className="space-y-2">
                                {/* <Label className="text-sm font-medium text-gray-700">
                                    Reporting Period
                                </Label> */}

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {/* Year */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="year"
                                            className="text-xs font-medium text-gray-500"
                                        >
                                            Year <span className="text-red-500">*</span>
                                        </Label>

                                        <Select
                                            value={selectedYear}
                                            onValueChange={(value) => {
                                                setSelectedYear(value);
                                                setSelectedQuarter('');
                                                setData('reporting_period_id', '');
                                            }}
                                        >
                                            <SelectTrigger
                                                id="year"
                                                className="h-10 w-full bg-white"
                                            >
                                                <SelectValue placeholder="Select year" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {years.map((year) => (
                                                    <SelectItem
                                                        key={year}
                                                        value={String(year)}
                                                    >
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Quarter */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="quarter"
                                            className="text-xs font-medium text-gray-500"
                                        >
                                            Quarter <span className="text-red-500">*</span>
                                        </Label>

                                        <Select
                                            value={selectedQuarter}
                                            disabled={!selectedYear}
                                            onValueChange={async (quarterCode) => {
                                                setSelectedQuarter(quarterCode);

                                                const quarter = quarters.find(
                                                    (quarter) =>
                                                        quarter.code === quarterCode
                                                );

                                                if (!quarter || !selectedYear) {
                                                    setData(
                                                        'reporting_period_id',
                                                        ''
                                                    );
                                                    return;
                                                }

                                                const existingPeriod =
                                                    reportingPeriods.find(
                                                        (period) =>
                                                            period.year ===
                                                                Number(selectedYear) &&
                                                            period.quarter.id ===
                                                                quarter.id
                                                    );

                                                if (existingPeriod) {
                                                    setData(
                                                        'reporting_period_id',
                                                        String(existingPeriod.id)
                                                    );

                                                    return;
                                                }

                                                try {
                                                    const response = await fetch(
                                                        '/justine/reports/hwpsc/ensure-reporting-period',
                                                        {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type':
                                                                    'application/json',
                                                                'X-CSRF-TOKEN':
                                                                    document
                                                                        .querySelector(
                                                                            'meta[name="csrf-token"]'
                                                                        )
                                                                        ?.getAttribute(
                                                                            'content'
                                                                        ) ?? '',
                                                                Accept:
                                                                    'application/json',
                                                            },
                                                            body: JSON.stringify({
                                                                year: Number(
                                                                    selectedYear
                                                                ),
                                                                quarter_id:
                                                                    quarter.id,
                                                            }),
                                                        }
                                                    );

                                                    if (!response.ok) {
                                                        throw new Error(
                                                            'Failed to create reporting period.'
                                                        );
                                                    }

                                                    const period =
                                                        await response.json();

                                                    setData(
                                                        'reporting_period_id',
                                                        String(period.id)
                                                    );
                                                } catch (error) {
                                                    console.error(error);

                                                    setData(
                                                        'reporting_period_id',
                                                        ''
                                                    );
                                                }
                                            }}
                                        >
                                            <SelectTrigger
                                                id="quarter"
                                                className="h-10 w-full bg-white disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <SelectValue placeholder="Select quarter" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {quarters.map((quarter) => (
                                                    <SelectItem
                                                        key={quarter.id}
                                                        value={quarter.code}
                                                    >
                                                        {quarter.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {!selectedYear && (
                                    <p className="text-xs text-gray-400">
                                        Select a year first to choose a quarter.
                                    </p>
                                )}

                                {errors.reporting_period_id && (
                                    <p className="text-sm font-medium text-red-600">
                                        {errors.reporting_period_id}
                                    </p>
                                )}

                                {/* Selected Period */}
                                {selectedReportingPeriod && (
                                    <div className="mt-3 flex items-center rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                                                Selected Period
                                            </p>

                                            <p className="mt-0.5 text-sm font-semibold text-gray-900">
                                                {selectedReportingPeriod.year} —{' '}
                                                {selectedReportingPeriod.quarter.name}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Existing Submission Warning */}
                        {existingSubmission && (
                            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-semibold text-amber-800">
                                            Report already exists
                                        </p>

                                        <p className="mt-1 text-sm leading-5 text-amber-700">
                                            A {reportType.name} report already exists for this LGU
                                            and reporting period. Creating another report
                                            would create a duplicate.
                                        </p>
                                    </div>

                                    <Link
                                        href={`/justine/reports/${reportType.slug}/${existingSubmission.id}/edit`}
                                        className="inline-flex shrink-0 items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                                    >
                                        Edit Existing Report
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Indicators */}
                    <form onSubmit={submit}>

                        <div className="mb-6 overflow-hidden rounded-lg bg-white shadow">

                            <div className="overflow-x-auto">

                                <table className="min-w-full border-collapse">

                                    <thead className="bg-gray-800 text-white">

                                        <tr>

                                            <th className="border px-4 py-3 text-left">
                                                Indicator
                                            </th>

                                            <th className="w-40 border px-4 py-3 text-center">
                                                Male
                                            </th>

                                            <th className="w-40 border px-4 py-3 text-center">
                                                Female
                                            </th>

                                            <th className="w-40 border px-4 py-3 text-center">
                                                Total
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {sections.map((section) => (

                                            <SectionRows
                                                key={section.id}
                                                section={section}
                                                getValue={getValue}
                                                getTotal={getTotal}
                                                updateValue={updateValue}
                                            />

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        </div>

                        {/* Actions */}
                        {/* <div className="mt-6 flex justify-end gap-3">

                            <button
                                type="button"
                                className="rounded-md border bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={processing || !!existingSubmission}
                                className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Report'}
                            </button>

                        </div> */}

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                asChild
                            >
                                <Link href="/justine/reports/hwpsc/">
                                    Cancel
                                </Link>
                            </Button>

                            <Button
                                type="submit"
                                disabled={processing || !!existingSubmission}
                            >
                                {processing ? 'Saving...' : 'Save Report'}
                            </Button>
                        </div>

                    </form>

                </div>

            </div>
        </>
    );
}


function SectionRows({
    section,
    getValue,
    getTotal,
    updateValue,
}: {
    section: Section;
    getValue: (
        indicatorId: number,
        field: 'male' | 'female'
    ) => string;
    getTotal: (indicatorId: number) => number;
    updateValue: (
        indicatorId: number,
        field: 'male' | 'female',
        value: string
    ) => void;
}) {

    return (
        <>
            {/* Section Header */}
            <tr className="bg-gray-100">

                <td
                    colSpan={4}
                    className="border px-4 py-3 font-semibold text-gray-800"
                >
                    {section.name}
                </td>

            </tr>

            {/* Direct indicators */}
            {section.indicators?.map((indicator) => (

                <IndicatorRow
                    key={indicator.id}
                    indicator={indicator}
                    getValue={getValue}
                    getTotal={getTotal}
                    updateValue={updateValue}
                />

            ))}

            {/* Child sections */}
            {section.children?.map((child) => (

                <SectionRows
                    key={child.id}
                    section={child}
                    getValue={getValue}
                    getTotal={getTotal}
                    updateValue={updateValue}
                />

            ))}

        </>
    );
}


function IndicatorRow({
    indicator,
    getValue,
    getTotal,
    updateValue,
}: {
    indicator: Indicator;
    getValue: (
        indicatorId: number,
        field: 'male' | 'female'
    ) => string;
    getTotal: (indicatorId: number) => number;
    updateValue: (
        indicatorId: number,
        field: 'male' | 'female',
        value: string
    ) => void;
}) {

    return (
        <tr className="hover:bg-gray-50">

            <td className="border px-4 py-3">

                <div className="text-sm text-gray-800">
                    {indicator.name}
                </div>

                {/* <div className="mt-1 text-xs text-gray-400">
                    {indicator.code}
                </div> */}

            </td>

            <td className="border px-3 py-2">

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={getValue(
                        indicator.id,
                        'male'
                    )}
                    onChange={(e) =>
                        updateValue(
                            indicator.id,
                            'male',
                            e.target.value
                        )
                    }
                    className="w-full rounded-md border-gray-300 text-right"
                />

            </td>

            <td className="border px-3 py-2">

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={getValue(
                        indicator.id,
                        'female'
                    )}
                    onChange={(e) =>
                        updateValue(
                            indicator.id,
                            'female',
                            e.target.value
                        )
                    }
                    className="w-full rounded-md border-gray-300 text-right"
                />

            </td>

            <td className="border bg-gray-50 px-4 py-3 text-right font-medium">

                {getTotal(indicator.id).toFixed(2)}

            </td>

        </tr>
    );
}