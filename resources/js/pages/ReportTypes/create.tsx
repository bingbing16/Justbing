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

export default function Create() {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        code: '',
        name: '',
        slug: '',
        description: '',
        is_active: true,
    })

    const submit = (e: FormEvent) => {
        e.preventDefault()

        post('/report-types')
    }

    return (
        <>
            <Head title="Add Report Type" />

            <div className="space-y-6 p-6">

                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Add Report Type
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Create a report type for the reporting system.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="rounded-xl border bg-white shadow-sm"
                >

                    <div className="border-b px-6 py-5">
                        <h2 className="text-base font-semibold">
                            Report Type Information
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            Define the report type used to organize sections and indicators.
                        </p>
                    </div>

                    <div className="grid gap-6 p-6">

                        <div className="grid gap-2 md:w-1/2">
                            <Label htmlFor="slug">
                                Slug{' '}
                                <span className="text-red-500">
                                    *
                                </span>
                            </Label>

                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(e) =>
                                    setData(
                                        'slug',
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. HWPSC"
                                className="h-11"
                            />

                            {errors.slug && (
                                <p className="text-sm text-red-500">
                                    {errors.slug}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2 md:w-1/2">
                            <Label htmlFor="code">
                                Code{' '}
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
                                placeholder="e.g. HWPSC"
                                className="h-11"
                            />

                            {errors.code && (
                                <p className="text-sm text-red-500">
                                    {errors.code}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Name{' '}
                                <span className="text-red-500">
                                    *
                                </span>
                            </Label>

                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData(
                                        'name',
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. Health and Wellness Program for Senior Citizens"
                                className="h-11"
                            />

                            {errors.name && (
                                <p className="text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">
                                Description
                            </Label>

                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) =>
                                    setData(
                                        'description',
                                        e.target.value
                                    )
                                }
                                placeholder="Optional description"
                                rows={4}
                            />

                            {errors.description && (
                                <p className="text-sm text-red-500">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label>
                                    Active
                                </Label>

                                <p className="text-sm text-muted-foreground">
                                    Allow this report type to be used in the system.
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
                            <Link href="/report-types">
                                Cancel
                            </Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing
                                ? 'Saving...'
                                : 'Save Report Type'}
                        </Button>
                    </div>

                </form>
            </div>
        </>
    )
}