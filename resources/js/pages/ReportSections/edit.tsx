import { Head, Link, useForm } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface ReportType {
    id: number
    code: string
    name: string
}

interface Section {
    id: number
    report_type_id: number
    parent_id: number | null
    code: string
    name: string
}

interface ExistingSection extends Section {
    description: string | null
    display_order: number
    is_active: boolean
}

interface Props {
    section: ExistingSection
    reportTypes: ReportType[]
    sections: Section[]
}

export default function Edit({
    section,
    reportTypes,
    sections,
}: Props) {
    const { data, setData, put, processing, errors } =
        useForm({
            report_type_id: String(
                section.report_type_id
            ),
            parent_id: section.parent_id
                ? String(section.parent_id)
                : '',
            code: section.code,
            name: section.name,
            description: section.description ?? '',
            display_order: String(
                section.display_order
            ),
            is_active: section.is_active,
        })

    const submit = (event: React.FormEvent) => {
        event.preventDefault()

        put(`/report-sections/${section.id}`)
    }

    const filteredSections = sections.filter(
        (item) =>
            item.report_type_id ===
                Number(data.report_type_id) &&
            item.id !== section.id
    )

    return (
        <>
            <Head title="Edit Report Section" />

            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                    >
                        <Link href="/report-sections">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>

                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Edit Report Section
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Update the report section configuration.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="max-w-2xl space-y-6 rounded-xl border bg-white p-6 shadow-sm"
                >
                    <div className="space-y-2">
                        <Label>Report Type</Label>

                        <Select
                            value={data.report_type_id}
                            onValueChange={(value) =>
                                setData(
                                    'report_type_id',
                                    value
                                )
                            }
                        >
                            <SelectTrigger className="h-11 bg-white">
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

                    <div className="space-y-2">
                        <Label>Parent Section</Label>

                        <Select
                            value={data.parent_id || 'none'}
                            onValueChange={(value) =>
                                setData(
                                    'parent_id',
                                    value === 'none'
                                        ? ''
                                        : value
                                )
                            }
                        >
                            <SelectTrigger className="h-11 bg-white">
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="none">
                                    Top-level section
                                </SelectItem>

                                {filteredSections.map(
                                    (item) => (
                                        <SelectItem
                                            key={item.id}
                                            value={String(
                                                item.id
                                            )}
                                        >
                                            {item.name}
                                        </SelectItem>
                                    )
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code">
                            Section Code
                        </Label>

                        <Input
                            id="code"
                            value={data.code}
                            onChange={(event) =>
                                setData(
                                    'code',
                                    event.target.value
                                )
                            }
                        />

                        {errors.code && (
                            <p className="text-sm text-red-500">
                                {errors.code}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Section Name
                        </Label>

                        <Input
                            id="name"
                            value={data.name}
                            onChange={(event) =>
                                setData(
                                    'name',
                                    event.target.value
                                )
                            }
                        />

                        {errors.name && (
                            <p className="text-sm text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description
                        </Label>

                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(event) =>
                                setData(
                                    'description',
                                    event.target.value
                                )
                            }
                            className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="display_order">
                            Display Order
                        </Label>

                        <Input
                            id="display_order"
                            type="number"
                            min="0"
                            value={data.display_order}
                            onChange={(event) =>
                                setData(
                                    'display_order',
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label>
                                Active Section
                            </Label>

                            <p className="text-sm text-muted-foreground">
                                Active sections are available
                                for reports.
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={data.is_active}
                            onClick={() =>
                                setData(
                                    'is_active',
                                    !data.is_active
                                )
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                data.is_active
                                    ? 'bg-primary'
                                    : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    data.is_active
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            asChild
                        >
                            <Link href="/report-sections">
                                Cancel
                            </Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing
                                ? 'Updating...'
                                : 'Update Section'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}