import { Head, Link, router } from '@inertiajs/react';
import { Fragment, useMemo, useState } from 'react';

import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface LGU {
    id: number;
    name: string;
}

interface Quarter {
    id: number;
    code: string;
    name: string;
    sort_order: number;
}

interface Indicator {
    id: number;
    code: string;
    name: string;
}

interface Section {
    id: number;
    code: string;
    name: string;
    indicators: Indicator[];
    children: Section[];
}

interface ReportValue {
    indicator_id: number;
    male: number;
    female: number;
    total: number;
}

interface Submission {
    id: number;
    reporting_period: {
        id: number;
        year: number;
        quarter: Quarter;
    };
    status: {
        code: string;
        name: string;
    };
    values: ReportValue[];
    remarks: string | null;
}

interface ReportType {
    id: number;
    code: string;
    name: string;
    slug: string;
}

interface Props {
    reportType: ReportType;
    lgus: LGU[];
    years: number[];
    quarters: Quarter[];
    sections: Section[];
    submissions: Submission[];
    selectedLguId: number | null;
    selectedYear: number;
    statusFilter: string;
}

interface AnnualSectionProps {
    section: Section;
    quarters: Quarter[];
    getValue: (
        indicatorId: number,
        quarterId: number
    ) => ReportValue;
    submissionByQuarter: Record<number, Submission>;
    annualComplete: boolean;
}

interface AnnualIndicatorRowProps {
    indicator: Indicator;
    quarters: Quarter[];
    getValue: (
        indicatorId: number,
        quarterId: number
    ) => ReportValue;
    submissionByQuarter: Record<number, Submission>;
    annualComplete: boolean;
}

/*
|--------------------------------------------------------------------------
| Annual Section
|--------------------------------------------------------------------------
*/

function AnnualSection({
    section,
    quarters,
    getValue,
    submissionByQuarter,
    annualComplete,
}: AnnualSectionProps) {
    return (
        <>
            <tr className="bg-gray-100">
                <td
                    colSpan={quarters.length * 3 + 4}
                    className="border px-4 py-3 font-semibold"
                >
                    {section.name}
                </td>
            </tr>

            {section.indicators?.map((indicator) => (
                <AnnualIndicatorRow
                    key={indicator.id}
                    indicator={indicator}
                    quarters={quarters}
                    getValue={getValue}
                    submissionByQuarter={submissionByQuarter}
                    annualComplete={annualComplete}
                />
            ))}

            {section.children?.map((child) => (
                <AnnualSection
                    key={child.id}
                    section={child}
                    quarters={quarters}
                    getValue={getValue}
                    submissionByQuarter={submissionByQuarter}
                    annualComplete={annualComplete}
                />
            ))}
        </>
    );
}

/*
|--------------------------------------------------------------------------
| Annual Indicator Row
|--------------------------------------------------------------------------
*/

