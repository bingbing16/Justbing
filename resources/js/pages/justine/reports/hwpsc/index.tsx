import { Head, Link, router } from '@inertiajs/react'

import { DataTable } from '@/components/data-table'

import {
    createColumns,
    type Submission,
} from '@/pages/justine/HWPSC/columns'

import { Button } from '@/components/ui/button'

import {
    Plus,
    Calendar1,
    CheckCircle2,
    AlertTriangle,
    Clock3,
    FileCheck2,
    Upload,
    XCircle,
} from 'lucide-react'
import { useState } from 'react'
import SendReportEmailModal from '../../LguReportEmails/sendReportEmailModal'

interface ReportType {
    id: number
    code: string
    name: string
    slug: string
}

interface Quarter {
    id: number
    code: string
    name: string
}

interface Status {
    id: number
    code: string
    name: string
}

interface Props {
    reportType: ReportType
    submissions: Submission[]
    years: number[]
    quarters: Quarter[]
    statuses: Status[]
}



export default function HWPSCIndex({
    reportType,
    submissions,
    years,
    quarters,
    statuses,
}: Props) {

    const reportBaseUrl = `/justine/reports/${reportType.slug}`;

    // const reportBaseUrl =
    // reportType.slug === 'hwpsc'
    //     ? '/justine/reports/hwpsc'
    //     : `/justine/reports/${reportType.slug}`
    
    const reportColumns = createColumns(reportType)

    const [selectedSubmissions, setSelectedSubmissions] =
    useState<Submission[]>([])

    const [showBulkRejectModal, setShowBulkRejectModal] =
        useState(false)

    const [bulkRejectionReason, setBulkRejectionReason] =
        useState('')

    const [bulkRejecting, setBulkRejecting] =
        useState(false)
    /**
     * Submission counts
     */
    const totalReports = submissions.length

    const draftReports = submissions.filter(
        (submission) =>
            submission.status?.code === 'draft',
    ).length

    const submittedReports = submissions.filter(
        (submission) =>
            submission.status?.code === 'submitted',
    ).length

    const approvedReports = submissions.filter(
        (submission) =>
            submission.status?.code === 'approved',
    ).length

    /**
     * Validation counts
     */
    const validatedReports = submissions.filter(
        (submission) =>
            submission.validation_status === 'validated',
    ).length

    const discrepancyReports = submissions.filter(
        (submission) =>
            submission.validation_status === 'discrepancy',
    ).length

    const notComparableReports = submissions.filter(
        (submission) =>
            submission.validation_status ===
            'not_comparable',
    ).length

    const notCheckedReports = submissions.filter(
        (submission) =>
            submission.validation_status ===
            'not_checked',
    ).length

    const selectedIds = selectedSubmissions.map(
        (submission) => submission.id
    )

    const [emailModalOpen, setEmailModalOpen] =
        useState(false)

    const [emailSubmissionIds, setEmailSubmissionIds] =
        useState<number[]>([])

    const openEmailModal = () => {
        if (selectedIds.length === 0) {
            return
        }

        setEmailSubmissionIds(selectedIds)
        setEmailModalOpen(true)
    }

    

    return (
        <>
            <Head title={`${reportType.name} Reports`} />

            <div className="bg-gray-100 p-6">

                <div>

                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {reportType.name} Reports
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                LGU Quarterly Reports
                            </p>
                        </div>

                        <div className="flex items-center gap-2">

                            {/* New Report */}
                            <Button
                                asChild
                                variant="outline"
                            >
                                <Link href={`${reportBaseUrl}/create`}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New {reportType.name} Report
                                </Link>
                            </Button>

                            {/* Annual */}
                            <Button asChild>
                               <Link href={`${reportBaseUrl}/annual`}>
                                    <Calendar1 className="mr-2 h-4 w-4" />
                                    Annual Consolidated
                                </Link>
                            </Button>

                            {/* Import */}
                            <Button
                                asChild
                                variant="outline"
                            >
                                <Link href={`${reportBaseUrl}/import`}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import
                                </Link>
                            </Button>

                            {/* API */}
                            {/* <Button
                                asChild
                                variant="outline"
                            >
                                <Link href="/justine/reports/hwpsc/import">
                                    API
                                </Link>
                            </Button> */}

                        </div>

                    </div>

                    {/* Summary Cards */}
                    <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                        {/* Total */}
                        <div className="rounded-lg bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">

                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        Total Reports
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        {totalReports}
                                    </p>
                                </div>

                                <div className="rounded-full bg-gray-100 p-3">
                                    <FileCheck2 className="h-5 w-5 text-gray-600" />
                                </div>

                            </div>
                        </div>

                        {/* Submitted */}
                        <div className="rounded-lg bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">

                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        Submitted
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-blue-600">
                                        {submittedReports}
                                    </p>
                                </div>

                                <div className="rounded-full bg-blue-100 p-3">
                                    <Clock3 className="h-5 w-5 text-blue-600" />
                                </div>

                            </div>
                        </div>

                        {/* Validated */}
                        <div className="rounded-lg bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">

                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        FHSIS Validated
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-green-600">
                                        {validatedReports}
                                    </p>
                                </div>

                                <div className="rounded-full bg-green-100 p-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                </div>

                            </div>
                        </div>

                        {/* Discrepancy */}
                        <div className="rounded-lg bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">

                                <div>
                                    <p className="text-sm font-medium text-gray-500">
                                        Discrepancies
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-red-600">
                                        {discrepancyReports}
                                    </p>
                                </div>

                                <div className="rounded-full bg-red-100 p-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* Validation Summary */}
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">

                        <div className="mb-3 flex items-center justify-between">

                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    FHSIS Validation Summary
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Current validation state of LGU reports
                                </p>
                            </div>

                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                            {/* Not Checked */}
                            <div className="rounded-md border bg-gray-50 p-3">
                                <p className="text-xs font-medium uppercase text-gray-500">
                                    Not Checked
                                </p>

                                <p className="mt-1 text-xl font-bold text-gray-700">
                                    {notCheckedReports}
                                </p>
                            </div>

                            {/* Validated */}
                            <div className="rounded-md border border-green-200 bg-green-50 p-3">
                                <p className="text-xs font-medium uppercase text-green-600">
                                    Validated
                                </p>

                                <p className="mt-1 text-xl font-bold text-green-700">
                                    {validatedReports}
                                </p>
                            </div>

                            {/* Discrepancy */}
                            <div className="rounded-md border border-red-200 bg-red-50 p-3">
                                <p className="text-xs font-medium uppercase text-red-600">
                                    Discrepancy
                                </p>

                                <p className="mt-1 text-xl font-bold text-red-700">
                                    {discrepancyReports}
                                </p>
                            </div>

                            {/* Not Comparable */}
                            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                                <p className="text-xs font-medium uppercase text-yellow-600">
                                    Not Comparable
                                </p>

                                <p className="mt-1 text-xl font-bold text-yellow-700">
                                    {notComparableReports}
                                </p>
                            </div>

                        </div>

                    </div>

                    {selectedSubmissions.length > 0 && (
                        <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm">
                            <div className="text-sm font-medium text-gray-700">
                                {selectedSubmissions.length} report
                                {selectedSubmissions.length !== 1 ? 's' : ''} selected
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        router.post(
                                            `${reportBaseUrl}/bulk-submit`,
                                            {
                                                submission_ids: selectedIds,
                                            },
                                            {
                                                preserveScroll: true,
                                            },
                                        )
                                    }}
                                >
                                    <FileCheck2 className="mr-2 h-4 w-4" />
                                    Submit
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        router.post(
                                            `${reportBaseUrl}/bulk-validate-fhsis`,
                                            {
                                                submission_ids: selectedIds,
                                            },
                                            {
                                                preserveScroll: true,
                                            },
                                        )
                                    }}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Validate
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        router.post(
                                            `${reportBaseUrl}/bulk-approve`,
                                            {
                                                submission_ids: selectedIds,
                                            },
                                            {
                                                preserveScroll: true,
                                            },
                                        )
                                    }}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>

                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        // open your existing rejection modal
                                        setShowBulkRejectModal(true)
                                    }}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={openEmailModal}
                                >
                                    Send Email
                                </Button>
                            </div>
                        </div>
                    )}

                    {showBulkRejectModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">

                                <div className="border-b px-6 py-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Reject {reportType.name} Reports
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        You are rejecting {selectedSubmissions.length} selected
                                        report
                                        {selectedSubmissions.length !== 1 ? 's' : ''}.
                                        Please provide the reason.
                                    </p>
                                </div>

                                <div className="px-6 py-5">
                                    <textarea
                                        value={bulkRejectionReason}
                                        onChange={(e) =>
                                            setBulkRejectionReason(e.target.value)
                                        }
                                        rows={5}
                                        maxLength={2000}
                                        placeholder="Enter the reason for rejection..."
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                    />

                                    <div className="mt-1 text-right text-xs text-gray-500">
                                        {bulkRejectionReason.length}/2000
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowBulkRejectModal(false)
                                            setBulkRejectionReason('')
                                        }}
                                        disabled={bulkRejecting}
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            bulkRejecting ||
                                            !bulkRejectionReason.trim()
                                        }
                                        onClick={() => {
                                            setBulkRejecting(true)

                                            router.post(
                                                `${reportBaseUrl}/bulk-reject`,
                                                {
                                                    submission_ids: selectedIds,
                                                    remarks: bulkRejectionReason.trim(),
                                                },
                                                {
                                                    preserveScroll: true,

                                                    onSuccess: () => {
                                                        setShowBulkRejectModal(false)
                                                        setBulkRejectionReason('')
                                                    },

                                                    onFinish: () => {
                                                        setBulkRejecting(false)
                                                    },
                                                },
                                            )
                                        }}
                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {bulkRejecting
                                            ? 'Rejecting...'
                                            : 'Confirm Rejection'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DataTable */}
                    <div className="rounded-lg bg-white p-4 shadow">

                        <DataTable
                            columns={reportColumns}
                            data={submissions}
                            years={years}
                            quarters={quarters}
                            statuses={statuses}
                            onSelectionChange={setSelectedSubmissions}
                            getRowId={(row) => String(row.id)}
                        />

                    </div>

                    <SendReportEmailModal
                        open={emailModalOpen}
                        submissionIds={emailSubmissionIds}
                        onClose={() => {
                            setEmailModalOpen(false)
                            setEmailSubmissionIds([])
                        }}
                    />

                </div>

            </div>
        </>
    )
}

HWPSCIndex.layout = {
    breadcrumbs: [
        {
            title: 'Justine',
            href: '/justine/reports',
        },
        {
            title: 'Reports',
            href: '/justine/reports',
        },
    ],
}