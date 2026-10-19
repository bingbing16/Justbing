import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Database,
    FileSpreadsheet,
    Loader2,
    RefreshCw,
    Upload,
} from "lucide-react";

type Quarter = {
    id: number;
    code: string;
    name: string;
};

type Value = {
    indicator_id?: number;
    indicator_code?: string;
    indicator_name: string;
    male: number;
    female: number;
    total: number;
};

type Row = {
    lgu_id: number;
    lgu_name: string;
    psgc_code: string;
    values: Value[];
};

type ReplacementChange = {
    type: "new" | "updated";
    lgu_id: number;
    lgu_name: string;
    indicator_id: number;
    indicator_name: string;
    old: {
        male: number;
        female: number;
        total: number;
    } | null;
    new: {
        male: number;
        female: number;
        total: number;
    };
    difference: {
        male: number;
        female: number;
        total: number;
    };
};

type Replacement = {
    has_existing: boolean;
    is_identical: boolean;
    changed_count: number;
    unchanged_count: number;
    changes: ReplacementChange[];
};

type ExistingReport = {
    id: number;
    version: number;
    imported_at: string;
    file_name: string;
};

type Preview = {
    report_type_id?: number;
    report_type_code?: string;
    report_type_name?: string;
    year: number;
    quarter: Quarter;
    file_name: string;
    file_extension?: string;
    file_size?: number;
    lgu_count: number;
    indicator_count: number;
    rows: Row[];
    warnings: string[];

    existing_report?: ExistingReport | null;
    replacement?: Replacement;
};

type ReportType = {
    id: number
    code: string
    name: string
    slug: string
}

