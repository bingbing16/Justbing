import { Head, Link, router, useForm } from '@inertiajs/react'
import {
    AlertTriangle,
    CheckCircle2,
    FileSpreadsheet,
    Upload,
    X,
} from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { route } from 'ziggy-js'

interface ReportingPeriodPreview {
    id: number
    year: number
    quarter_id: number
    quarter_code: string
    quarter_name: string
    start_date: string | null
    end_date: string | null
}

interface ImportValue {
    indicator_id: number
    indicator_code: string
    indicator_name: string
    male: number
    female: number
    total: number
    source_row: number
}

interface ImportWarning {
    type: string
    quarter?: string
    indicator?: string
    gender?: string
    source_label?: string
}

interface QuarterChange {
    indicator_id: number
    indicator_name: string

    old_male: number | null
    old_female: number | null
    old_total: number | null

    new_male: number | null
    new_female: number | null
    new_total: number | null

    change_type: 'added' | 'changed' | 'removed'
}

interface QuarterStatus {
    status:
        | 'new'
        | 'unchanged'
        | 'changed'
        | 'no_data'

    label:
        | 'New'
        | 'Unchanged'
        | 'Changed'
        | 'No Data'

    submission_id: number | null
    submission_status: string | null
    submission_status_name?: string | null

    indicator_count: number
    changed_count: number

    can_import: boolean
    can_update: boolean

    changes?: QuarterChange[]
}

interface ImportPreview {
    report_type_id: number
    report_type_code: string
    report_type_name: string

    lgu_id: number
    lgu_name: string | null

    year: number | null

    quarters: {
        Q1: ImportValue[]
        Q2: ImportValue[]
        Q3: ImportValue[]
        Q4: ImportValue[]
    }

    quarter_status?: {
        Q1: QuarterStatus
        Q2: QuarterStatus
        Q3: QuarterStatus
        Q4: QuarterStatus
    }

    reporting_periods?: {
        Q1?: ReportingPeriodPreview
        Q2?: ReportingPeriodPreview
        Q3?: ReportingPeriodPreview
        Q4?: ReportingPeriodPreview
    }

    warnings: ImportWarning[]
}

interface ReportType {
    id: number
    code: string
    name: string
    slug: string
}

interface Props {
    reportType: ReportType
    preview?: ImportPreview
}

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const

const quarterStatusStyles = {
    new: {
        badge:
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        icon: '→',
    },

    changed: {
        badge:
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: '↻',
    },

    unchanged: {
        badge:
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        icon: '✓',
    },

    no_data: {
        badge:
            'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
        icon: '○',
    },
} as const

