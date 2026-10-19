import { Head, Link } from "@inertiajs/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
    Eye,
    FileSpreadsheet,
    GitCompare,
    Upload,
} from "lucide-react";


const formatDateTime = (date?: string | null) => {
    if (!date) {
        return '—';
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

type Report = {
    id: number;
    year: number;
    file_name: string;
    imported_at: string | null;
    quarter: {
        code: string;
        name: string;
    };
    report_type: {
        code: string;
        name: string;
    };
    importer?: {
        name: string;
    } | null;
};

type Page<T> = {
    data: T[];
    current_page?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type ReportType = {
    id: number;
    code: string;
    name: string;
    slug: string;
};

export default function Index({
    reports,
    reportTypes,
}: {
    reports: Page<Report>;
    reportTypes: ReportType[];
}) {
    const [selectedReportType, setSelectedReportType] = useState(
        reportTypes[0]?.slug ?? ""
    );

    return (
        <>
            <Head title="FHSIS Reports" />

            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            FHSIS Reports
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Imported FHSIS quarterly reports for LGU
                            comparison.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {/* Compare */}
                        <Button
                            asChild
                            variant="outline"
                        >
                            <Link href={`/justine/fhsis/${selectedReportType}/comparison`}>
                                <GitCompare className="mr-2 h-4 w-4" />
                                Compare
                            </Link>
                        </Button>

                        {/* Generic FHSIS Import */}
                        <select
                            value={selectedReportType}
                            onChange={(e) =>
                                setSelectedReportType(e.target.value)
                            }
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                        >
                            {reportTypes.map((reportType) => (
                                <option
                                    key={reportType.id}
                                    value={reportType.slug}
                                >
                                    {reportType.name}
                                </option>
                            ))}
                        </select>

                        {selectedReportType && (
                            // <Button asChild>
                            //     <Link
                            //         href={`/justine/fhsis/${selectedReportType}/import`}
                            //     >
                            //         <Upload className="mr-2 h-4 w-4" />
                            //         Import FHSIS
                            //     </Link>
                            // </Button>
                            <Button asChild>
                                <Link href="/justine/fhsis/import">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import FHSIS
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Reports */}
                <Card>
                    <CardHeader>
                        <CardTitle>Imported Reports</CardTitle>

                        <CardDescription>
                            FHSIS snapshots currently available in the
                            system.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="rounded-md border">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="p-3 text-left font-medium">
                                                Year
                                            </th>

                                            <th className="p-3 text-left font-medium">
                                                Quarter
                                            </th>

                                            <th className="p-3 text-left font-medium">
                                                Report
                                            </th>

                                            <th className="p-3 text-left font-medium">
                                                File
                                            </th>

                                            <th className="p-3 text-left font-medium">
                                                Imported By
                                            </th>

                                            <th className="p-3 text-left font-medium">
                                                Imported
                                            </th>

                                            <th className="p-3 text-right font-medium">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {reports.data.map((report) => (
                                            <tr
                                                key={report.id}
                                                className="border-b last:border-0 hover:bg-muted/30"
                                            >
                                                <td className="p-3 font-medium">
                                                    {report.year}
                                                </td>

                                                <td className="p-3">
                                                    <Badge variant="outline">
                                                        {report.quarter.code}
                                                    </Badge>
                                                </td>

                                                <td className="p-3">
                                                    {report.report_type.name}
                                                </td>

                                                <td className="max-w-[280px] p-3">
                                                    <div className="flex items-center gap-2">
                                                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />

                                                        <span className="truncate">
                                                            {
                                                                report.file_name
                                                            }
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="p-3">
                                                    {report.importer?.name ??
                                                        "—"}
                                                </td>

                                                <td className="p-3 text-muted-foreground">
                                                    {formatDateTime(report.imported_at)}
                                                </td>

                                                <td className="p-3 text-right">
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <Link
                                                            href={`/justine/fhsis/${report.id}`}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}

                                        {!reports.data.length && (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="p-10 text-center text-muted-foreground"
                                                >
                                                    No FHSIS reports found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {reports.links.length > 0 && (
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-muted-foreground">
                                    Showing{" "}
                                    {reports.from ?? 0}–{reports.to ?? 0}
                                    {reports.total
                                        ? ` of ${reports.total}`
                                        : ""}
                                </p>

                                <div className="flex flex-wrap gap-1">
                                    {reports.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            asChild
                                            size="sm"
                                            variant={
                                                link.active
                                                    ? "default"
                                                    : "outline"
                                            }
                                            disabled={!link.url}
                                        >
                                            <Link
                                                href={
                                                    link.url ?? "#"
                                                }
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}