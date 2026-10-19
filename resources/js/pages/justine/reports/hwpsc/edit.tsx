import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo } from 'react';
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'


interface ReportType {
    id: number
    code: string
    name: string
    slug: string
}

interface Indicator {
    id: number;
    code: string;
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

interface ReportValue {
    id: number;
    indicator_id: number;
    male: number;
    female: number;
    total: number;
}

interface Submission {
    id: number;
    lgu: {
        id: number;
        name: string;
    };
    reporting_period: {
        id: number;
        year: number;
        quarter: {
            id: number;
            name: string;
        };
    };
    status: {
        name: string;
    };
    values: ReportValue[];
}

interface Props {
    reportType: ReportType
    submission: Submission;
    sections: Section[];
}

interface FormValue {
    indicator_id: number;
    male: string;
    female: string;
}

export default function EditHWPSC({
    reportType,
    submission,
    sections,
}: Props) {

    const allIndicators = useMemo(() => {

        const result: Indicator[] = [];

        sections.forEach((section) => {

            section.indicators?.forEach((indicator) => {
                result.push(indicator);
            });

            section.children?.forEach((child) => {

                child.indicators?.forEach((indicator) => {
                    result.push(indicator);
                });

            });

        });

        return result;

    }, [sections]);


    const initialValues: FormValue[] =
        allIndicators.map((indicator) => {

            const existing = submission.values.find(
                (value) =>
                    value.indicator_id === indicator.id
            );

            return {
                indicator_id: indicator.id,
                male: existing
                    ? String(existing.male)
                    : '',
                female: existing
                    ? String(existing.female)
                    : '',
            };
        });


    const {
        data,
        setData,
        put,
        processing,
    } = useForm<{
        values: FormValue[];
    }>({
        values: initialValues,
    });


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
                (item) =>
                    item.indicator_id === indicatorId
            )?.[field] ?? ''
        );
    };


    const getTotal = (indicatorId: number) => {

        const value = data.values.find(
            (item) =>
                item.indicator_id === indicatorId
        );

        return (
            Number(value?.male || 0) +
            Number(value?.female || 0)
        );
    };


    const submit = (event: FormEvent) => {

        event.preventDefault();

        put(`/justine/reports/${reportType.slug}/${submission.id}`
        );
    };


    return (
        <>
            <Head title={`Edit ${reportType.name} Report`} />

            <div className="min-h-screen bg-gray-100 p-6">

                <div className="mx-auto max-w-7xl">

                    <div className="mb-6 flex items-center justify-between">

                        <div>

                            <h1 className="text-2xl font-bold">
                                Edit {reportType.name} Report
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                {submission.lgu.name}
                                {' — '}
                                {submission.reporting_period
                                    ? `${submission.reporting_period.year} - ${submission.reporting_period.quarter?.name ?? ''}`
                                    : 'No reporting period'}
                            </p>

                        </div>

                        <div className="flex gap-2">

                            <Link
                                href="/justine/reports/hwpsc"
                                className="rounded-md border bg-white px-4 py-2 text-sm"
                            >
                                Back
                            </Link>

                            <Link
                                href={`/justine/reports/hwpsc/${submission.id}/preview`}
                                className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white"
                            >
                                Preview
                            </Link>

                        </div>

                    </div>


                    <form onSubmit={submit}>

                        <div className="overflow-hidden rounded-lg bg-white shadow">

                            <div className="overflow-x-auto">

                                <table className="min-w-full">

                                    <thead className="bg-gray-800 text-white">

                                        <tr>

                                            <th className="px-4 py-3 text-left">
                                                Indicator
                                            </th>

                                            <th className="w-40 px-4 py-3 text-center">
                                                Male
                                            </th>

                                            <th className="w-40 px-4 py-3 text-center">
                                                Female
                                            </th>

                                            <th className="w-40 px-4 py-3 text-center">
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


                        <div className="mt-6 flex justify-end">

                            {/* <button
                                type="submit"
                                disabled={processing}
                                className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                            >
                                {processing
                                    ? 'Updating...'
                                    : 'Update Draft'}
                            </button> */}

                             <Button
                                type="submit"
                                disabled={processing}
                            >
                                <RefreshCcw/>
                                {processing
                                    ? 'Updating...'
                                    : 'Update Draft'}
                            </Button>

                            {/* <Button 
                                asChild
                                variant="outline"
                                type="submit"
                                disabled={processing}
                                >
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                {processing
                                    ? 'Updating...'
                                    : 'Update Draft'}
                            </Button> */}

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
            <tr className="bg-gray-100">

                <td
                    colSpan={4}
                    className="border px-4 py-3 font-semibold"
                >
                    {section.name}
                </td>

            </tr>

            {section.indicators?.map((indicator) => (

                <IndicatorRow
                    key={indicator.id}
                    indicator={indicator}
                    getValue={getValue}
                    getTotal={getTotal}
                    updateValue={updateValue}
                />

            ))}

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
                <div className="text-sm">
                    {indicator.name}
                </div>

                {/* <div className="text-xs text-gray-400">
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