import { Link, router } from '@inertiajs/react'
import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

import { Checkbox } from '@/components/ui/checkbox'

import {
    AlertTriangle,
    CheckCircle2,
    Eye,
    FileCheck2,
    FileWarning,
    Loader2,
    MoreHorizontal,
    Pencil,
    RefreshCw,
    Send,
    XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import SendReportEmailModal from '../LguReportEmails/sendReportEmailModal'

/*
|--------------------------------------------------------------------------
| Report Type
|--------------------------------------------------------------------------
*/

export interface ReportType {
    id: number
    code: string
    name: string
    slug: string
}

/*
|--------------------------------------------------------------------------
| Validation Types
|--------------------------------------------------------------------------
*/

interface ValidationValue {
    male: number | string | null
    female: number | string | null
    total: number | string | null
}

interface ValidationDifference {
    male: number | string | null
    female: number | string | null
    total: number | string | null
}

export interface ValidationDetail {
    indicator_id: number
    indicator_code: string
    indicator_name: string

    lgu: ValidationValue
    fhsis: ValidationValue
    difference: ValidationDifference
}

/*
|--------------------------------------------------------------------------
| Submission
|--------------------------------------------------------------------------
*/

export interface Submission {
    id: number

    lgu: {
        id: number
        name: string
    }

    reporting_period: {
        id: number
        year: number
        quarter: {
            id: number
            code: string
            name: string
        }
    }

    status: {
        id: number
        code: string
        name: string
    }

    remarks: string | null

    validation_status:
        | 'not_checked'
        | 'discrepancy'
        | 'not_comparable'
        | 'validated'

    validated_at: string | null

    validation_remarks: string | null

    validation_details: ValidationDetail[] | null

    validator?: {
        id: number
        name: string
    } | null
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Format UTC timestamp returned by Laravel.
 *
 * Example:
 * 2026-09-19T03:37:46.000000Z
 *
 * becomes:
 * September 19, 2026, 11:37 AM
 */
const formatDateTime = (date?: string | null) => {
    if (!date) {
        return '—'
    }

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) {
        return '—'
    }

    return parsed.toLocaleString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

/**
 * Submission status badge
 */
const getStatusClass = (status?: string) => {
    switch (status) {
        case 'rejected':
            return 'rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-600'

        case 'submitted':
            return 'rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-600'

        case 'approved':
            return 'rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-600'

        default:
            return 'rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600'
    }
}

/**
 * FHSIS validation badge
 */
const getValidationClass = (validation?: string) => {
    switch (validation) {
        case 'validated':
            return 'rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700'

        case 'discrepancy':
            return 'rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700'

        case 'not_comparable':
            return 'rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700'

        default:
            return 'rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600'
    }
}

const getValidationLabel = (validation?: string) => {
    switch (validation) {
        case 'validated':
            return 'Validated'

        case 'discrepancy':
            return 'Discrepancy'

        case 'not_comparable':
            return 'Not Comparable'

        default:
            return 'Not Checked'
    }
}

/*
|--------------------------------------------------------------------------
| Validation Modal
|--------------------------------------------------------------------------
*/

function ValidationModal({
    submission,
    open,
    onClose,
    reportType,
}: {
    submission: Submission
    open: boolean
    onClose: () => void
    reportType: ReportType
}) {
    const [validating, setValidating] = useState(false)

    if (!open) {
        return null
    }

    const validate = () => {
        setValidating(true)

        router.post(
            `/justine/reports/${reportType.slug}/${submission.id}/validate-fhsis`,
            {},
            {
                preserveScroll: true,

                onFinish: () => {
                    setValidating(false)
                    onClose()
                },
            },
        )
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
                <div className="border-b px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Validate {reportType.name} Report
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        The LGU report will be compared against the current
                        FHSIS data.
                    </p>
                </div>

                <div className="px-6 py-5">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-start gap-3">
                            <FileCheck2 className="mt-0.5 h-5 w-5 text-blue-600" />

                            <div>
                                <p className="font-medium text-blue-900">
                                    {submission.lgu.name}
                                </p>

                                <p className="mt-1 text-sm text-blue-700">
                                    {submission.reporting_period.year}{' '}
                                    {submission.reporting_period.quarter.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                        <p>The system will compare:</p>

                        <ul className="mt-2 list-disc space-y-1 pl-5">
                            <li>Male values</li>
                            <li>Female values</li>
                            <li>Total values</li>
                            <li>Each FHSIS-mapped indicator</li>
                        </ul>
                    </div>

                    <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                        <strong>Important:</strong>{' '}
                        The report can only be approved when all comparable
                        indicators match FHSIS.
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={validating}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={validating}
                        onClick={validate}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {validating ? (
                            <span className="flex items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Validating...
                            </span>
                        ) : (
                            'Validate Report'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

/*
|--------------------------------------------------------------------------
| Discrepancy Modal
|--------------------------------------------------------------------------
*/

function DiscrepancyModal({
    submission,
    open,
    onClose,
}: {
    submission: Submission
    open: boolean
    onClose: () => void
}) {
    if (!open) {
        return null
    }

    const details = submission.validation_details ?? []

    const isNotComparable =
        submission.validation_status === 'not_comparable'

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl">
                {/* Header */}
                <div className="border-b px-6 py-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {isNotComparable
                                    ? 'FHSIS Validation Details'
                                    : 'FHSIS Discrepancy Details'}
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                {submission.lgu.name} —{' '}
                                {submission.reporting_period.year}{' '}
                                {submission.reporting_period.quarter.name}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="max-h-[calc(90vh-150px)] overflow-y-auto px-6 py-5">
                    {/* Why */}
                    <div
                        className={`rounded-lg border p-4 ${
                            isNotComparable
                                ? 'border-yellow-200 bg-yellow-50'
                                : 'border-red-200 bg-red-50'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            {isNotComparable ? (
                                <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
                            ) : (
                                <FileWarning className="mt-0.5 h-5 w-5 text-red-600" />
                            )}

                            <div>
                                <h3
                                    className={`font-semibold ${
                                        isNotComparable
                                            ? 'text-yellow-800'
                                            : 'text-red-800'
                                    }`}
                                >
                                    {isNotComparable
                                        ? 'Why this report cannot be validated'
                                        : 'Why this report cannot be approved'}
                                </h3>

                                <p
                                    className={`mt-1 text-sm ${
                                        isNotComparable
                                            ? 'text-yellow-700'
                                            : 'text-red-700'
                                    }`}
                                >
                                    {submission.validation_remarks ??
                                        'No validation remarks available.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    {details.length > 0 && (
                        <div className="mt-5 overflow-hidden rounded-lg border">
                            <div className="border-b bg-gray-50 px-4 py-3">
                                <h3 className="font-semibold text-gray-900">
                                    Indicators Requiring Attention
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Difference is calculated as: LGU Report −
                                    FHSIS
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="px-4 py-3 text-left">
                                                Indicator
                                            </th>

                                            <th
                                                colSpan={3}
                                                className="border-l px-3 py-3 text-center"
                                            >
                                                LGU Report
                                            </th>

                                            <th
                                                colSpan={3}
                                                className="border-l px-3 py-3 text-center"
                                            >
                                                FHSIS
                                            </th>

                                            <th
                                                colSpan={3}
                                                className="border-l px-3 py-3 text-center"
                                            >
                                                Difference
                                            </th>
                                        </tr>

                                        <tr className="border-b bg-gray-50 text-xs text-gray-500">
                                            <th />

                                            <th className="border-l px-3 py-2">
                                                Male
                                            </th>

                                            <th className="px-3 py-2">
                                                Female
                                            </th>

                                            <th className="px-3 py-2">
                                                Total
                                            </th>

                                            <th className="border-l px-3 py-2">
                                                Male
                                            </th>

                                            <th className="px-3 py-2">
                                                Female
                                            </th>

                                            <th className="px-3 py-2">
                                                Total
                                            </th>

                                            <th className="border-l px-3 py-2">
                                                Male
                                            </th>

                                            <th className="px-3 py-2">
                                                Female
                                            </th>

                                            <th className="px-3 py-2">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {details.map((detail) => (
                                            <tr
                                                key={detail.indicator_id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">
                                                        {detail.indicator_name}
                                                    </div>

                                                    <div className="text-xs text-gray-500">
                                                        {detail.indicator_code}
                                                    </div>
                                                </td>

                                                {/* LGU */}
                                                <td className="border-l px-3 py-3 text-center">
                                                    {detail.lgu.male ?? '—'}
                                                </td>

                                                <td className="px-3 py-3 text-center">
                                                    {detail.lgu.female ?? '—'}
                                                </td>

                                                <td className="px-3 py-3 text-center font-medium">
                                                    {detail.lgu.total ?? '—'}
                                                </td>

                                                {/* FHSIS */}
                                                <td className="border-l px-3 py-3 text-center">
                                                    {detail.fhsis.male ?? '—'}
                                                </td>

                                                <td className="px-3 py-3 text-center">
                                                    {detail.fhsis.female ?? '—'}
                                                </td>

                                                <td className="px-3 py-3 text-center font-medium">
                                                    {detail.fhsis.total ?? '—'}
                                                </td>

                                                {/* Difference */}
                                                <td className="border-l bg-red-50 px-3 py-3 text-center font-semibold text-red-600">
                                                    {detail.difference.male ??
                                                        '—'}
                                                </td>

                                                <td className="bg-red-50 px-3 py-3 text-center font-semibold text-red-600">
                                                    {detail.difference.female ??
                                                        '—'}
                                                </td>

                                                <td className="bg-red-50 px-3 py-3 text-center font-semibold text-red-600">
                                                    {detail.difference.total ??
                                                        '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t bg-gray-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

/*
|--------------------------------------------------------------------------
| Actions Cell
|--------------------------------------------------------------------------
*/

function ActionsCell({
    submission,
    reportType,
}: {
    submission: Submission
    reportType: ReportType
}) {
    const [showValidationModal, setShowValidationModal] =
        useState(false)

    const [showDiscrepancyModal, setShowDiscrepancyModal] =
        useState(false)

    const [showRejectModal, setShowRejectModal] =
        useState(false)

    const [rejectionReason, setRejectionReason] =
        useState('')

    const [rejecting, setRejecting] =
        useState(false)

    const [emailModalOpen, setEmailModalOpen] =
        useState(false)

    const [emailSubmissionIds, setEmailSubmissionIds] =
        useState<number[]>([])

    const status = submission.status?.code

    const validation = submission.validation_status

    /*
    |--------------------------------------------------------------------------
    | Dynamic report URL
    |--------------------------------------------------------------------------
    */

    const baseUrl = `/justine/reports/${reportType.slug}`

    /*
    |--------------------------------------------------------------------------
    | Report type capabilities
    |--------------------------------------------------------------------------
    |
    | Current FHSIS comparison/validation implementation is HWPSC-specific.
    |
    */

    // const isHwpsc = reportType.code === 'HWPSC'

    /*
    |--------------------------------------------------------------------------
    | Permissions / Actions
    |--------------------------------------------------------------------------
    */

    const canEdit =
        ['draft', 'rejected'].includes(status)

    const canSubmit =
        submission.status.code === 'draft' ||
        submission.status.code === 'rejected'

    const canValidate =
        submission.status.code === 'submitted'

    const validationLabel =
        submission.validation_status === 'validated'
            ? 'Revalidate FHSIS'
            : 'Validate FHSIS'

    const canApprove =
    submission.status.code === 'submitted' &&
    submission.validation_status === 'validated'

    const canReject =
        submission.status.code === 'submitted'

    const canEmail =
        submission.status.code === 'submitted' ||
        submission.status.code === 'draft' ||
        submission.status.code === 'rejected' ||
        submission.status.code === 'approved'

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const submitReport = () => {
        router.post(
            `${baseUrl}/${submission.id}/submit`,
            {},
            {
                preserveScroll: true,
            },
        )
    }

    /*
    |--------------------------------------------------------------------------
    | Approve
    |--------------------------------------------------------------------------
    */

    const approveReport = () => {
        router.post(
            `${baseUrl}/${submission.id}/approve`,
            {},
            {
                preserveScroll: true,
            },
        )
    }

    /*
    |--------------------------------------------------------------------------
    | Reject
    |--------------------------------------------------------------------------
    */

    const confirmRejection = () => {
        if (!rejectionReason.trim()) {
            return
        }

        setRejecting(true)

        router.post(
            `${baseUrl}/${submission.id}/reject`,
            {
                remarks: rejectionReason.trim(),
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    setShowRejectModal(false)
                    setRejectionReason('')
                },

                onFinish: () => {
                    setRejecting(false)
                },
            },
        )
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                    >
                        <span className="sr-only">
                            Open menu
                        </span>

                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    {/* Preview */}
                    <DropdownMenuItem asChild>
                        <Link
                            href={`${baseUrl}/${submission.id}/preview`}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                        </Link>
                    </DropdownMenuItem>

                    {/* Edit */}
                    {canEdit && (
                        <DropdownMenuItem asChild>
                            <Link
                                href={`${baseUrl}/${submission.id}/edit`}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </DropdownMenuItem>
                    )}

                    {/* Submit */}
                    {canSubmit && (
                        <DropdownMenuItem onClick={submitReport}>
                            <FileCheck2 className="mr-2 h-4 w-4" />
                            Submit
                        </DropdownMenuItem>
                    )}

                    {/* FHSIS functionality - HWPSC only */}
                    <DropdownMenuSeparator />

                        {/* FHSIS comparison */}
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/justine/fhsis/${reportType.slug}/comparison?year=${submission.reporting_period.year}&quarter_id=${submission.reporting_period.quarter.id}&lgu_id=${submission.lgu.id}`}
                            >
                                <FileCheck2 className="mr-2 h-4 w-4" />
                                Compare FHSIS
                            </Link>
                        </DropdownMenuItem>

                        {/* Validate FHSIS */}
                        {canValidate && (
                            <DropdownMenuItem
                                onClick={() =>
                                    setShowValidationModal(true)
                                }
                            >
                                {submission.validation_status === 'validated' ? (
                                    <RefreshCw className="mr-2 h-4 w-4 text-blue-600" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                )}

                                {validationLabel}
                            </DropdownMenuItem>
                        )}

                    {/* Existing validation details */}
                    {(
                        validation === 'discrepancy' ||
                        validation === 'not_comparable'
                    ) && (
                        <DropdownMenuItem
                            onClick={() =>
                                setShowDiscrepancyModal(true)
                            }
                        >
                            <FileWarning className="mr-2 h-4 w-4 text-red-600" />

                            View Validation Details
                        </DropdownMenuItem>
                    )}

                    {/* Approve */}
                    {canApprove && (
                        <DropdownMenuItem
                            onClick={approveReport}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                            Approve
                        </DropdownMenuItem>
                    )}

                    {/* Reject */}
                    {canReject && (
                        <DropdownMenuItem
                            onClick={() =>
                                setShowRejectModal(true)
                            }
                        >
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                            Reject
                        </DropdownMenuItem>
                    )}

                    {/* Send Email */}
                    {canEmail && (
                        <DropdownMenuItem
                            onClick={() => {
                                setEmailSubmissionIds([
                                    submission.id,
                                ])
                                setEmailModalOpen(true)
                            }}
                        >
                            <Send className="mr-2 h-4 w-4 text-blue-600" />
                            Send Email
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* VALIDATION MODAL */}
            <ValidationModal
                submission={submission}
                reportType={reportType}
                open={showValidationModal}
                onClose={() =>
                    setShowValidationModal(false)
                }
            />

            {/* DISCREPANCY MODAL */}
            <DiscrepancyModal
                submission={submission}
                open={showDiscrepancyModal}
                onClose={() =>
                    setShowDiscrepancyModal(false)
                }
            />

            {/* REJECTION MODAL */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
                        <div className="border-b px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Reject {reportType.name} Report
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Please provide the reason for rejecting
                                this report.
                            </p>
                        </div>

                        <div className="px-6 py-5">
                            <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm">
                                <p className="font-medium text-gray-900">
                                    {submission.lgu.name}
                                </p>

                                <p className="text-gray-500">
                                    {submission.reporting_period.year}{' '}
                                    {submission.reporting_period.quarter.name}
                                </p>
                            </div>

                            <label
                                htmlFor={`rejectionReason-${submission.id}`}
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Rejection Reason
                            </label>

                            <textarea
                                id={`rejectionReason-${submission.id}`}
                                value={rejectionReason}
                                onChange={(e) =>
                                    setRejectionReason(
                                        e.target.value,
                                    )
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
                                    setShowRejectModal(false)
                                    setRejectionReason('')
                                }}
                                disabled={rejecting}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={
                                    rejecting ||
                                    !rejectionReason.trim()
                                }
                                onClick={confirmRejection}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {rejecting
                                    ? 'Rejecting...'
                                    : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SEND EMAIL */}
            {emailModalOpen && (
                <SendReportEmailModal
                    open={emailModalOpen}
                    submissionIds={emailSubmissionIds}
                    onClose={() => {
                        setEmailModalOpen(false)
                        setEmailSubmissionIds([])
                    }}
                />
            )}
        </>
    )
}

/*
|--------------------------------------------------------------------------
| CREATE COLUMNS
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Do not export a static `columns` array anymore.
|
| The table is shared by HWPSC and PBP, so URLs must depend on the
| current report type.
|
*/

export const createColumns = (
    reportType: ReportType,
): ColumnDef<Submission>[] => {
    return [
        /*
        |--------------------------------------------------------------------------
        | Checkbox
        |--------------------------------------------------------------------------
        */

        {
            id: 'select',

            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (
                            table.getIsSomePageRowsSelected() &&
                            'indeterminate'
                        )
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            ),

            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) =>
                        row.toggleSelected(!!value)
                    }
                    aria-label={`Select ${row.original.lgu.name}`}
                />
            ),

            enableSorting: false,
            enableHiding: false,
        },

        /*
        |--------------------------------------------------------------------------
        | LGU
        |--------------------------------------------------------------------------
        */

        {
            id: 'lgu',

            accessorFn: (row) => row.lgu.name,

            header: ({ column }) => (
                <button
                    className="flex items-center gap-1"
                    onClick={() =>
                        column.toggleSorting(
                            column.getIsSorted() === 'asc',
                        )
                    }
                >
                    LGU

                    <span>
                        {column.getIsSorted() === 'asc'
                            ? '↑'
                            : column.getIsSorted() === 'desc'
                              ? '↓'
                              : '↕'}
                    </span>
                </button>
            ),

            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.lgu.name}
                </div>
            ),
        },

        /*
        |--------------------------------------------------------------------------
        | YEAR
        |--------------------------------------------------------------------------
        */

        {
            id: 'year',

            accessorFn: (row) =>
                row.reporting_period.year.toString(),

            header: ({ column }) => (
                <button
                    className="flex items-center gap-1"
                    onClick={() =>
                        column.toggleSorting(
                            column.getIsSorted() === 'asc',
                        )
                    }
                >
                    Year

                    <span>
                        {column.getIsSorted() === 'asc'
                            ? '↑'
                            : column.getIsSorted() === 'desc'
                              ? '↓'
                              : '↕'}
                    </span>
                </button>
            ),

            cell: ({ row }) => (
                <div>
                    {row.original.reporting_period.year}
                </div>
            ),
        },

        /*
        |--------------------------------------------------------------------------
        | QUARTER
        |--------------------------------------------------------------------------
        */

        {
            id: 'quarter',

            accessorFn: (row) =>
                row.reporting_period.quarter.code,

            header: ({ column }) => (
                <button
                    className="flex items-center gap-1"
                    onClick={() =>
                        column.toggleSorting(
                            column.getIsSorted() === 'asc',
                        )
                    }
                >
                    Quarter

                    <span>
                        {column.getIsSorted() === 'asc'
                            ? '↑'
                            : column.getIsSorted() === 'desc'
                              ? '↓'
                              : '↕'}
                    </span>
                </button>
            ),

            cell: ({ row }) => (
                <div>
                    {row.original.reporting_period.quarter.name}
                </div>
            ),
        },

        /*
        |--------------------------------------------------------------------------
        | SUBMISSION STATUS
        |--------------------------------------------------------------------------
        */

        {
            id: 'status',

            accessorFn: (row) =>
                row.status?.code ?? '',

            header: ({ column }) => (
                <button
                    className="flex items-center gap-1"
                    onClick={() =>
                        column.toggleSorting(
                            column.getIsSorted() === 'asc',
                        )
                    }
                >
                    Status

                    <span>
                        {column.getIsSorted() === 'asc'
                            ? '↑'
                            : column.getIsSorted() === 'desc'
                              ? '↓'
                              : '↕'}
                    </span>
                </button>
            ),

            cell: ({ row }) => {
                const status =
                    row.original.status?.code

                return (
                    <span className={getStatusClass(status)}>
                        {row.original.status?.name ?? 'Unknown'}
                    </span>
                )
            },
        },

        /*
        |--------------------------------------------------------------------------
        | FHSIS VALIDATION
        |--------------------------------------------------------------------------
        |
        | This column is retained for compatibility with the existing
        | HWPSC/FHSIS workflow.
        |
        */

        {
            id: 'validation',

            accessorFn: (row) =>
                row.validation_status ?? 'not_checked',

            header: ({ column }) => (
                <button
                    className="flex items-center gap-1"
                    onClick={() =>
                        column.toggleSorting(
                            column.getIsSorted() === 'asc',
                        )
                    }
                >
                    FHSIS Validation

                    <span>
                        {column.getIsSorted() === 'asc'
                            ? '↑'
                            : column.getIsSorted() === 'desc'
                              ? '↓'
                              : '↕'}
                    </span>
                </button>
            ),

            cell: ({ row }) => {
                const submission = row.original

                const validation =
                    submission.validation_status

                const hasDetails =
                    validation === 'discrepancy' ||
                    validation === 'not_comparable'

                const [open, setOpen] = useState(false)

                return (
                    <>
                        <div className="flex flex-col gap-1">
                            {hasDetails ? (
                                <button
                                    type="button"
                                    onClick={() => setOpen(true)}
                                    className="w-fit"
                                >
                                    <span
                                        className={`${getValidationClass(
                                            validation,
                                        )} cursor-pointer transition-opacity hover:opacity-80`}
                                    >
                                        {getValidationLabel(
                                            validation,
                                        )}
                                    </span>
                                </button>
                            ) : (
                                <span
                                    className={getValidationClass(
                                        validation,
                                    )}
                                >
                                    {getValidationLabel(
                                        validation,
                                    )}
                                </span>
                            )}

                            {validation === 'validated' &&
                                submission.validated_at && (
                                    <span className="text-xs text-gray-500">
                                        {formatDateTime(
                                            submission.validated_at,
                                        )}
                                    </span>
                                )}
                        </div>

                        <ValidationDetailsModal
                            submission={submission}
                            open={open}
                            onOpenChange={setOpen}
                        />
                    </>
                )
            },
        },

        /*
        |--------------------------------------------------------------------------
        | ACTIONS
        |--------------------------------------------------------------------------
        */

        {
            id: 'actions',

            header: () => (
                <div>
                    Actions
                </div>
            ),

            enableSorting: false,
            enableHiding: false,

            cell: ({ row }) => (
                <ActionsCell
                    submission={row.original}
                    reportType={reportType}
                />
            ),
        },
    ]
}

