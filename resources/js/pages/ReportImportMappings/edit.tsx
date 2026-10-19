import { Head, Link, useForm } from '@inertiajs/react'

import AppLayout from '@/layouts/app-layout'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface ReportType {
    id: number
    code: string
    name: string
}

interface Indicator {
    id: number
    report_section_id: number
    code: string
    name: string
    display_order: number

    section: {
        id: number
        report_type_id: number
        code: string
        name: string
    }
}

interface Mapping {
    id: number
    report_type_id: number
    indicator_id: number
    source_label: string
    source_key: string | null
    is_active: boolean
}

interface Props {
    mapping: Mapping
    reportTypes: ReportType[]
    indicators: Indicator[]
}

export default function Edit({
    mapping,
    reportTypes,
    indicators,
}: Props) {
    const { data, setData, put, processing, errors } =
        useForm({
            report_type_id: String(
                mapping.report_type_id
            ),
            indicator_id: String(
                mapping.indicator_id
            ),
            source_label: mapping.source_label,
            source_key: mapping.source_key ?? '',
            is_active: mapping.is_active,
        })

    const filteredIndicators =
        indicators.filter(
            (indicator) =>
                indicator.section.report_type_id ===
                Number(data.report_type_id)
        )

    const groupedIndicators =
        filteredIndicators.reduce<
            Record<string, Indicator[]>
        >((groups, indicator) => {
            const sectionName =
                indicator.section.name

            if (!groups[sectionName]) {
                groups[sectionName] = []
            }

            groups[sectionName].push(indicator)

            return groups
        }, {})

    const submit = (event: React.FormEvent) => {
        event.preventDefault()

        put(
            `/report-import-mappings/${mapping.id}`
        )
    }

    return (
        <>
            <Head title="Edit Report Import Mapping" />

            <div className="flex flex-1 flex-col gap-6 p-6">

                <div>
                    <h1 className="text-2xl font-semibold">
                        Edit Report Import Mapping
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Update the source-to-indicator mapping.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="max-w-3xl space-y-6"
                >

                    {/* Report Type */}
                    <div className="space-y-2">
                        <Label>
                            Report Type
                        </Label>

                        <Select
                            value={data.report_type_id}
                            onValueChange={(value) => {
                                setData(
                                    'report_type_id',
                                    value
                                )

                                setData(
                                    'indicator_id',
                                    ''
                                )
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                {reportTypes.map(
                                    (reportType) => (
                                        <SelectItem
                                            key={reportType.id}
                                            value={String(
                                                reportType.id
                                            )}
                                        >
                                            {reportType.name}
                                            {' '}
                                            ({reportType.code})
                                        </SelectItem>
                                    )
                                )}
                            </SelectContent>
                        </Select>

                        {errors.report_type_id && (
                            <p className="text-sm text-red-500">
                                {errors.report_type_id}
                            </p>
                        )}
                    </div>

                    {/* Indicator */}
                    <div className="space-y-2">
                        <Label>
                            Indicator
                        </Label>

                        <Select
                            value={data.indicator_id}
                            onValueChange={(value) =>
                                setData(
                                    'indicator_id',
                                    value
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select indicator" />
                            </SelectTrigger>

                            <SelectContent>
                                {Object.entries(
                                    groupedIndicators
                                ).map(
                                    ([
                                        sectionName,
                                        sectionIndicators,
                                    ]) => (
                                        <SelectGroup
                                            key={sectionName}
                                        >
                                            <SelectLabel>
                                                {sectionName}
                                            </SelectLabel>

                                            {sectionIndicators.map(
                                                (indicator) => (
                                                    <SelectItem
                                                        key={
                                                            indicator.id
                                                        }
                                                        value={String(
                                                            indicator.id
                                                        )}
                                                    >
                                                        {
                                                            indicator.name
                                                        }
                                                        {' '}
                                                        (
                                                        {
                                                            indicator.code
                                                        }
                                                        )
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectGroup>
                                    )
                                )}
                            </SelectContent>
                        </Select>

                        {errors.indicator_id && (
                            <p className="text-sm text-red-500">
                                {errors.indicator_id}
                            </p>
                        )}
                    </div>

                    {/* Source Label */}
                    <div className="space-y-2">
                        <Label htmlFor="source_label">
                            Source Label
                        </Label>

                        <Input
                            id="source_label"
                            value={data.source_label}
                            onChange={(event) =>
                                setData(
                                    'source_label',
                                    event.target.value
                                )
                            }
                        />

                        <p className="text-xs text-muted-foreground">
                            Use the clean indicator name. Handle
                            source-specific wording differences in
                            the importer aliases.
                        </p>

                        {errors.source_label && (
                            <p className="text-sm text-red-500">
                                {errors.source_label}
                            </p>
                        )}
                    </div>

                    {/* Source Key */}
                    <div className="space-y-2">
                        <Label htmlFor="source_key">
                            Source Key
                        </Label>

                        <Input
                            id="source_key"
                            value={data.source_key}
                            onChange={(event) =>
                                setData(
                                    'source_key',
                                    event.target.value
                                )
                            }
                        />

                        {errors.source_key && (
                            <p className="text-sm text-red-500">
                                {errors.source_key}
                            </p>
                        )}
                    </div>

                    {/* Active */}
                    {/* <div className="flex items-center gap-3">
                        <input
                            id="is_active"
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(event) =>
                                setData(
                                    'is_active',
                                    event.target.checked
                                )
                            }
                            className="h-4 w-4 rounded border-gray-300"
                        />

                        <Label htmlFor="is_active">
                            Active
                        </Label>
                    </div> */}

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label>
                                Active
                            </Label>

                            <p className="text-sm text-muted-foreground">
                                Allow this report mapping to be used in the system.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setData(
                                    'is_active',
                                    !data.is_active
                                )
                            }
                            className={`relative h-6 w-11 rounded-full transition ${
                                data.is_active
                                    ? 'bg-blue-600'
                                    : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                                    data.is_active
                                        ? 'left-5'
                                        : 'left-0.5'
                                }`}
                            />
                        </button>
                    </div>  

                    {/* Buttons */}
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing
                                ? 'Updating...'
                                : 'Update Mapping'}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            asChild
                        >
                            <Link href="/report-import-mappings">
                                Cancel
                            </Link>
                        </Button>
                    </div>

                </form>
            </div>
        </>
    )
}