export default function Import({
    reportType,
    reportTypes,
    quarters,
    years,
    preview,
}: {
    reportType?: ReportType;
    reportTypes: ReportType[];
    quarters: Quarter[];
    years: number[];
    preview?: Preview;
}) {
    const [selectedReportType, setSelectedReportType] = useState(
        reportType?.slug ?? ""
    );

    const reportBaseUrl = selectedReportType
    ? `/justine/fhsis/${selectedReportType}/import`
    : "";

    const form = useForm<{
        file: File | null;
        year: string;
        quarter_id: string;
    }>({
        file: null,
        year: years[0]?.toString() ?? "",
        quarter_id: quarters[0]?.id.toString() ?? "",
    });

    const [fileName, setFileName] = useState("");

     const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedReportType) {
            return;
        }

        form.post(reportBaseUrl, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const confirm = () => {
        form.post(`${reportBaseUrl}/confirm`, {
            preserveScroll: true,
        })
    }

    const replaceExisting = () => {
        form.post(`${reportBaseUrl}/replace`, {
            forceFormData: true,
            preserveScroll: true,
        })
    }

    return (
        <>
            <Head title={reportType
                        ? `Import ${reportType.name} FHSIS`
                        : "Import FHSIS"
                }
            />

            <div className="flex flex-col gap-6 p-6">
                {/* =========================================================
                    HEADER
                ========================================================= */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                            >
                                <Link href="/justine/fhsis">
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {reportType
                                        ? `Import ${reportType.name} FHSIS`
                                        : "Import FHSIS"}
                                </h1>

                                <p className="text-sm text-muted-foreground">
                                    Import the FHSIS quarterly workbook for
                                    comparison with approved LGU reports.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =========================================================
                    UPLOAD FORM
                ========================================================= */}
                {!preview ? (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Report Information</CardTitle>

                                <div className="space-y-2">
                                    <Label>Report Type</Label>

                                    <Select
                                        value={selectedReportType}
                                        onValueChange={(value) => {
                                            setSelectedReportType(value);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select report type" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {reportTypes.map((type) => (
                                                <SelectItem
                                                    key={type.id}
                                                    value={type.slug}
                                                >
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <CardDescription>
                                    Select the reporting period and upload the
                                    FHSIS Excel workbook.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <form
                                    onSubmit={submit}
                                    className="space-y-6"
                                >
                                    {/* YEAR + QUARTER */}
                                    <div className="grid gap-5 md:grid-cols-2">
                                        {/* YEAR */}
                                        <div className="space-y-2">
                                            <Label>Year</Label>

                                            <Select
                                                value={form.data.year}
                                                onValueChange={(value) =>
                                                    form.setData(
                                                        "year",
                                                        value
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-full">
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

                                            {form.errors.year && (
                                                <p className="text-sm text-destructive">
                                                    {form.errors.year}
                                                </p>
                                            )}
                                        </div>

                                        {/* QUARTER */}
                                        <div className="space-y-2">
                                            <Label>Quarter</Label>

                                            <Select
                                                value={
                                                    form.data.quarter_id
                                                }
                                                onValueChange={(value) =>
                                                    form.setData(
                                                        "quarter_id",
                                                        value
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select quarter" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {quarters.map((quarter) => (
                                                        <SelectItem
                                                            key={quarter.id}
                                                            value={String(
                                                                quarter.id
                                                            )}
                                                        >
                                                            {quarter.code} —{" "}
                                                            {quarter.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {form.errors.quarter_id && (
                                                <p className="text-sm text-destructive">
                                                    {form.errors.quarter_id}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* FILE */}
                                    <div className="space-y-2">
                                        <Label>FHSIS Excel File</Label>

                                        <div className="rounded-lg border border-dashed p-6">
                                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                                <div className="rounded-full bg-muted p-3">
                                                    <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                                                </div>

                                                <div>
                                                    <p className="font-medium">
                                                        Select FHSIS Excel
                                                        workbook
                                                    </p>

                                                    <p className="text-sm text-muted-foreground">
                                                        .xlsx or .xls files up
                                                        to 10 MB
                                                    </p>
                                                </div>

                                                <Input
                                                    type="file"
                                                    accept=".xlsx,.xls"
                                                    className="max-w-md cursor-pointer"
                                                    onChange={(e) => {
                                                        const file =
                                                            e.target.files?.[0] ??
                                                            null;

                                                        form.setData(
                                                            "file",
                                                            file
                                                        );

                                                        setFileName(
                                                            file?.name ?? ""
                                                        );
                                                    }}
                                                />

                                                {fileName && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />

                                                        <span className="font-medium">
                                                            {fileName}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {form.errors.file && (
                                            <p className="text-sm text-destructive">
                                                {form.errors.file}
                                            </p>
                                        )}
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link href="/justine/fhsis">
                                                Cancel
                                            </Link>
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={
                                                form.processing ||
                                                !selectedReportType ||
                                                !form.data.file
                                            }
                                        >
                                            {form.processing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Reading Workbook...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Preview Import
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <>
                        {/* =================================================
                            IMPORT SUMMARY
                        ================================================= */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Import Summary</CardTitle>

                                <CardDescription>
                                    Review the detected FHSIS data before
                                    importing it into the system.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <SummaryItem
                                        label="Report"
                                        value={
                                            preview.report_type_name ??
                                            "HWPSC"
                                        }
                                    />

                                    <SummaryItem
                                        label="Year"
                                        value={String(preview.year)}
                                    />

                                    <SummaryItem
                                        label="Quarter"
                                        value={`${preview.quarter.code} — ${preview.quarter.name}`}
                                    />

                                    <SummaryItem
                                        label="LGUs Detected"
                                        value={String(preview.lgu_count)}
                                    />
                                </div>

                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <SummaryItem
                                        label="Mapped Indicators"
                                        value={String(
                                            preview.indicator_count
                                        )}
                                    />

                                    <SummaryItem
                                        label="Source File"
                                        value={preview.file_name}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* =================================================
                            WARNINGS
                        ================================================= */}
                        {preview.warnings.length > 0 && (
                            <Alert variant="default">
                                <AlertTriangle className="h-4 w-4" />

                                <AlertTitle>
                                    Import Warnings
                                </AlertTitle>

                                <AlertDescription>
                                    <ul className="mt-2 list-disc space-y-1 pl-5">
                                        {preview.warnings.map(
                                            (warning, index) => (
                                                <li key={index}>
                                                    {warning}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* =================================================
                            DETECTED LGUs
                        ================================================= */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>
                                            Detected LGUs
                                        </CardTitle>

                                        <CardDescription>
                                            LGUs found in the FHSIS workbook
                                            and matched to the system.
                                        </CardDescription>
                                    </div>

                                    <Badge variant="secondary">
                                        {preview.lgu_count} LGUs
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="rounded-md border">
                                    <div className="max-h-[500px] overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-muted/95">
                                                <tr className="border-b">
                                                    <th className="p-3 text-left font-medium">
                                                        PSGC
                                                    </th>

                                                    <th className="p-3 text-left font-medium">
                                                        LGU
                                                    </th>

                                                    <th className="p-3 text-center font-medium">
                                                        Indicators
                                                    </th>

                                                    <th className="p-3 text-center font-medium">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {preview.rows.map((row) => (
                                                    <tr
                                                        key={row.lgu_id}
                                                        className="border-b last:border-0"
                                                    >
                                                        <td className="p-3 font-mono text-xs">
                                                            {row.psgc_code}
                                                        </td>

                                                        <td className="p-3 font-medium">
                                                            {row.lgu_name}
                                                        </td>

                                                        <td className="p-3 text-center">
                                                            {row.values.length}
                                                        </td>

                                                        <td className="p-3 text-center">
                                                            <Badge
                                                                variant="outline"
                                                                className="gap-1 text-green-700"
                                                            >
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Ready
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {!preview.rows.length && (
                                                    <tr>
                                                        <td
                                                            colSpan={4}
                                                            className="p-8 text-center text-muted-foreground"
                                                        >
                                                            No matching LGUs
                                                            were detected.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* =================================================
                            EXISTING REPORT WARNING
                        ================================================= */}
                        {preview.replacement?.has_existing && (
                            <Card className="border-amber-300">
                                <CardContent className="p-6">
                                    <div className="flex gap-4">
                                        <div className="rounded-full bg-amber-100 p-3">
                                            <AlertTriangle className="h-5 w-5 text-amber-700" />
                                        </div>

                                        <div className="flex-1">
                                            <h2 className="font-semibold text-amber-800">
                                                Existing FHSIS Data Found
                                            </h2>

                                            <p className="mt-1 text-sm text-amber-700">
                                                This reporting period already has
                                                an imported FHSIS report.
                                            </p>

                                            {preview.existing_report && (
                                                <div className="mt-4 grid gap-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4 sm:grid-cols-3">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Current Version
                                                        </p>

                                                        <p className="mt-1 font-semibold">
                                                            Version{" "}
                                                            {
                                                                preview
                                                                    .existing_report
                                                                    .version
                                                            }
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Previous File
                                                        </p>

                                                        <p className="mt-1 truncate font-medium">
                                                            {
                                                                preview
                                                                    .existing_report
                                                                    .file_name
                                                            }
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Imported
                                                        </p>

                                                        <p className="mt-1 font-medium">
                                                            {
                                                                preview
                                                                    .existing_report
                                                                    .imported_at
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* =================================================
                            REPLACEMENT SUMMARY
                        ================================================= */}
                        {preview.replacement?.has_existing && (
                            <div className="grid gap-4 md:grid-cols-3">
                                {/* CHANGED */}
                                <Card className="border-amber-200">
                                    <CardContent className="p-5">
                                        <p className="text-sm text-muted-foreground">
                                            Changed Values
                                        </p>

                                        <p className="mt-2 text-3xl font-semibold text-amber-600">
                                            {
                                                preview.replacement
                                                    .changed_count
                                            }
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Values that will be updated
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* UNCHANGED */}
                                <Card>
                                    <CardContent className="p-5">
                                        <p className="text-sm text-muted-foreground">
                                            Unchanged Values
                                        </p>

                                        <p className="mt-2 text-3xl font-semibold">
                                            {
                                                preview.replacement
                                                    .unchanged_count
                                            }
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Values identical to current data
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* NEW VERSION */}
                                <Card>
                                    <CardContent className="p-5">
                                        <p className="text-sm text-muted-foreground">
                                            New Version
                                        </p>

                                        <p className="mt-2 text-3xl font-semibold">
                                            Version{" "}
                                            {(preview.existing_report?.version ??
                                                0) + 1}
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Will become the current FHSIS
                                            snapshot
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* =================================================
                            CHANGED VALUES
                        ================================================= */}
                        {preview.replacement?.has_existing &&
                            !preview.replacement.is_identical && (
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="border-b p-6">
                                            <h2 className="font-semibold">
                                                Changed Values
                                            </h2>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Only values that changed from
                                                the current FHSIS report are
                                                shown.
                                            </p>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b bg-muted/40">
                                                        <th className="px-5 py-3 text-left">
                                                            LGU
                                                        </th>

                                                        <th className="px-5 py-3 text-left">
                                                            Indicator
                                                        </th>

                                                        <th className="px-5 py-3 text-right">
                                                            Current
                                                        </th>

                                                        <th className="px-5 py-3 text-right">
                                                            Uploaded
                                                        </th>

                                                        <th className="px-5 py-3 text-right">
                                                            Difference
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {preview.replacement.changes.map(
                                                        (change, index) => (
                                                            <tr
                                                                key={`${change.lgu_id}-${change.indicator_id}-${index}`}
                                                                className="border-b bg-amber-50/30"
                                                            >
                                                                {/* LGU */}
                                                                <td className="px-5 py-4 font-medium">
                                                                    {
                                                                        change.lgu_name
                                                                    }
                                                                </td>

                                                                {/* INDICATOR */}
                                                                <td className="px-5 py-4">
                                                                    <div>
                                                                        {
                                                                            change.indicator_name
                                                                        }
                                                                    </div>

                                                                    <div className="text-xs text-muted-foreground">
                                                                        {change.type ===
                                                                        "new"
                                                                            ? "New"
                                                                            : "Updated"}
                                                                    </div>
                                                                </td>

                                                                {/* CURRENT */}
                                                                <td className="whitespace-nowrap px-5 py-4 text-right">
                                                                    {change.old
                                                                        ? `${change.old.male} / ${change.old.female} / ${change.old.total}`
                                                                        : "—"}
                                                                </td>

                                                                {/* UPLOADED */}
                                                                <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">
                                                                    {
                                                                        change
                                                                            .new
                                                                            .male
                                                                    }
                                                                    {" / "}
                                                                    {
                                                                        change
                                                                            .new
                                                                            .female
                                                                    }
                                                                    {" / "}
                                                                    {
                                                                        change
                                                                            .new
                                                                            .total
                                                                    }
                                                                </td>

                                                                {/* DIFFERENCE */}
                                                                <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-amber-700">
                                                                    {
                                                                        change
                                                                            .difference
                                                                            .male
                                                                    }
                                                                    {" / "}
                                                                    {
                                                                        change
                                                                            .difference
                                                                            .female
                                                                    }
                                                                    {" / "}
                                                                    {
                                                                        change
                                                                            .difference
                                                                            .total
                                                                    }
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        {/* =================================================
                            IDENTICAL DATA
                        ================================================= */}
                        {preview.replacement?.is_identical && (
                            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                <CheckCircle2 className="h-5 w-5" />

                                <AlertTitle>
                                    No Changes Detected
                                </AlertTitle>

                                <AlertDescription>
                                    The uploaded FHSIS workbook contains the
                                    same values as the current report for this
                                    reporting period. No new version is
                                    required.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* =================================================
                            ACTIONS
                        ================================================= */}
                        <div className="flex justify-between gap-3">
                            {/* UPLOAD DIFFERENT FILE */}
                            <Button
                                asChild
                                variant="outline"
                            >
                                <Link href={reportBaseUrl}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Upload Different File
                                </Link>
                            </Button>

                            <div className="flex gap-2">
                                {/* =================================================
                                    NEW IMPORT
                                ================================================= */}
                                {!preview.replacement?.has_existing && (
                                    <Button
                                        onClick={confirm}
                                        disabled={
                                            form.processing ||
                                            preview.lgu_count === 0
                                        }
                                    >
                                        {form.processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <Database className="mr-2 h-4 w-4" />
                                                Confirm Import
                                            </>
                                        )}
                                    </Button>
                                )}

                                {/* =================================================
                                    REPLACE EXISTING
                                ================================================= */}
                                {preview.replacement?.has_existing &&
                                    !preview.replacement.is_identical && (
                                        <Button
                                            onClick={replaceExisting}
                                            disabled={form.processing}
                                        >
                                            {form.processing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Replacing...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Replace Existing FHSIS
                                                </>
                                            )}
                                        </Button>
                                    )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

/* =============================================================
   SUMMARY ITEM
============================================================= */

function SummaryItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 truncate font-semibold">
                {value}
            </p>
        </div>
    );
}