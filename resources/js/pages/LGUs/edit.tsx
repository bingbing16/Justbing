import { Head, Link, useForm } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Lgu {
    id: number
    name: string
    code: string | null
    province: string | null
    municipality: string | null
    is_active: boolean
}

interface Props {
    lgu: Lgu
}

export default function Edit({ lgu }: Props) {
    const { data, setData, put, processing, errors } =
        useForm({
            name: lgu.name,
            code: lgu.code ?? '',
            province: lgu.province ?? '',
            municipality: lgu.municipality ?? '',
            is_active: lgu.is_active,
        })

    const submit = (event: React.FormEvent) => {
        event.preventDefault()

        put(`/lgus/${lgu.id}`)
    }

    return (
        <>
            <Head title={`Edit ${lgu.name}`} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                    >
                        <Link href="/lgus">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>

                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Edit LGU
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Update LGU information.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={submit}
                    className="max-w-2xl space-y-6 rounded-lg border p-6"
                >
                    {/* LGU Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            LGU Name
                        </Label>

                        <Input
                            id="name"
                            value={data.name}
                            onChange={(event) =>
                                setData(
                                    'name',
                                    event.target.value,
                                )
                            }
                        />

                        {errors.name && (
                            <p className="text-sm text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Code */}
                    <div className="space-y-2">
                        <Label htmlFor="code">
                            LGU Code
                        </Label>

                        <Input
                            id="code"
                            value={data.code}
                            onChange={(event) =>
                                setData(
                                    'code',
                                    event.target.value,
                                )
                            }
                        />

                        {errors.code && (
                            <p className="text-sm text-red-500">
                                {errors.code}
                            </p>
                        )}
                    </div>

                    {/* Province */}
                    <div className="space-y-2">
                        <Label htmlFor="province">
                            Province
                        </Label>

                        <Input
                            id="province"
                            value={data.province}
                            onChange={(event) =>
                                setData(
                                    'province',
                                    event.target.value,
                                )
                            }
                        />

                        {errors.province && (
                            <p className="text-sm text-red-500">
                                {errors.province}
                            </p>
                        )}
                    </div>

                    {/* Municipality */}
                    <div className="space-y-2">
                        <Label htmlFor="municipality">
                            Municipality / City
                        </Label>

                        <Input
                            id="municipality"
                            value={data.municipality}
                            onChange={(event) =>
                                setData(
                                    'municipality',
                                    event.target.value,
                                )
                            }
                        />

                        {errors.municipality && (
                            <p className="text-sm text-red-500">
                                {errors.municipality}
                            </p>
                        )}
                    </div>

                    {/* Active */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="is_active">
                                Active LGU
                            </Label>

                            <p className="text-sm text-muted-foreground">
                                Active LGUs can be selected when
                                creating reports.
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={data.is_active}
                            onClick={() =>
                                setData('is_active', !data.is_active)
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

                    {/* Buttons */}
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            asChild
                        >
                            <Link href="/lgus">
                                Cancel
                            </Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing
                                ? 'Updating...'
                                : 'Update LGU'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}