/*
|--------------------------------------------------------------------------
| Validation Details Modal
|--------------------------------------------------------------------------
*/

function ValidationDetailsModal({
    submission,
    open,
    onOpenChange,
}: {
    submission: Submission
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const details =
        submission.validation_details ?? []

    const isDiscrepancy =
        submission.validation_status === 'discrepancy'

    const isNotComparable =
        submission.validation_status === 'not_comparable'

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isDiscrepancy
                            ? 'FHSIS Discrepancy Details'
                            : isNotComparable
                              ? 'FHSIS Validation Details'
                              : 'Validation Details'}
                    </DialogTitle>

                    <DialogDescription>
                        {submission.lgu.name} —{' '}
                        {submission.reporting_period.year}{' '}
                        {submission.reporting_period.quarter.name}
                    </DialogDescription>
                </DialogHeader>

                {/* Reason */}
                <div
                    className={`rounded-lg border p-4 ${
                        isDiscrepancy
                            ? 'border-red-200 bg-red-50'
                            : 'border-yellow-200 bg-yellow-50'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        {isDiscrepancy ? (
                            <FileWarning className="mt-0.5 h-5 w-5 text-red-600" />
                        ) : (
                            <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
                        )}

                        <div>
                            <h3
                                className={`font-semibold ${
                                    isDiscrepancy
                                        ? 'text-red-800'
                                        : 'text-yellow-800'
                                }`}
                            >
                                {isDiscrepancy
                                    ? 'Why this report cannot be approved'
                                    : 'Why this report cannot be validated'}
                            </h3>

                            <p
                                className={`mt-1 text-sm ${
                                    isDiscrepancy
                                        ? 'text-red-700'
                                        : 'text-yellow-700'
                                }`}
                            >
                                {submission.validation_remarks ??
                                    'No validation remarks available.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Discrepancy Table */}
                {details.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-lg border">
                        <div className="border-b bg-gray-50 px-4 py-3">
                            <h3 className="font-semibold text-gray-900">
                                {isDiscrepancy
                                    ? 'Indicators with Discrepancies'
                                    : 'Indicators Requiring Attention'}
                            </h3>

                            <p className="text-sm text-gray-500">
                                LGU values are compared against the current
                                FHSIS values.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="px-4 py-3 text-left">
                                            Indicator
                                        </th>

                                        <th
                                            colSpan={3}
                                            className="border-l px-4 py-3 text-center"
                                        >
                                            LGU Report
                                        </th>

                                        <th
                                            colSpan={3}
                                            className="border-l px-4 py-3 text-center"
                                        >
                                            FHSIS
                                        </th>

                                        <th
                                            colSpan={3}
                                            className="border-l px-4 py-3 text-center"
                                        >
                                            Difference
                                        </th>
                                    </tr>

                                    <tr className="border-b bg-gray-50 text-xs text-gray-500">
                                        <th className="px-4 py-2" />

                                        <th className="border-l px-3 py-2">
                                            Male
                                        </th>

                                        <th className="px-3 py-2">
                                            Female
                                        </th>

                                        <th className="px-3 py-2">
                                            Total
                                        </th>

                                        <th className="border-l px-3 py-2">
                                            Male
                                        </th>

                                        <th className="px-3 py-2">
                                            Female
                                        </th>

                                        <th className="px-3 py-2">
                                            Total
                                        </th>

                                        <th className="border-l px-3 py-2">
                                            Male
                                        </th>

                                        <th className="px-3 py-2">
                                            Female
                                        </th>

                                        <th className="px-3 py-2">
                                            Total
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {details.map((detail) => (
                                        <tr
                                            key={detail.indicator_id}
                                            className="border-b last:border-0 hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">
                                                    {detail.indicator_name}
                                                </div>

                                                <div className="text-xs text-gray-500">
                                                    {detail.indicator_code}
                                                </div>
                                            </td>

                                            {/* LGU */}
                                            <td className="border-l px-3 py-3 text-center">
                                                {detail.lgu.male ?? '—'}
                                            </td>

                                            <td className="px-3 py-3 text-center">
                                                {detail.lgu.female ?? '—'}
                                            </td>

                                            <td className="px-3 py-3 text-center font-medium">
                                                {detail.lgu.total ?? '—'}
                                            </td>

                                            {/* FHSIS */}
                                            <td className="border-l px-3 py-3 text-center">
                                                {detail.fhsis.male ?? '—'}
                                            </td>

                                            <td className="px-3 py-3 text-center">
                                                {detail.fhsis.female ?? '—'}
                                            </td>

                                            <td className="px-3 py-3 text-center font-medium">
                                                {detail.fhsis.total ?? '—'}
                                            </td>

                                            {/* Difference */}
                                            <td className="border-l bg-red-50 px-3 py-3 text-center font-semibold text-red-600">
                                                {detail.difference.male ??
                                                    '—'}
                                            </td>

                                            <td className="bg-red-50 px-3 py-3 text-center font-semibold text-red-600">
                                                {detail.difference.female ??
                                                    '—'}
                                            </td>

                                            <td className="bg-red-50 px-3 py-3 text-center font-semibold text-red-600">
                                                {detail.difference.total ??
                                                    '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Validation metadata */}
                <div className="grid gap-4 rounded-lg border bg-gray-50 p-4 md:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium uppercase text-gray-500">
                            Validation Status
                        </p>

                        <p className="mt-1 font-semibold">
                            {getValidationLabel(
                                submission.validation_status,
                            )}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase text-gray-500">
                            Validated By
                        </p>

                        <p className="mt-1 font-semibold">
                            {submission.validator?.name ?? '—'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase text-gray-500">
                            Validated At
                        </p>

                        <p className="mt-1 font-semibold">
                            {formatDateTime(
                                submission.validated_at,
                            )}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase text-gray-500">
                            Indicators Affected
                        </p>

                        <p className="mt-1 font-semibold">
                            {details.length}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}