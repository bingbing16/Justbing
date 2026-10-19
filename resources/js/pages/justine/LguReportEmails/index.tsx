import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface Lgu {
    id: number
    name: string
}

interface ReportType {
    id: number
    name: string
    code: string
}

interface LguReportEmail {
    id: number
    lgu: Lgu
    report_type: ReportType
    email: string
    contact_name: string | null
    is_active: boolean
}

interface Props {
    emails: {
        data: LguReportEmail[]
        current_page: number
        last_page: number
        total: number
    }

    lgus: Lgu[]
    reportTypes: ReportType[]
}

export default function Index({
    emails,
    lgus,
    reportTypes,
}: Props) {
    const [showForm, setShowForm] = useState(false)

    const [editing, setEditing] =
        useState<LguReportEmail | null>(null)

    const [lguId, setLguId] = useState('')
    const [reportTypeId, setReportTypeId] = useState('')
    const [email, setEmail] = useState('')
    const [contactName, setContactName] = useState('')
    const [isActive, setIsActive] = useState(true)

    const resetForm = () => {
        setLguId('')
        setReportTypeId('')
        setEmail('')
        setContactName('')
        setIsActive(true)
        setEditing(null)
        setShowForm(false)
    }

    const submit = (e: FormEvent) => {
        e.preventDefault()

        const data = {
            lgu_id: Number(lguId),
            report_type_id: Number(reportTypeId),
            email,
            contact_name: contactName || null,
            is_active: isActive,
        }

        if (editing) {
            router.put(
                `/justine/lgu-report-emails/${editing.id}`,
                data,
                {
                    preserveScroll: true,
                    onSuccess: resetForm,
                }
            )
        } else {
            router.post(
                '/justine/lgu-report-emails',
                data,
                {
                    preserveScroll: true,
                    onSuccess: resetForm,
                }
            )
        }
    }

    const edit = (item: LguReportEmail) => {
        setEditing(item)
        setLguId(String(item.lgu.id))
        setReportTypeId(String(item.report_type.id))
        setEmail(item.email)
        setContactName(item.contact_name ?? '')
        setIsActive(item.is_active)
        setShowForm(true)
    }

    const remove = (item: LguReportEmail) => {
        if (
            !confirm(
                `Delete ${item.email} from ${item.lgu.name}?`
            )
        ) {
            return
        }

        router.delete(
            `/lgu-report-emails/${item.id}`,
            {
                preserveScroll: true,
            }
        )
    }

    return (
        <div className="space-y-6 p-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">
                        LGU Report Emails
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Manage email recipients by LGU and report type.
                    </p>
                </div>

                <Button
                    onClick={() => {
                        resetForm()
                        setShowForm(true)
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Email
                </Button>
            </div>

            {showForm && (
                <form
                    onSubmit={submit}
                    className="rounded-lg border bg-card p-6 space-y-4"
                >
                    <h2 className="font-semibold">
                        {editing
                            ? 'Edit LGU Report Email'
                            : 'Add LGU Report Email'}
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">

                        <div>
                            <label className="text-sm font-medium">
                                LGU
                            </label>

                            <Select
                                value={lguId}
                                onValueChange={setLguId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select LGU" />
                                </SelectTrigger>

                                <SelectContent>
                                    {lgus.map((lgu) => (
                                        <SelectItem
                                            key={lgu.id}
                                            value={String(lgu.id)}
                                        >
                                            {lgu.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">
                                Report Type
                            </label>

                            <Select
                                value={reportTypeId}
                                onValueChange={setReportTypeId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select report type" />
                                </SelectTrigger>

                                <SelectContent>
                                    {reportTypes.map((type) => (
                                        <SelectItem
                                            key={type.id}
                                            value={String(type.id)}
                                        >
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">
                                Email
                            </label>

                            <Input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="example@doh.gov.ph"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">
                                Contact Name
                            </label>

                            <Input
                                value={contactName}
                                onChange={(e) =>
                                    setContactName(e.target.value)
                                }
                                placeholder="Optional"
                            />
                        </div>

                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={isActive}
                            onCheckedChange={(value) =>
                                setIsActive(value === true)
                            }
                        />

                        <span className="text-sm">
                            Active
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit">
                            {editing
                                ? 'Update'
                                : 'Save'}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            <div className="rounded-lg border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left">
                                LGU
                            </th>

                            <th className="p-3 text-left">
                                Report Type
                            </th>

                            <th className="p-3 text-left">
                                Contact
                            </th>

                            <th className="p-3 text-left">
                                Email
                            </th>

                            <th className="p-3 text-left">
                                Status
                            </th>

                            <th className="p-3 text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {emails.data.map((item) => (
                            <tr
                                key={item.id}
                                className="border-b"
                            >
                                <td className="p-3">
                                    {item.lgu.name}
                                </td>

                                <td className="p-3">
                                    {item.report_type.name}
                                </td>

                                <td className="p-3">
                                    {item.contact_name || '—'}
                                </td>

                                <td className="p-3">
                                    {item.email}
                                </td>

                                <td className="p-3">
                                    {item.is_active
                                        ? 'Active'
                                        : 'Inactive'}
                                </td>

                                <td className="p-3">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() =>
                                                edit(item)
                                            }
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            onClick={() =>
                                                remove(item)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {emails.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="p-8 text-center text-muted-foreground"
                                >
                                    No LGU report emails configured.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}