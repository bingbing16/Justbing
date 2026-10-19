import { Head, Link } from "@inertiajs/react";

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
    ArrowLeft,
    FileSpreadsheet,
    Users,
    ListChecks,
} from "lucide-react";

type Report = {
    id: number;
    year: number;
    file_name: string;
    file_extension?: string | null;
    file_size?: number | null;
    imported_at: string | null;

    quarter: {
        id?: number;
        code: string;
        name: string;
    };

    report_type: {
        id?: number;
        code: string;
        name: string;
        slug: string;
    };

    importer?: {
        id?: number;
        name: string;
    } | null;

    values: Value[];
};

type Value = {
    id: number;

    lgu: {
        id: number;
        name: string;
    };

    indicator: {
        id: number;
        code: string;
        name: string;
    };

    male: number | string;
    female: number | string;
    total: number | string;
};



export default function Show({
    report,
}: {
    report: Report;
}) {
    const lguCount = new Set(
            report.values.map((value) => value.lgu.id)
        ).size;

        const formatDateTime = (date?: string | null) => {
        if (!date) {
            return '—';
        }

        return new Date(date).toLocaleString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <>
            <Head title="FHSIS Report" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
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
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    FHSIS Report
                                </h1>

                                <Badge variant="outline">
                                    {report.quarter.code}
                                </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                {report.quarter.name} {report.year}
                            </p>
                        </div>
                    </div>

                    <Button
                        asChild
                        variant="outline"
                    >
                        <Link
                            href={`/justine/fhsis/${report.report_type.slug}/comparison?year=${report.year}&quarter_id=${report.quarter.id}`}
                        >
                            Compare with LGU
                        </Link>
                    </Button>
                </div>

                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-4">
                    <SummaryCard
                        title="Year"
                        value={String(report.year)}
                    />

                    <SummaryCard
                        title="Quarter"
                        value={report.quarter.code}
                    />

                    <SummaryCard
                        title="LGUs"
                        value={String(lguCount)}
                        icon={<Users className="h-4 w-4" />}
                    />

                    <SummaryCard
                        title="Values"
                        value={String(report.values.length)}
                        icon={<ListChecks className="h-4 w-4" />}
                    />
                </div>

                {/* Report Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Report Information</CardTitle>

                        <CardDescription>
                            Details of the imported FHSIS workbook.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            <Info
                                label="Report Type"
                                value={`${report.report_type.code} — ${report.report_type.name}`}
                            />

                            <Info
                                label="Reporting Period"
                                value={`${report.quarter.code} — ${report.year}`}
                            />

                            <Info
                                label="File"
                                value={report.file_name}
                            />

                            <Info
                                label="Imported By"
                                value={
                                    report.importer?.name ??
                                    "—"
                                }
                            />

                            <Info
                                label="Imported At"
                                value={formatDateTime(report.imported_at)}
                            />

                            <Info
                                label="File Type"
                                value={
                                    report.file_extension
                                        ? report.file_extension.toUpperCase()
                                        : "—"
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Values */}
                <Card>
                    <CardHeader>
                        <CardTitle>Imported FHSIS Values</CardTitle>

                        <CardDescription>
                            Male, female, and total values imported from
                            the FHSIS Data sheet.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="rounded-md border">
                            <div className="max-h-[650px] overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-muted/95">
                                        <tr className="border-b">
                                            <th className="p-3 text-left font-medium">
                                                LGU
                                            </th>

                                            <th className="p-3 text-left font-medium">
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
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {report.values.map((value) => (
                                            <tr
                                                key={value.id}
                                                className="border-b last:border-0 hover:bg-muted/30"
                                            >
                                                <td className="p-3 font-medium">
                                                    {value.lgu.name}
                                                </td>

                                                <td className="max-w-[420px] p-3">
                                                    <div className="truncate font-medium">
                                                        {
                                                            value
                                                                .indicator
                                                                .name
                                                        }
                                                    </div>

                                                    <div className="text-xs text-muted-foreground">
                                                        {
                                                            value
                                                                .indicator
                                                                .code
                                                        }
                                                    </div>
                                                </td>

                                                <td className="p-3 text-right tabular-nums">
                                                    {formatNumber(
                                                        value.male
                                                    )}
                                                </td>

                                                <td className="p-3 text-right tabular-nums">
                                                    {formatNumber(
                                                        value.female
                                                    )}
                                                </td>

                                                <td className="p-3 text-right font-medium tabular-nums">
                                                    {formatNumber(
                                                        value.total
                                                    )}
                                                </td>
                                            </tr>
                                        ))}

                                        {!report.values.length && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="p-10 text-center text-muted-foreground"
                                                >
                                                    No imported values found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function SummaryCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: string;
    icon?: React.ReactNode;
}) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {title}
                    </p>

                    {icon && (
                        <span className="text-muted-foreground">
                            {icon}
                        </span>
                    )}
                </div>

                <p className="mt-1 text-2xl font-semibold">
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}

function Info({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 truncate font-medium">
                {value}
            </p>
        </div>
    );
}

function formatNumber(value: number | string | null) {
    if (value === null || value === "") {
        return "—";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return String(value);
    }

    return number
        .toFixed(2)
        .replace(/\.00$/, "");
}