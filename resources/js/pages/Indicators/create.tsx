import {
    Head,
    Link,
    useForm,
} from '@inertiajs/react'

import { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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

interface Section {
    id: number
    report_type_id: number
    parent_id: number | null
    code: string
    name: string
    report_type: ReportType
}

interface Props {
    sections: Section[]
}

export default function Create({
    sections,
}: Props) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        report_section_id: '',
        code: '',
        name: '',
        display_order: '1',
        is_active: true,
    })

    const submit = (e: FormEvent) => {
        e.preventDefault()

        post('/indicators')
    }
    const groupedSections = sections.reduce(
        (groups, section) => {
            const reportTypeId = section.report_type.id

            if (!groups[reportTypeId]) {
                groups[reportTypeId] = {
                    reportType: section.report_type,
                    sections: [],
                }
            }

            groups[reportTypeId].sections.push(section)

            return groups
        },
        {} as Record<
            number,
            {
                reportType: ReportType
                sections: Section[]
            }
        >
    )

    return (
        <>
            <Head title="Add Indicator" />

            <div className="space-y-6 p-6">

                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Add Indicator
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Create an indicator for a report section.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="rounded-xl border bg-white shadow-sm"
                >

                    <div className="border-b px-6 py-5">
                        <h2 className="text-base font-semibold">
                            Indicator Information
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            Define where the indicator belongs and how it appears in the report.
                        </p>
                    </div>

                    <div className="grid gap-6 p-6">

                        {/* Section */}

                        <div className="grid gap-2">
                            <Label htmlFor="report_section_id">
                                Report Section{' '}
                                <span className="text-red-500">
                                    *
                                </span>
                            </Label>

                            <Select
                                value={
                                    data.report_section_id
                                }
                                onValueChange={(value) =>
                                    setData(
                                        'report_section_id',
                                        value
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="report_section_id"
                                    className="h-11 bg-white"
                                >
                                    <SelectValue placeholder="Select Report Section" />
                                </SelectTrigger>

                                <SelectContent>
                                    {Object.values(groupedSections).map(
                                        ({ reportType, sections }) => (
                                            <SelectGroup key={reportType.id}>
                                                <SelectLabel>
                                                    {reportType.name}
                                                    {' '}
                                                    <span className="text-xs text-muted-foreground">
                                                        ({reportType.code})
                                                    </span>
                                                </SelectLabel>

                                                {sections.map((section) => (
                                                    <SelectItem
                                                        key={section.id}
                                                        value={String(section.id)}
                                                    >
                                                        {section.name}
                                                        {' '}
                                                        {/* <span className="text-xs text-muted-foreground">
                                                            ({section.code})
                                                        </span> */}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        )
                                    )}
                                </SelectContent>
                            </Select>

                            {errors.report_section_id && (
                                <p className="text-sm text-red-500">
                                    {
                                        errors.report_section_id
                                    }
                                </p>
                            )}
                        </div>

                        {/* Code */}

                        <div className="grid gap-2">
                            <Label htmlFor="code">
                                Indicator Code{' '}
                                <span className="text-red-500">
                                    *
                                </span>
                            </Label>

                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) =>
                                    setData(
                                        'code',
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. SENIOR_CITIZENS_SCREENED"
                                className="h-11"
                            />

                            {errors.code && (
                                <p className="text-sm text-red-500">
                                    {errors.code}
                                </p>
                            )}
                        </div>

                        {/* Name */}

                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Indicator Name{' '}
                                <span className="text-red-500">
                                    *
                                </span>
                            </Label>

                            <Textarea
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData(
                                        'name',
                                        e.target.value
                                    )
                                }
                                placeholder="Enter indicator name"
                                rows={3}
                            />

                            {errors.name && (
                                <p className="text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Order */}

                        <div className="grid gap-2 md:w-1/3">
                            <Label htmlFor="display_order">
                                Display Order{' '}
                                <span className="text-red-500">
                                    *
                                </span>
                            </Label>

                            <Input
                                id="display_order"
                                type="number"
                                min="0"
                                value={
                                    data.display_order
                                }
                                onChange={(e) =>
                                    setData(
                                        'display_order',
                                        e.target.value
                                    )
                                }
                                className="h-11"
                            />

                            {errors.display_order && (
                                <p className="text-sm text-red-500">
                                    {
                                        errors.display_order
                                    }
                                </p>
                            )}
                        </div>

                        {/* Active */}

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label>
                                    Active
                                </Label>

                                <p className="text-sm text-muted-foreground">
                                    Allow this indicator to be used in reporting forms.
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

                    </div>

                    <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            asChild
                        >
                            <Link href="/indicators">
                                Cancel
                            </Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing
                                ? 'Saving...'
                                : 'Save Indicator'}
                        </Button>
                    </div>

                </form>
            </div>
        </>
    )
}