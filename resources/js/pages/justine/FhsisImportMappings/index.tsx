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
    ArrowRight,
    CheckCircle2,
    FileSpreadsheet,
    Settings2,
    XCircle,
} from "lucide-react";

type Mapping = {
    id: number;
    source_label: string;
    male_column: string | null;
    female_column: string | null;
    is_active: boolean;

    report_type: {
        id: number;
        code: string;
        name: string;
        slug: string;
    };

    indicator: {
        id: number;
        code: string;
        name: string;
    };
};

type Props = {
    mappings: {
        data: Mapping[];
    };
};

export default function Index({ mappings }: Props) {
    /*
    |--------------------------------------------------------------------------
    | Group mappings by report type
    |--------------------------------------------------------------------------
    */

    const groupedMappings = mappings.data.reduce(
        (groups: Record<string, Mapping[]>, mapping) => {
            const reportType = mapping.report_type.slug;

            if (!groups[reportType]) {
                groups[reportType] = [];
            }

            groups[reportType].push(mapping);

            return groups;
        },
        {},
    );

    return (
        <>
            <Head title="FHSIS Import Mappings" />

            <div className="min-h-screen bg-muted/20 p-6">
                <div className="mx-auto max-w-7xl space-y-6">

                    {/* ======================================================
                        HEADER
                    ======================================================= */}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-6 w-6 text-primary" />

                                <h1 className="text-2xl font-semibold tracking-tight">
                                    FHSIS Import Mappings
                                </h1>
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Configure which FHSIS Excel columns correspond
                                to each indicator in your reports.
                            </p>
                        </div>

                        <Button asChild>
                            <Link href="/justine/fhsis-import-mappings/create">
                                <Settings2 className="mr-2 h-4 w-4" />
                                New Mapping
                            </Link>
                        </Button>
                    </div>

                    {/* ======================================================
                        INFORMATION
                    ======================================================= */}

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex gap-3">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                                </div>

                                <div>
                                    <p className="font-medium">
                                        How FHSIS mappings work
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Each report type has its own FHSIS
                                        column mappings. Make sure every
                                        indicator is connected to the correct
                                        column from the FHSIS Excel file.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ======================================================
                        REPORT TYPES
                    ======================================================= */}

                    {Object.entries(groupedMappings).map(
                        ([reportTypeSlug, reportMappings]) => {
                            const reportType =
                                reportMappings[0]?.report_type;

                            const activeCount =
                                reportMappings.filter(
                                    (mapping) => mapping.is_active,
                                ).length;

                            return (
                                <Card
                                    key={reportTypeSlug}
                                    className="overflow-hidden"
                                >
                                    {/* REPORT HEADER */}

                                    <CardHeader className="border-b bg-muted/30">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg">
                                                        {reportType.name}
                                                    </CardTitle>

                                                    <Badge variant="outline">
                                                        {reportType.code}
                                                    </Badge>
                                                </div>

                                                <CardDescription className="mt-1">
                                                    FHSIS indicators and Excel
                                                    column mappings for this
                                                    report type.
                                                </CardDescription>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className="gap-1"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />

                                                    {activeCount} Active
                                                </Badge>

                                                <Badge variant="outline">
                                                    {reportMappings.length}{" "}
                                                    {reportMappings.length === 1
                                                        ? "Mapping"
                                                        : "Mappings"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {/* TABLE */}

                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b bg-background">
                                                        <th className="px-5 py-3 text-left font-semibold">
                                                            Indicator
                                                        </th>

                                                        <th className="px-5 py-3 text-left font-semibold">
                                                            FHSIS Source
                                                        </th>

                                                        <th className="px-5 py-3 text-center font-semibold">
                                                            Male
                                                        </th>

                                                        <th className="px-5 py-3 text-center font-semibold">
                                                            Female
                                                        </th>

                                                        <th className="px-5 py-3 text-center font-semibold">
                                                            Status
                                                        </th>

                                                        <th className="px-5 py-3 text-right font-semibold">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {reportMappings.map(
                                                        (mapping) => (
                                                            <tr
                                                                key={mapping.id}
                                                                className="border-b last:border-0 hover:bg-muted/30"
                                                            >
                                                                {/* INDICATOR */}

                                                                <td className="px-5 py-4">
                                                                    <div className="font-medium">
                                                                        {
                                                                            mapping
                                                                                .indicator
                                                                                .name
                                                                        }
                                                                    </div>

                                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                                        {
                                                                            mapping
                                                                                .indicator
                                                                                .code
                                                                        }
                                                                    </div>
                                                                </td>

                                                                {/* SOURCE */}

                                                                <td className="px-5 py-4">
                                                                    <div className="font-medium">
                                                                        {
                                                                            mapping.source_label
                                                                        }
                                                                    </div>

                                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                                        FHSIS
                                                                        Excel
                                                                        column
                                                                    </div>
                                                                </td>

                                                                {/* MALE */}

                                                                <td className="px-5 py-4 text-center">
                                                                    {mapping.male_column ? (
                                                                        <Badge variant="outline">
                                                                            {
                                                                                mapping.male_column
                                                                            }
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">
                                                                            —
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                {/* FEMALE */}

                                                                <td className="px-5 py-4 text-center">
                                                                    {mapping.female_column ? (
                                                                        <Badge variant="outline">
                                                                            {
                                                                                mapping.female_column
                                                                            }
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">
                                                                            —
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                {/* STATUS */}

                                                                <td className="px-5 py-4 text-center">
                                                                    {mapping.is_active ? (
                                                                        <Badge className="gap-1 border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                                            Active
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="gap-1"
                                                                        >
                                                                            <XCircle className="h-3.5 w-3.5" />
                                                                            Inactive
                                                                        </Badge>
                                                                    )}
                                                                </td>

                                                                {/* ACTION */}

                                                                <td className="px-5 py-4 text-right">
                                                                    <Button
                                                                        asChild
                                                                        size="sm"
                                                                        variant="outline"
                                                                    >
                                                                        <Link
                                                                            href={`/justine/fhsis-import-mappings/${mapping.id}/edit`}
                                                                        >
                                                                            Edit
                                                                            <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                                                        </Link>
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        },
                    )}

                    {/* ======================================================
                        NO MAPPINGS
                    ======================================================= */}

                    {Object.keys(groupedMappings).length === 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40" />

                                <h2 className="mt-4 text-lg font-semibold">
                                    No FHSIS mappings found
                                </h2>

                                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                    Create a mapping to connect an FHSIS Excel
                                    column to an indicator.
                                </p>

                                <Button
                                    asChild
                                    className="mt-5"
                                >
                                    <Link href="/justine/fhsis-import-mappings/create">
                                        Create First Mapping
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}