export default function Import({ reportType, preview }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null)

    const [clientError, setClientError] =
        useState<string | null>(null)

    const form = useForm<{ file: File | null }>({
        file: null,
    })

    /*
     * ==========================================
     * FILE SELECTION
     * ==========================================
     */

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file =
            event.target.files?.[0] ?? null

        setClientError(null)

        if (!file) {
            setSelectedFile(null)
            form.setData('file', null)

            return
        }

        const allowedExtensions = [
            '.xlsx',
            '.xls',
        ]

        const extension = file.name
            .substring(
                file.name.lastIndexOf('.')
            )
            .toLowerCase()

        if (
            !allowedExtensions.includes(
                extension
            )
        ) {
            setClientError(
                'Please select a valid Excel file (.xlsx or .xls).'
            )

            setSelectedFile(null)
            form.setData('file', null)

            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            return
        }

        if (
            file.size >
            10 * 1024 * 1024
        ) {
            setClientError(
                'The selected file is larger than 10 MB.'
            )

            setSelectedFile(null)
            form.setData('file', null)

            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            return
        }

        setSelectedFile(file)

        form.setData(
            'file',
            file
        )
    }

    const removeFile = () => {
        setSelectedFile(null)
        setClientError(null)

        form.setData(
            'file',
            null
        )

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    /*
     * ==========================================
     * PREVIEW UPLOAD
     * ==========================================
     */

    const submit = (
        event: React.FormEvent
    ) => {
        event.preventDefault()

        setClientError(null)

        if (!selectedFile) {
            setClientError(
                'Please select an Excel file before continuing.'
            )

            return
        }

        form.post(
            `/justine/reports/${reportType.slug}/import`,
            {
                forceFormData: true,
                preserveScroll: true,
            }
        )
    }

    /*
     * ==========================================
     * CONFIRM IMPORT
     * ==========================================
     */

    const confirmImport = () => {
        router.post(
            `/justine/reports/${reportType.slug}/import/confirm`,
            {},
            {
                preserveScroll: true,
            }
        )
    }

    /*
     * ==========================================
     * SUMMARY COUNTS
     * ==========================================
     */

    const totalValues = preview
        ? Object.values(
              preview.quarters ?? {}
          ).reduce(
              (total, values) =>
                  total + values.length,
              0
          )
        : 0

    const quarterStatuses = preview
        ? Object.values(
              preview.quarter_status ?? {}
          )
        : []

    const newCount =
        quarterStatuses.filter(
            (item) =>
                item.status === 'new'
        ).length

    const changedCount =
        quarterStatuses.filter(
            (item) =>
                item.status === 'changed'
        ).length

    const unchangedCount =
        quarterStatuses.filter(
            (item) =>
                item.status === 'unchanged'
        ).length

    const noDataCount =
        quarterStatuses.filter(
            (item) =>
                item.status === 'no_data'
        ).length

    const changedUpdatableCount =
        quarterStatuses.filter(
            (item) =>
                item.status === 'changed' &&
                item.can_update
        ).length

    const changedLockedCount =
        quarterStatuses.filter(
            (item) =>
                item.status === 'changed' &&
                !item.can_update
        ).length

    const hasNewQuarters =
        quarterStatuses.some(
            (item) =>
                item.status === 'new'
        )

    const hasUpdatableQuarters =
        quarterStatuses.some(
            (item) =>
                item.status === 'changed' &&
                item.can_update
        )

    const hasImportableChanges =
        hasNewQuarters ||
        hasUpdatableQuarters

    const newValuesCount = preview
        ? quarters.reduce(
              (total, quarter) => {
                  const status =
                      preview.quarter_status?.[
                          quarter
                      ]

                  if (
                      status?.status !==
                      'new'
                  ) {
                      return total
                  }

                  return (
                      total +
                      (
                          preview.quarters?.[
                              quarter
                          ] ?? []
                      ).length
                  )
              },
              0
          )
        : 0

    /*
     * ==========================================
     * RENDER
     * ==========================================
     */

    return (
        <>
            <Head title={`Import ${reportType.name} Report`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">

                {/* =====================================================
                    UPLOAD FORM
                ====================================================== */}

                {!preview && (
                    <div className="max-w-3xl">
                        <Card>

                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5" />

                                    Excel Report
                                </CardTitle>

                                <CardDescription>
                                    Select a {reportType.name} LGU Quarterly
                                    Reporting Excel file. The system
                                    will read and validate the report
                                    before saving it.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <form
                                    onSubmit={
                                        submit
                                    }
                                    className="space-y-6"
                                >

                                    {/* File input */}

                                    <div className="space-y-2">

                                        <Label htmlFor="file">
                                            Excel File
                                        </Label>

                                        <Input
                                            ref={
                                                fileInputRef
                                            }
                                            id="file"
                                            name="file"
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={
                                                handleFileChange
                                            }
                                            disabled={
                                                form.processing
                                            }
                                        />

                                        <p className="text-xs text-muted-foreground">
                                            Accepted formats:
                                            {' '}
                                            .xlsx and .xls.
                                            Maximum file size:
                                            {' '}
                                            10 MB.
                                        </p>

                                        {form.errors.file && (
                                            <p className="text-sm text-red-500">
                                                {
                                                    form.errors.file
                                                }
                                            </p>
                                        )}

                                        {clientError && (
                                            <p className="text-sm text-red-500">
                                                {
                                                    clientError
                                                }
                                            </p>
                                        )}

                                    </div>

                                    {/* Selected file */}

                                    {selectedFile && (
                                        <div className="rounded-lg border bg-muted/30 p-4">

                                            <div className="flex items-center justify-between gap-4">

                                                <div className="flex min-w-0 items-center gap-3">

                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">

                                                        <FileSpreadsheet className="h-5 w-5" />

                                                    </div>

                                                    <div className="min-w-0">

                                                        <p className="truncate text-sm font-medium">
                                                            {
                                                                selectedFile.name
                                                            }
                                                        </p>

                                                        <p className="text-xs text-muted-foreground">
                                                            {formatFileSize(
                                                                selectedFile.size
                                                            )}
                                                        </p>

                                                    </div>

                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={
                                                        removeFile
                                                    }
                                                    disabled={
                                                        form.processing
                                                    }
                                                    aria-label="Remove selected file"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>

                                            </div>

                                        </div>
                                    )}

                                    {/* What happens */}

                                    <div className="rounded-lg border p-4">

                                        <div className="flex gap-3">

                                            <Upload className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                                            <div className="space-y-1">

                                                <p className="text-sm font-medium">
                                                    What happens next?
                                                </p>

                                                <p className="text-sm text-muted-foreground">
                                                    The Excel file will
                                                    be read and checked
                                                    against the
                                                    configured {reportType.name}
                                                    report indicators.
                                                    You will see an
                                                    import preview before
                                                    any report is saved.
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                    {/* Buttons */}

                                    <div className="flex items-center justify-end gap-3">

                                        <Button
                                            type="button"
                                            variant="outline"
                                            asChild
                                            disabled={
                                                form.processing
                                            }
                                        >
                                            <Link href={`/justine/reports/${reportType.slug}`}>
                                                Cancel
                                            </Link>
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={
                                                !selectedFile ||
                                                form.processing
                                            }
                                        >
                                            <Upload className="mr-2 h-4 w-4" />

                                            {form.processing
                                                ? 'Reading File...'
                                                : 'Preview Import'}
                                        </Button>

                                    </div>

                                </form>
                            </CardContent>

                        </Card>
                    </div>
                )}

                {/* =====================================================
                    IMPORT PREVIEW
                ====================================================== */}

                {preview && (
                    <div className="space-y-6">

                        {/* =================================================
                            REPORT INFORMATION
                        ================================================== */}

                        <Card>

                            <CardHeader>
                                <CardTitle>
                                    Import Preview
                                </CardTitle>

                                <CardDescription>
                                    Review the data detected from the
                                    Excel file before importing it.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>

                                <div className="grid gap-6 md:grid-cols-3">

                                    <div className="space-y-1">

                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Report Type
                                        </p>

                                        <p className="font-semibold">
                                            {
                                                preview.report_type_name
                                            }
                                        </p>

                                    </div>

                                    <div className="space-y-1">

                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            LGU
                                        </p>

                                        <p className="font-semibold">
                                            {
                                                preview.lgu_name ??
                                                'Not detected'
                                            }
                                        </p>

                                    </div>

                                    <div className="space-y-1">

                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Year
                                        </p>

                                        <p className="font-semibold">
                                            {
                                                preview.year ??
                                                'Not detected'
                                            }
                                        </p>

                                    </div>

                                </div>

                            </CardContent>

                        </Card>

                        {/* =================================================
                            IMPORT SUMMARY
                        ================================================== */}

                        <Card>

                            <CardHeader>
                                <CardTitle>
                                    Import Summary
                                </CardTitle>

                                <CardDescription>
                                    Each quarter is compared against
                                    the existing {reportType.name} report in the
                                    database.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                                    {/* New */}

                                    <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">

                                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                                            {
                                                newCount
                                            }
                                        </div>

                                        <div className="text-sm text-green-700 dark:text-green-400">
                                            New
                                        </div>

                                        <p className="mt-1 text-xs text-green-600/80 dark:text-green-400/70">
                                            New quarter
                                            {newCount !==
                                            1
                                                ? 's'
                                                : ''}{' '}
                                            ready to
                                            import
                                        </p>

                                    </div>

                                    {/* Changed */}

                                    <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">

                                        <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                                            {
                                                changedCount
                                            }
                                        </div>

                                        <div className="text-sm text-yellow-700 dark:text-yellow-400">
                                            Changed
                                        </div>

                                        <p className="mt-1 text-xs text-yellow-600/80 dark:text-yellow-400/70">
                                            Existing quarter
                                            {changedCount !==
                                            1
                                                ? 's'
                                                : ''}{' '}
                                            with changes
                                        </p>

                                    </div>

                                    {/* Unchanged */}

                                    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">

                                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                            {
                                                unchangedCount
                                            }
                                        </div>

                                        <div className="text-sm text-blue-700 dark:text-blue-400">
                                            Unchanged
                                        </div>

                                        <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/70">
                                            No changes
                                            detected
                                        </p>

                                    </div>

                                    {/* No data */}

                                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">

                                        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                                            {
                                                noDataCount
                                            }
                                        </div>

                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            No Data
                                        </div>

                                        <p className="mt-1 text-xs text-gray-500">
                                            No quarterly
                                            values
                                        </p>

                                    </div>

                                </div>

                                {/* Ready */}

                                {hasImportableChanges && (
                                    <div className="mt-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">

                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />

                                        <div>

                                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                                Changes ready
                                                to import
                                            </p>

                                            <p className="mt-1 text-sm text-green-600 dark:text-green-400">

                                                {newCount >
                                                0 && (
                                                    <>
                                                        {
                                                            newCount
                                                        }{' '}
                                                        new
                                                        quarter
                                                        {newCount !==
                                                        1
                                                            ? 's'
                                                            : ''}
                                                    </>
                                                )}

                                                {newCount >
                                                    0 &&
                                                    changedUpdatableCount >
                                                        0 &&
                                                    ' and '}

                                                {changedUpdatableCount >
                                                0 && (
                                                    <>
                                                        {
                                                            changedUpdatableCount
                                                        }{' '}
                                                        changed
                                                        quarter
                                                        {changedUpdatableCount !==
                                                        1
                                                            ? 's'
                                                            : ''}
                                                    </>
                                                )}

                                                {' '}
                                                will be
                                                imported.
                                            </p>

                                            {newValuesCount >
                                                0 && (
                                                <p className="mt-1 text-xs text-green-600/80 dark:text-green-400/70">
                                                    {
                                                        newValuesCount
                                                    }{' '}
                                                    new
                                                    indicator
                                                    values
                                                    detected.
                                                </p>
                                            )}

                                        </div>

                                    </div>
                                )}

                                {/* Nothing */}

                                {!hasImportableChanges && (
                                    <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">

                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />

                                        <div>

                                            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                                Nothing new
                                                to import
                                            </p>

                                            <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                                                All detected
                                                quarters are
                                                either unchanged
                                                or cannot be
                                                overwritten.
                                            </p>

                                        </div>

                                    </div>
                                )}

                                {/* Locked */}

                                {changedLockedCount >
                                    0 && (
                                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">

                                        <div className="flex gap-3">

                                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />

                                            <div>

                                                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                                    Some changed
                                                    reports cannot
                                                    be overwritten
                                                </p>

                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                    {
                                                        changedLockedCount
                                                    }{' '}
                                                    quarter
                                                    {changedLockedCount !==
                                                    1
                                                        ? 's'
                                                        : ''}{' '}
                                                    has changed
                                                    data, but the
                                                    existing report
                                                    is already
                                                    Submitted or
                                                    Approved.
                                                </p>

                                                <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
                                                    Those reports
                                                    will remain
                                                    unchanged.
                                                </p>

                                            </div>

                                        </div>

                                    </div>
                                )}

                            </CardContent>

                        </Card>

                        {/* =================================================
                            QUARTER STATUS
                        ================================================== */}

                        <div>

                            <div className="mb-3">

                                <h2 className="text-lg font-semibold">
                                    Quarter Status
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    Each quarter is compared with the
                                    existing report for the same LGU,
                                    year, and reporting period.
                                </p>

                            </div>

                            <div className="grid gap-4 md:grid-cols-4">

                                {quarters.map(
                                    (
                                        quarter
                                    ) => {

                                        const status =
                                            preview
                                                .quarter_status?.[
                                                quarter
                                            ]

                                        const values =
                                            preview
                                                .quarters?.[
                                                quarter
                                            ] ?? []

                                        /*
                                         * Fallback if the backend
                                         * did not provide status.
                                         */

                                        if (!status) {

                                            const fallbackStatus =
                                                values.length >
                                                0
                                                    ? 'new'
                                                    : 'no_data'

                                            const fallbackStyle =
                                                quarterStatusStyles[
                                                    fallbackStatus
                                                ]

                                            return (
                                                <div
                                                    key={
                                                        quarter
                                                    }
                                                    className="rounded-xl border bg-white p-5 shadow-sm dark:bg-card"
                                                >

                                                    <div className="flex items-start justify-between gap-4">

                                                        <div>

                                                            <h3 className="text-lg font-semibold">
                                                                {
                                                                    quarter
                                                                }
                                                            </h3>

                                                            <p className="text-sm text-muted-foreground">
                                                                {
                                                                    preview.year
                                                                }
                                                            </p>

                                                        </div>

                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${fallbackStyle.badge}`}
                                                        >

                                                            <span>
                                                                {
                                                                    fallbackStyle.icon
                                                                }
                                                            </span>

                                                            {
                                                                fallbackStatus ===
                                                                'new'
                                                                    ? 'New'
                                                                    : 'No Data'
                                                            }

                                                        </span>

                                                    </div>

                                                </div>
                                            )
                                        }

                                        const style =
                                            quarterStatusStyles[
                                                status.status
                                            ]

                                        return (
                                            <div
                                                key={
                                                    quarter
                                                }
                                                className="rounded-xl border bg-white p-5 shadow-sm dark:bg-card"
                                            >

                                                <div className="flex items-start justify-between gap-4">

                                                    <div>

                                                        <h3 className="text-lg font-semibold">
                                                            {
                                                                quarter
                                                            }
                                                        </h3>

                                                        <p className="text-sm text-muted-foreground">
                                                            {
                                                                preview.year
                                                            }
                                                        </p>

                                                    </div>

                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${style.badge}`}
                                                    >

                                                        <span>
                                                            {
                                                                style.icon
                                                            }
                                                        </span>

                                                        {
                                                            status.label
                                                        }

                                                    </span>

                                                </div>

                                                {/* NEW */}

                                                {status.status ===
                                                    'new' && (
                                                    <div className="mt-4">

                                                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                                            New data
                                                            detected
                                                        </p>

                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {
                                                                status.indicator_count
                                                            }{' '}
                                                            indicator
                                                            {status.indicator_count !==
                                                            1
                                                                ? 's'
                                                                : ''}{' '}
                                                            detected.
                                                        </p>

                                                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                                            Ready to
                                                            import as
                                                            Draft.
                                                        </p>

                                                    </div>
                                                )}

                                                {/* CHANGED */}

                                                {status.status ===
                                                    'changed' && (
                                                    <div className="mt-4 space-y-3">

                                                        <div>

                                                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                                                                Changes
                                                                detected
                                                            </p>

                                                            <p className="mt-1 text-sm text-muted-foreground">
                                                                {
                                                                    status.changed_count
                                                                }{' '}
                                                                indicator
                                                                {status.changed_count !==
                                                                1
                                                                    ? 's'
                                                                    : ''}{' '}
                                                                changed.
                                                            </p>

                                                        </div>

                                                        {status.submission_status_name && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Existing
                                                                report #
                                                                {
                                                                    status.submission_id
                                                                }
                                                                {' · '}
                                                                {
                                                                    status.submission_status_name
                                                                }
                                                            </p>
                                                        )}

                                                        {status.can_update ? (
                                                            <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                                                This
                                                                report
                                                                can be
                                                                updated
                                                                because
                                                                it is
                                                                Draft or
                                                                Rejected.
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                                                This
                                                                report
                                                                will not
                                                                be
                                                                overwritten
                                                                because
                                                                it is
                                                                already
                                                                Submitted
                                                                or
                                                                Approved.
                                                            </p>
                                                        )}

                                                    </div>
                                                )}

                                                {/* UNCHANGED */}

                                                {status.status ===
                                                    'unchanged' && (
                                                    <div className="mt-4">

                                                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                                            No changes
                                                            detected
                                                        </p>

                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {
                                                                status.indicator_count
                                                            }{' '}
                                                            indicator
                                                            {status.indicator_count !==
                                                            1
                                                                ? 's'
                                                                : ''}{' '}
                                                            matches the
                                                            existing
                                                            report.
                                                        </p>

                                                        {status.submission_status_name && (
                                                            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                                                Existing
                                                                report #
                                                                {
                                                                    status.submission_id
                                                                }
                                                                {' · '}
                                                                {
                                                                    status.submission_status_name
                                                                }
                                                            </p>
                                                        )}

                                                    </div>
                                                )}

                                                {/* NO DATA */}

                                                {status.status ===
                                                    'no_data' && (
                                                    <div className="mt-4">

                                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                            No data
                                                            detected
                                                        </p>

                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            No
                                                            quarterly
                                                            values
                                                            were found
                                                            in the
                                                            Excel file.
                                                        </p>

                                                    </div>
                                                )}

                                                {values.length >
                                                    0 && (
                                                    <div className="mt-4 border-t pt-3">

                                                        <div className="flex justify-between text-xs text-muted-foreground">

                                                            <span>
                                                                Indicators
                                                            </span>

                                                            <span>
                                                                {
                                                                    values.length
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>
                                                )}

                                            </div>
                                        )
                                    }
                                )}

                            </div>

                        </div>

                        {/* =================================================
                            CHANGED VALUES
                        ================================================== */}

                        {quarters.map(
                            (quarter) => {

                                const status =
                                    preview
                                        .quarter_status?.[
                                        quarter
                                    ]

                                if (
                                    status?.status !==
                                        'changed' ||
                                    !status.changes?.length
                                ) {
                                    return null
                                }

                                return (
                                    <Card
                                        key={`${quarter}-changes`}
                                        className="border-yellow-300 dark:border-yellow-800"
                                    >

                                        <CardHeader>

                                            <CardTitle className="text-yellow-700 dark:text-yellow-400">
                                                {
                                                    quarter
                                                }{' '}
                                                Changes
                                            </CardTitle>

                                            <CardDescription>
                                                Differences between
                                                the uploaded Excel
                                                file and the existing
                                                database report.
                                            </CardDescription>

                                        </CardHeader>

                                        <CardContent>

                                            <div className="overflow-x-auto">

                                                <table className="w-full text-sm">

                                                    <thead>

                                                        <tr className="border-b bg-muted/30 text-left">

                                                            <th className="p-3 font-medium">
                                                                Indicator
                                                            </th>

                                                            <th className="p-3 text-right font-medium">
                                                                Old Male
                                                            </th>

                                                            <th className="p-3 text-right font-medium">
                                                                New Male
                                                            </th>

                                                            <th className="p-3 text-right font-medium">
                                                                Old Female
                                                            </th>

                                                            <th className="p-3 text-right font-medium">
                                                                New Female
                                                            </th>

                                                            <th className="p-3 font-medium">
                                                                Change
                                                            </th>

                                                        </tr>

                                                    </thead>

                                                    <tbody>

                                                        {status.changes.map(
                                                            (
                                                                change
                                                            ) => (
                                                                <tr
                                                                    key={`${quarter}-${change.indicator_id}`}
                                                                    className="border-b last:border-0"
                                                                >

                                                                    <td className="p-3 font-medium">
                                                                        {
                                                                            change.indicator_name
                                                                        }
                                                                    </td>

                                                                    <td className="p-3 text-right">
                                                                        {
                                                                            change.old_male ??
                                                                            '—'
                                                                        }
                                                                    </td>

                                                                    <td className="p-3 text-right font-semibold text-yellow-700 dark:text-yellow-400">
                                                                        {
                                                                            change.new_male ??
                                                                            '—'
                                                                        }
                                                                    </td>

                                                                    <td className="p-3 text-right">
                                                                        {
                                                                            change.old_female ??
                                                                            '—'
                                                                        }
                                                                    </td>

                                                                    <td className="p-3 text-right font-semibold text-yellow-700 dark:text-yellow-400">
                                                                        {
                                                                            change.new_female ??
                                                                            '—'
                                                                        }
                                                                    </td>

                                                                    <td className="p-3">

                                                                        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                                            {
                                                                                change.change_type
                                                                            }
                                                                        </span>

                                                                    </td>

                                                                </tr>
                                                            )
                                                        )}

                                                    </tbody>

                                                </table>

                                            </div>

                                        </CardContent>

                                    </Card>
                                )
                            }
                        )}

                        {/* =================================================
                            DETECTED VALUES
                        ================================================== */}

                        <Card>

                            <CardHeader>

                                <CardTitle>
                                    Detected Values from Excel
                                </CardTitle>

                                <CardDescription>
                                    {totalValues}{' '}
                                    quarterly indicator
                                    {totalValues !==
                                    1
                                        ? ' values'
                                        : ' value'}{' '}
                                    detected from the uploaded
                                    Excel file.
                                </CardDescription>

                            </CardHeader>

                            <CardContent>

                                {totalValues ===
                                0 ? (
                                    <div className="rounded-lg border border-dashed p-8 text-center">

                                        <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground" />

                                        <p className="mt-2 text-sm font-medium">
                                            No values
                                            detected
                                        </p>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            The Excel file does not
                                            contain any quarterly
                                            indicator values.
                                        </p>

                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">

                                        <table className="w-full text-sm">

                                            <thead>

                                                <tr className="border-b bg-muted/30 text-left">

                                                    <th className="p-3 font-medium">
                                                        Quarter
                                                    </th>

                                                    <th className="p-3 font-medium">
                                                        Indicator
                                                    </th>

                                                    <th className="p-3 text-right font-medium">
                                                        Male
                                                    </th>

                                                    <th className="p-3 text-right font-medium">
                                                        Female
                                                    </th>

                                                    <th className="p-3 text-right font-medium">
                                                        Total
                                                    </th>

                                                    <th className="p-3 font-medium">
                                                        Excel Row
                                                    </th>

                                                </tr>

                                            </thead>

                                            <tbody>

                                                {quarters.flatMap(
                                                    (
                                                        quarter
                                                    ) =>
                                                        (
                                                            preview
                                                                .quarters?.[
                                                                quarter
                                                            ] ??
                                                            []
                                                        ).map(
                                                            (
                                                                value
                                                            ) => {

                                                                const status =
                                                                    preview
                                                                        .quarter_status?.[
                                                                        quarter
                                                                    ]

                                                                return (
                                                                    <tr
                                                                        key={`${quarter}-${value.indicator_id}`}
                                                                        className="border-b last:border-0"
                                                                    >

                                                                        <td className="p-3">

                                                                            <div className="flex items-center gap-2">

                                                                                <span className="font-medium">
                                                                                    {
                                                                                        quarter
                                                                                    }
                                                                                </span>

                                                                                {status?.status ===
                                                                                    'new' && (
                                                                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                                        New
                                                                                    </span>
                                                                                )}

                                                                                {status?.status ===
                                                                                    'changed' && (
                                                                                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                                                        Changed
                                                                                    </span>
                                                                                )}

                                                                                {status?.status ===
                                                                                    'unchanged' && (
                                                                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                                                        Unchanged
                                                                                    </span>
                                                                                )}

                                                                            </div>

                                                                        </td>

                                                                        <td className="p-3">
                                                                            {
                                                                                value.indicator_name
                                                                            }
                                                                        </td>

                                                                        <td className="p-3 text-right">
                                                                            {value.male.toLocaleString()}
                                                                        </td>

                                                                        <td className="p-3 text-right">
                                                                            {value.female.toLocaleString()}
                                                                        </td>

                                                                        <td className="p-3 text-right font-medium">
                                                                            {value.total.toLocaleString()}
                                                                        </td>

                                                                        <td className="p-3 text-muted-foreground">
                                                                            {
                                                                                value.source_row
                                                                            }
                                                                        </td>

                                                                    </tr>
                                                                )
                                                            }
                                                        )
                                                )}

                                            </tbody>

                                        </table>

                                    </div>
                                )}

                            </CardContent>

                        </Card>

                        {/* =================================================
                            WARNINGS
                        ================================================== */}

                        {(
                            preview.warnings ??
                            []
                        ).length >
                            0 && (
                            <Card className="border-yellow-300 dark:border-yellow-800">

                                <CardHeader>

                                    <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">

                                        <AlertTriangle className="h-5 w-5" />

                                        Import Warnings

                                    </CardTitle>

                                    <CardDescription>
                                        These warnings should be
                                        reviewed before importing.
                                    </CardDescription>

                                </CardHeader>

                                <CardContent>

                                    <div className="space-y-2">

                                        {(
                                            preview.warnings ??
                                            []
                                        ).map(
                                            (
                                                warning,
                                                index
                                            ) => (

                                                <div
                                                    key={
                                                        index
                                                    }
                                                    className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-300"
                                                >

                                                    {warning.type ===
                                                        'missing_gender' && (
                                                        <>
                                                            {
                                                                warning.quarter
                                                            }{' '}
                                                            —{' '}
                                                            {
                                                                warning.indicator
                                                            }
                                                            :{' '}
                                                            {
                                                                warning.gender
                                                            }{' '}
                                                            value is
                                                            blank.
                                                            Treated as
                                                            0.
                                                        </>
                                                    )}

                                                    {warning.type ===
                                                        'missing_indicator' && (
                                                        <>
                                                            Indicator
                                                            not found
                                                            in Excel:{' '}
                                                            {
                                                                warning.indicator
                                                            }
                                                        </>
                                                    )}

                                                    {warning.type !==
                                                        'missing_gender' &&
                                                        warning.type !==
                                                            'missing_indicator' && (
                                                            <>
                                                                {
                                                                    warning.type
                                                                }{' '}
                                                                {
                                                                    warning.indicator ??
                                                                    ''
                                                                }
                                                            </>
                                                        )}

                                                </div>

                                            )
                                        )}

                                    </div>

                                </CardContent>

                            </Card>
                        )}

                        {/* =================================================
                            ACTIONS
                        ================================================== */}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">

                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    form.processing
                                }
                                onClick={() => {
                                    window.location.href =
                                        `/justine/reports/${reportType.slug}/import`
                                }}
                            >
                                Upload Different File
                            </Button>

                            <Button
                                type="button"
                                onClick={
                                    confirmImport
                                }
                                disabled={
                                    !hasImportableChanges ||
                                    form.processing
                                }
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />

                                {form.processing
                                    ? 'Importing...'
                                    : hasImportableChanges
                                      ? `Import Changes (${newCount + changedUpdatableCount})`
                                      : 'Nothing to Import'}
                            </Button>

                        </div>

                        {/* Explanation */}

                        {!hasImportableChanges && (
                            <p className="text-center text-xs text-muted-foreground">
                                No new or updateable changes were
                                detected. Unchanged reports will not
                                be imported again, and Submitted or
                                Approved reports with changes will
                                not be overwritten.
                            </p>
                        )}

                    </div>
                )}

            </div>
        </>
    )
}

/*
 * ==========================================
 * FILE SIZE FORMATTER
 * ==========================================
 */

function formatFileSize(
    bytes: number
): string {

    if (bytes === 0) {
        return '0 Bytes'
    }

    const units = [
        'Bytes',
        'KB',
        'MB',
        'GB',
    ]

    const index = Math.floor(
        Math.log(bytes) /
            Math.log(1024)
    )

    return `${parseFloat(
        (
            bytes /
            Math.pow(
                1024,
                index
            )
        ).toFixed(2)
    )} ${units[index]}`
}