function AnnualIndicatorRow({
    indicator,
    quarters,
    getValue,
    submissionByQuarter,
    annualComplete,
}: AnnualIndicatorRowProps) {
    let annualMale = 0;
    let annualFemale = 0;
    let annualTotal = 0;

    const values = quarters.map((quarter) => {
        const submission =
            submissionByQuarter[quarter.id];

        const value = getValue(
            indicator.id,
            quarter.id
        );

        const isApproved =
            submission?.status?.code === 'approved';

        /*
         * Only approved quarterly reports
         * contribute to the official annual total.
         */
        if (isApproved) {
            annualMale += value.male;
            annualFemale += value.female;
            annualTotal += value.total;
        }

        return {
            male: value.male,
            female: value.female,
            total: value.total,
        };
    });

    return (
        <tr>
            {/* Indicator */}

            <td className="border px-4 py-3">
                <div className="text-sm">
                    {indicator.name}
                </div>
            </td>

            {/* Q1-Q4 */}

            {values.map((value, index) => {
                const quarter = quarters[index];

                return (
                    <Fragment key={quarter.id}>
                        <td className="border px-3 py-3 text-right">
                            {value.male.toFixed(2)}
                        </td>

                        <td className="border px-3 py-3 text-right">
                            {value.female.toFixed(2)}
                        </td>

                        <td className="border bg-gray-50 px-3 py-3 text-right font-medium">
                            {value.total.toFixed(2)}
                        </td>
                    </Fragment>
                );
            })}

            {/* Annual Total */}

            {annualComplete ? (
                <>
                    <td className="border bg-gray-100 px-3 py-3 text-right font-semibold">
                        {annualMale.toFixed(2)}
                    </td>

                    <td className="border bg-gray-100 px-3 py-3 text-right font-semibold">
                        {annualFemale.toFixed(2)}
                    </td>

                    <td className="border bg-gray-100 px-3 py-3 text-right font-semibold">
                        {annualTotal.toFixed(2)}
                    </td>
                </>
            ) : (
                <td
                    colSpan={3}
                    className="border bg-yellow-50 px-3 py-3 text-center font-semibold text-yellow-700"
                >
                    Incomplete
                </td>
            )}
        </tr>
    );
}

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function HWPSCAnnual({
    reportType,
    lgus,
    years,
    quarters,
    sections,
    submissions,
    selectedLguId,
    selectedYear,
    statusFilter,
}: Props) {
    const [lguId, setLguId] = useState(
        selectedLguId?.toString() ?? ''
    );

    const [year, setYear] = useState(
        selectedYear?.toString() ?? ''
    );

    const [status, setStatus] = useState(
        statusFilter || 'approved'
    );

    /*
    |--------------------------------------------------------------------------
    | Selected LGU
    |--------------------------------------------------------------------------
    */

    const selectedLgu = lgus.find(
        (lgu) => lgu.id === Number(lguId)
    );

    /*
    |--------------------------------------------------------------------------
    | Generate Report
    |--------------------------------------------------------------------------
    */

    const generateReport = () => {
        router.get(
            `/justine/reports/${reportType.slug}/annual`,
            {
                lgu_id: lguId,
                year,
                status,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Map submissions by quarter
    |--------------------------------------------------------------------------
    */

    const submissionByQuarter = useMemo(() => {
        const map: Record<number, Submission> = {};

        submissions.forEach((submission) => {
            const quarterId =
                submission.reporting_period?.quarter?.id;

            if (quarterId) {
                map[quarterId] = submission;
            }
        });

        return map;
    }, [submissions]);

    /*
    |--------------------------------------------------------------------------
    | Get indicator value
    |--------------------------------------------------------------------------
    */

    const getValue = (
        indicatorId: number,
        quarterId: number
    ): ReportValue => {
        const submission =
            submissionByQuarter[quarterId];

        const value = submission?.values?.find(
            (value) =>
                value.indicator_id === indicatorId
        );

        return {
            indicator_id: indicatorId,
            male: Number(value?.male ?? 0),
            female: Number(value?.female ?? 0),
            total: Number(value?.total ?? 0),
        };
    };

    /*
    |--------------------------------------------------------------------------
    | Annual Status
    |--------------------------------------------------------------------------
    */

    const annualStatus = useMemo(() => {
        if (!selectedLgu) {
            return null;
        }

        const approvedCount = quarters.filter(
            (quarter) =>
                submissionByQuarter[quarter.id]
                    ?.status?.code === 'approved'
        ).length;

        const rejectedCount = quarters.filter(
            (quarter) =>
                submissionByQuarter[quarter.id]
                    ?.status?.code === 'rejected'
        ).length;

        const submittedCount = quarters.filter(
            (quarter) =>
                submissionByQuarter[quarter.id]
                    ?.status?.code === 'submitted'
        ).length;

        const draftCount = quarters.filter(
            (quarter) =>
                submissionByQuarter[quarter.id]
                    ?.status?.code === 'draft'
        ).length;

        const missingCount = quarters.filter(
            (quarter) =>
                !submissionByQuarter[quarter.id]
        ).length;

        return {
            approvedCount,
            rejectedCount,
            submittedCount,
            draftCount,
            missingCount,

            /*
             * Annual report is officially complete
             * only when all 4 quarters are approved.
             */
            complete: approvedCount === quarters.length,
        };
    }, [
        quarters,
        submissionByQuarter,
        selectedLgu,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title={`${reportType.name} Annual Consolidated Report`} />

            <div className="min-h-screen bg-gray-100 p-6">
                <div className="mx-auto max-w-[1600px]">

                    {/* Header */}

                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">
                                {reportType.name} Annual Consolidated Report
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                Consolidated quarterly reports
                                for the selected LGU and year.
                            </p>
                        </div>

                        <Link
                            href={`/justine/reports/${reportType.slug}`}
                            className="rounded-md border bg-white px-4 py-2 text-sm hover:bg-gray-50"
                        >
                            Back to Reports
                        </Link>
                    </div>

                    {/* Filters */}

                    <div className="mb-6 rounded-lg bg-white p-6 shadow">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">

                            {/* LGU */}

                            <div className="grid gap-2">
                                <Label htmlFor="lgu">
                                    LGU
                                </Label>

                                <Select
                                    value={lguId}
                                    onValueChange={(value) => setLguId(value)}
                                >
                                    {/* <SelectTrigger
                                        id="lgu"
                                        className="h-11 bg-white"
                                    >
                                        <SelectValue placeholder="Select LGU" />
                                    </SelectTrigger> */}
                                    <SelectTrigger
                                        id="lgu"
                                        className="h-11 w-full bg-white"
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
                            </div>

                            {/* Year */}

                            <div className="grid gap-2">
                                <Label htmlFor="year">
                                    Year
                                </Label>

                                <Select
                                    value={year}
                                    onValueChange={(value) => setYear(value)}
                                >
                                    <SelectTrigger
                                        id="year"
                                        className="h-11 w-full bg-white"
                                    >
                                        <SelectValue placeholder="Select Year" />
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

                            {/* Status */}

                            <div className="grid gap-2">
                                <Label htmlFor="status">
                                    Quarterly Status
                                </Label>

                                <Select
                                    value={status}
                                    onValueChange={(value) => setStatus(value)}
                                >
                                    <SelectTrigger
                                        id="status"
                                        className="h-11 w-full bg-white"
                                    >
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="approved">
                                            Approved
                                        </SelectItem>

                                        <SelectItem value="rejected">
                                            Rejected
                                        </SelectItem>

                                        <SelectItem value="all">
                                            All
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Generate */}

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={generateReport}
                                    disabled={!lguId || !year}
                                    className="h-11 w-full rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Report Summary */}

                    {selectedLgu && (
                        <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">

                                <div>
                                    <p className="text-xs uppercase text-gray-500">
                                        LGU
                                    </p>

                                    <p className="font-semibold">
                                        {selectedLgu.name}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs uppercase text-gray-500">
                                        Year
                                    </p>

                                    <p className="font-semibold">
                                        {selectedYear}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs uppercase text-gray-500">
                                        Filter
                                    </p>

                                    <p className="font-semibold capitalize">
                                        {statusFilter}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs uppercase text-gray-500">
                                        Quarterly Reports
                                    </p>

                                    <p className="font-semibold">
                                        {submissions.length} /{' '}
                                        {quarters.length}
                                    </p>
                                </div>
                            </div>

                            {/* Status Counts */}

                            <div className="mt-5 border-t pt-4">
                                <p className="mb-2 text-xs uppercase text-gray-500">
                                    Quarterly Status
                                </p>

                                <div className="flex flex-wrap gap-4 text-sm">
                                    <span className="font-semibold text-green-600">
                                        Approved:{' '}
                                        {annualStatus?.approvedCount ?? 0}
                                    </span>

                                    <span className="font-semibold text-red-600">
                                        Rejected:{' '}
                                        {annualStatus?.rejectedCount ?? 0}
                                    </span>

                                    <span className="font-semibold text-blue-600">
                                        Submitted:{' '}
                                        {annualStatus?.submittedCount ?? 0}
                                    </span>

                                    <span className="font-semibold text-yellow-600">
                                        Draft:{' '}
                                        {annualStatus?.draftCount ?? 0}
                                    </span>

                                    <span className="font-semibold text-gray-500">
                                        Missing:{' '}
                                        {annualStatus?.missingCount ?? 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Annual Completion Status */}

                    {annualStatus && (
                        <div className="mb-6">
                            {annualStatus.complete ? (
                                <div className="rounded-lg border border-green-300 bg-green-50 p-4">
                                    <p className="font-semibold text-green-800">
                                        Annual Report Complete
                                    </p>

                                    <p className="mt-1 text-sm text-green-700">
                                        All four quarterly {reportType.name}
                                        reports have been approved.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                                    <p className="font-semibold text-yellow-800">
                                        Annual Report Incomplete
                                    </p>

                                    <p className="mt-1 text-sm text-yellow-700">
                                        The official annual total
                                        will be available only
                                        after all four quarterly
                                        reports are approved.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quarterly Status Cards */}

                    {selectedLgu && (
                        <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold">
                                Quarterly Report Status
                            </h2>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {quarters.map((quarter) => {
                                    const submission =
                                        submissionByQuarter[
                                            quarter.id
                                        ];

                                    const statusCode =
                                        submission?.status?.code ??
                                        'missing';

                                    const statusName =
                                        submission?.status?.name ??
                                        'Missing';

                                    return (
                                        <div
                                            key={quarter.id}
                                            className="rounded-lg border p-4"
                                        >
                                            <p className="text-sm font-medium text-gray-500">
                                                {quarter.name}
                                            </p>

                                            <p
                                                className={`mt-2 font-semibold ${
                                                    statusCode ===
                                                    'approved'
                                                        ? 'text-green-600'
                                                        : statusCode ===
                                                            'rejected'
                                                          ? 'text-red-600'
                                                          : statusCode ===
                                                              'submitted'
                                                            ? 'text-blue-600'
                                                            : statusCode ===
                                                                'draft'
                                                              ? 'text-yellow-600'
                                                              : 'text-gray-500'
                                                }`}
                                            >
                                                {statusName}
                                            </p>

                                            {submission && (
                                                <Link
                                                    href={`/justine/reports/${reportType.slug}/${submission.id}/preview`}
                                                    className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                                                >
                                                    View Report
                                                </Link>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Report Table */}

                    {selectedLgu && (
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="overflow-x-auto">
                                <table className="min-w-[1500px] w-full border-collapse">

                                    <thead className="bg-gray-800 text-white">

                                        {/* Main Header */}

                                        <tr>
                                            <th
                                                rowSpan={2}
                                                className="border px-4 py-3 text-left"
                                            >
                                                Indicator
                                            </th>

                                            {quarters.map(
                                                (quarter) => (
                                                    <th
                                                        key={quarter.id}
                                                        colSpan={3}
                                                        className="border px-4 py-3 text-center"
                                                    >
                                                        {quarter.name}
                                                    </th>
                                                )
                                            )}

                                            <th
                                                colSpan={3}
                                                className="border px-4 py-3 text-center"
                                            >
                                                Annual Total
                                            </th>
                                        </tr>

                                        {/* M / F / T */}

                                        <tr>
                                        {quarters.map((quarter) => (
                                            <Fragment key={quarter.id}>
                                                <th className="border px-3 py-2 text-right">M</th>
                                                <th className="border px-3 py-2 text-right">F</th>
                                                <th className="border px-3 py-2 text-right">T</th>
                                            </Fragment>
                                        ))}

                                        <th className="border px-3 py-2 text-right">M</th>
                                        <th className="border px-3 py-2 text-right">F</th>
                                        <th className="border px-3 py-2 text-right">T</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                        {sections.map((section) => (
                                            <AnnualSection
                                                key={section.id}
                                                section={section}
                                                quarters={quarters}
                                                getValue={getValue}
                                                submissionByQuarter={
                                                    submissionByQuarter
                                                }
                                                annualComplete={
                                                    annualStatus?.complete ??
                                                    false
                                                }
                                            />
                                        ))}
                                    </tbody>

                                </table>
                            </div>
                        </div>
                    )}

                    {/* No LGU Selected */}

                    {!selectedLgu && (
                        <div className="rounded-lg bg-white p-10 text-center shadow">
                            <p className="text-gray-500">
                                Select an LGU and year, then click
                                Generate Report.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}