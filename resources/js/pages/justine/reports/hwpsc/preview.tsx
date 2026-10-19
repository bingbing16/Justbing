import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button'

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
    lgu: {
        name: string;
    };
    reporting_period: {
        year: number;
        quarter: {
            name: string;
        };
    };
    status: {
        name: string;
        code: string;
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
    submission: Submission;
    sections: Section[];
}
export default function HWPSCPreview({
    reportType,
    submission,
    sections,
}: Props) {

    const getValue = (
        indicatorId: number
    ): ReportValue | undefined => {

        return submission.values.find(
            (value) =>
                value.indicator_id === indicatorId
        );
    };

    // const submitReport = () => {
    //     if (
    //         !confirm(
    //             'Are you sure you want to submit this report? You will no longer be able to edit it after submission.'
    //         )
    //     ) {
    //         return;
    //     }

    //     router.post(
    //         `/justine/reports/hwpsc/${submission.id}/submit`
    //     );
    // };

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approving, setApproving] = useState(false);


    return (
        <>
            <Head title={`Preview ${reportType.name} Report`} />

            <div className="min-h-screen bg-gray-100 p-6">

                <div className="mx-auto max-w-7xl">

                    <div className="mb-6 flex items-center justify-between">

                        <div>

                            <h1 className="text-2xl font-bold">
                                {reportType.name} Report Preview
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                Review the report before submission.
                            </p>

                        </div>

                        <div className="flex gap-2">

                            <Button 
                                asChild
                                variant="outline"
                                >
                                <Link href={`/justine/reports/${reportType.slug}`}>
                                    Back to Reports
                                </Link>
                            </Button>

                            <Button 
                                asChild
                                >
                                {['draft', 'rejected'].includes(submission.status?.code) && (
                                    <Link
                                        href={`/justine/reports/${reportType.slug}/${submission.id}/edit`}
                                        className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
                                    >
                                        Edit
                                    </Link>
                                )}
                            </Button>

                            {/* {['draft', 'rejected'].includes(submission.status?.code) && (
                                <Link
                                    href={`/justine/reports/hwpsc/${submission.id}/edit`}
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
                                >
                                    Edit
                                </Link>
                            )} */}

                        </div>

                    </div>


                    {/* Report Information */}

                    <div className="mb-6 rounded-lg bg-white p-6 shadow">

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

                            <div>

                                <div className="text-xs uppercase text-gray-500">
                                    LGU
                                </div>

                                <div className="font-semibold">
                                    {submission.lgu.name}
                                </div>

                            </div>

                            <div>

                                <div className="text-xs uppercase text-gray-500">
                                    Reporting Period
                                </div>

                                <div className="font-semibold">
                                    {submission.reporting_period
                                    ? `${submission.reporting_period.year} - ${submission.reporting_period.quarter?.name ?? ''}`
                                    : 'No reporting period'}
                                </div>

                            </div>

                            {/* <div>

                                <div className="text-xs uppercase text-gray-500">
                                    Status
                                </div>

                                <div className="font-semibold">
                                    {submission.status.name}
                                </div>

                            </div> */}

                            {/* <div>
                                <p className="text-sm text-gray-500">
                                    Status
                                </p>

                                <p className="font-semibold">
                                    {submission.status?.name ?? 'Unknown'}
                                </p>
                            </div> */}

                            <div>
                                <p className="text-sm text-gray-500">
                                    Status
                                </p>

                                <span
                                    // className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold text-white
                                        className={`
                                                
                                         ${
                                        submission.status?.code === 'rejected'
                                            ? 'rounded-md bg-red-100 px-2 py-1 text-sm text-red-600'
                                            : submission.status?.code === 'submitted'
                                                ? 'rounded-md bg-blue-100 px-2 py-1 text-sm text-blue-600'
                                                : submission.status?.code === 'approved'
                                                    ? 'rounded-md bg-green-100 px-2 py-1 text-sm text-green-600'
                                                    : submission.status?.code === 'draft'
                                                        ? 'rounded-md bg-gray-200 px-2 py-1 text-sm text-gray-600'
                                                        : 'rounded-md bg-gray-200 px-2 py-1 text-sm text-gray-600'
                                    }`}
                                >
                                    {submission.status?.name ?? 'Unknown'}
                                </span>
                            </div>  

                            <div>
                                 {['draft', 'rejected'].includes(submission.status?.code) && (
                                    <button
                                        type="button"
                                        onClick={() => setShowSubmitModal(true)}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Submit Report
                                    </button>
                                )}

                                {submission.status?.code === 'submitted' && (
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowApproveModal(true)}
                                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"

                                        >
                                            Approve
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setShowRejectModal(true)}
                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}


                            </div>

                            {showSubmitModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                    <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
                                        <div className="px-6 py-5">
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                Submit Report
                                            </h2>

                                            <p className="mt-2 text-sm leading-6 text-gray-600">
                                                Are you sure you want to submit this report?
                                                <br />
                                                <span className="font-medium text-red-600">
                                                    You will no longer be able to edit it after submission.
                                                </span>
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowSubmitModal(false)}
                                                disabled={submitting}
                                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="button"
                                                disabled={submitting}
                                                onClick={() => {
                                                    setSubmitting(true);

                                                    router.post(
                                                        `/justine/reports/${reportType.slug}/${submission.id}/submit`,
                                                        {},
                                                        {
                                                            onSuccess: () => {
                                                                setShowSubmitModal(false);
                                                            },
                                                            onFinish: () => {
                                                                setSubmitting(false);
                                                            },
                                                        }
                                                    );
                                                }}
                                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {submitting ? 'Submitting...' : 'Confirm Submission'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showApproveModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                    <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
                                        <div className="px-6 py-5">
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                Approve Report
                                            </h2>

                                            <p className="mt-2 text-sm leading-6 text-gray-600">
                                                Are you sure you want to approve this report?
                                                <br />
                                                <span className="font-medium text-red-600">
                                                    Once approved, this report can no longer be edited.
                                                </span>
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowApproveModal(false)}
                                                disabled={approving}
                                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="button"
                                                disabled={approving}
                                                onClick={() => {
                                                    setApproving(true);

                                                    router.post(
                                                    `/justine/reports/${reportType.slug}/${submission.id}/approve`,
                                                        {},
                                                        {
                                                            onSuccess: () => {
                                                                setShowApproveModal(false);
                                                            },
                                                            onFinish: () => {
                                                                setApproving(false);
                                                            },
                                                        }
                                                    );
                                                }}
                                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {approving ? 'Approving...' : 'Confirm Approval'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {submission.status?.code === 'rejected' &&
                            submission.remarks && (
                                <div className="rounded-lg border border-red-300 bg-red-50 p-4">
                                    <p className="font-semibold text-red-800">
                                        Rejection Remarks
                                    </p>

                                    <p className="mt-1 text-sm text-red-700">
                                        {submission.remarks}
                                    </p>
                                </div>
                            )}

                            {showRejectModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                    <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
                                        <div className="border-b px-6 py-4">
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                Reject {reportType.name} Report
                                            </h2>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Please provide the reason for rejecting this report.
                                            </p>
                                        </div>

                                        <div className="px-6 py-5">
                                            <label
                                                htmlFor="rejectionReason"
                                                className="mb-2 block text-sm font-medium text-gray-700"
                                            >
                                                Rejection Reason
                                            </label>

                                            <textarea
                                                id="rejectionReason"
                                                value={rejectionReason}
                                                onChange={(e) =>
                                                    setRejectionReason(e.target.value)
                                                }
                                                rows={5}
                                                maxLength={2000}
                                                placeholder="Enter the reason for rejection..."
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                            />

                                            <div className="mt-1 text-right text-xs text-gray-500">
                                                {rejectionReason.length}/2000
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowRejectModal(false);
                                                    setRejectionReason('');
                                                }}
                                                disabled={rejecting}
                                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="button"
                                                disabled={rejecting || !rejectionReason.trim()}
                                                onClick={() => {
                                                    setRejecting(true);

                                                    router.post(
                                                        `/justine/reports/${reportType.slug}/${submission.id}/reject`,
                                                        {
                                                            remarks: rejectionReason.trim(),
                                                        },
                                                        {
                                                            onSuccess: () => {
                                                                setShowRejectModal(false);
                                                                setRejectionReason('');
                                                            },
                                                            onFinish: () => {
                                                                setRejecting(false);
                                                            },
                                                        }
                                                    );
                                                }}
                                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}  

                        </div>

                    </div>


                    {/* Report Table */}

                    <div className="overflow-hidden rounded-lg bg-white shadow">

                        <div className="overflow-x-auto">

                            <table className="min-w-full">

                                <thead className="bg-gray-800 text-white">

                                    <tr>

                                        <th className="px-4 py-3 text-left">
                                            Indicator
                                        </th>

                                        <th className="w-40 px-4 py-3 text-right">
                                            Male
                                        </th>

                                        <th className="w-40 px-4 py-3 text-right">
                                            Female
                                        </th>

                                        <th className="w-40 px-4 py-3 text-right">
                                            Total
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {sections.map((section) => (

                                        <PreviewSection
                                            key={section.id}
                                            section={section}
                                            getValue={getValue}
                                        />

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>


                    <div className="mt-6 flex justify-end">

                        {/* {['draft', 'rejected'].includes(submission.status?.code) && (
                            <Link
                                href={`/justine/reports/hwpsc/${submission.id}/edit`}
                                className="rounded-md border bg-white px-5 py-2.5 text-sm font-medium"
                            >
                                Back to Edit
                            </Link>
                        )} */}

                        <Button 
                            asChild
                            >
                            {['draft', 'rejected'].includes(submission.status?.code) && (
                                <Link
                                    href={`/justine/reports/${reportType.slug}/${submission.id}/edit`}
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
                                >
                                    Back to Edit
                                </Link>
                            )}
                        </Button>

                    </div>

                </div>

            </div>
        </>
    );
}


function PreviewSection({
    section,
    getValue,
}: {
    section: Section;
    getValue: (
        indicatorId: number
    ) => ReportValue | undefined;
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


            {section.indicators?.map((indicator) => {

                const value = getValue(indicator.id);

                return (
                    <tr key={indicator.id}>

                        <td className="border px-4 py-3">

                            <div className="text-sm">
                                {indicator.name}
                            </div>

                            {/* <div className="text-xs text-gray-400">
                                {indicator.code}
                            </div> */}

                        </td>

                        <td className="border px-4 py-3 text-right">
                            {Number(value?.male ?? 0).toFixed(2)}
                        </td>

                        <td className="border px-4 py-3 text-right">
                            {Number(value?.female ?? 0).toFixed(2)}
                        </td>

                        <td className="border bg-gray-50 px-4 py-3 text-right font-medium">
                            {Number(value?.total ?? 0).toFixed(2)}
                        </td>

                    </tr>
                );

            })}


            {section.children?.map((child) => (

                <PreviewSection
                    key={child.id}
                    section={child}
                    getValue={getValue}
                />

            ))}

        </>
    );
}