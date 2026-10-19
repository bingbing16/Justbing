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

interface Props {
    reportTypes: ReportType[]
    sections: Section[]
}

export default function Create({
    reportTypes,
    sections,
}: Props) {
    const { data, setData, post, processing, errors } =
        useForm({
            report_type_id: '',
            parent_id: '',
            code: '',
            name: '',
            description: '',
            display_order: '0',
            is_active: true,
        })

    const submit = (event: React.FormEvent) => {
        event.preventDefault()

        post('/report-sections')
    }

    const filteredSections = sections.filter(
        (section) =>
            !data.report_type_id ||
            section.report_type_id ===
                Number(data.report_type_id)
    )

    return (
        <>
            <Head title="Add Report Section" />

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
                            Add Report Section
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Create a section for an LGU report.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="max-w-2xl space-y-6 rounded-xl border bg-white p-6 shadow-sm"
                >
                    <div className="space-y-2">
                        <Label htmlFor="report_type_id">
                            Report Type
                        </Label>

                        <Select
                            value={data.report_type_id}
                            onValueChange={(value) =>
                                setData(
                                    'report_type_id',
                                    value
                                )
                            }
                        >
                            <SelectTrigger
                                id="report_type_id"
                                className="h-11 bg-white"
                            >
                                <SelectValue placeholder="Select report type" />
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
                        <Label htmlFor="parent_id">
                            Parent Section
                        </Label>

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
                            <SelectTrigger
                                id="parent_id"
                                className="h-11 bg-white"
                            >
                                <SelectValue placeholder="Top-level section" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="none">
                                    Top-level section
                                </SelectItem>

                                {filteredSections.map(
                                    (section) => (
                                        <SelectItem
                                            key={section.id}
                                            value={String(
                                                section.id
                                            )}
                                        >
                                            {section.name}
                                        </SelectItem>
                                    )
                                )}
                            </SelectContent>
                        </Select>

                        {errors.parent_id && (
                            <p className="text-sm text-red-500">
                                {errors.parent_id}
                            </p>
                        )}
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
                            placeholder="e.g. GERIATRIC_SCREENING"
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
                            placeholder="e.g. Geriatric Screening"
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
                            placeholder="Optional description"
                        />

                        {errors.description && (
                            <p className="text-sm text-red-500">
                                {errors.description}
                            </p>
                        )}
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

                        {errors.display_order && (
                            <p className="text-sm text-red-500">
                                {errors.display_order}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label>
                                Active Section
                            </Label>

                            <p className="text-sm text-muted-foreground">
                                Active sections are available
                                for report configuration.
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
                                ? 'Saving...'
                                : 'Save Section'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}