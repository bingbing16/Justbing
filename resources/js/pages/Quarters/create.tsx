import {
    Head,
    Link,
    useForm,
} from '@inertiajs/react'

import { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
        sort_order: '1',
        is_active: true,
    })

    const submit = (e: FormEvent) => {
        e.preventDefault()

        post('/quarters')
    }

    return (
        <>
            <Head title="Add Quarter" />

            <div className="space-y-6 p-6">

                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Add Quarter
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Create a reporting quarter.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="rounded-xl border bg-white shadow-sm"
                >

                    <div className="border-b px-6 py-5">
                        <h2 className="text-base font-semibold">
                            Quarter Information
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            Define the quarter code, name, and display order.
                        </p>
                    </div>

                    <div className="grid gap-6 p-6">

                        <div className="grid gap-2 md:w-1/2">
                            <Label htmlFor="code">
                                Code{' '}
                                <span className="text-red-500">*</span>
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
                                placeholder="e.g. Q1"
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
                                <span className="text-red-500">*</span>
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
                                placeholder="e.g. First Quarter"
                                className="h-11"
                            />

                            {errors.name && (
                                <p className="text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2 md:w-1/3">
                            <Label htmlFor="sort_order">
                                Sort Order{' '}
                                <span className="text-red-500">*</span>
                            </Label>

                            <Input
                                id="sort_order"
                                type="number"
                                min="1"
                                value={data.sort_order}
                                onChange={(e) =>
                                    setData(
                                        'sort_order',
                                        e.target.value
                                    )
                                }
                                className="h-11"
                            />

                            {errors.sort_order && (
                                <p className="text-sm text-red-500">
                                    {errors.sort_order}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label>
                                    Active
                                </Label>

                                <p className="text-sm text-muted-foreground">
                                    Allow this quarter to be selected for reporting.
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
                            <Link href="/quarters">
                                Cancel
                            </Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing
                                ? 'Saving...'
                                : 'Save Quarter'}
                        </Button>
                    </div>

                </form>
            </div>
        </>
    )
}