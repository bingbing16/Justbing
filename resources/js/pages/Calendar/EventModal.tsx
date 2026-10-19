import { useEffect, useState } from 'react'

import {
    CalendarDays,
    Clock3,
    FileText,
    MapPin,
    Save,
    X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import { Textarea } from '@/components/ui/textarea'

import type {
    CalendarEvent,
    EventFormData,
    EventPriority,
    EventType,
} from '../Calendar/types'

import {
    EVENT_COLORS,
    EVENT_TYPE_LABELS,
} from '../Calendar/types'


interface EventModalProps {
    open: boolean
    selectedDate: string | null
    event?: CalendarEvent | null

    onClose: () => void
    onSaved: () => void
}

const formatTimeForForm = (
    time: string | null | undefined
): string => {
    if (!time) {
        return ''
    }

    return time.substring(0, 5)
}

const emptyForm = (
    date: string
): EventFormData => ({
    type: 'event',
    subject: '',
    rpo_number: '',

    start_date: date,
    start_time: '09:00',

    end_date: date,
    end_time: '17:00',

    all_day: false,

    location: '',

    priority: 'normal',

    reminder_minutes: '30',

    notes: '',

    color: EVENT_COLORS.event,
})

export default function EventModal({
    open,
    selectedDate,
    event,
    onClose,
    onSaved,
}: EventModalProps) {
    const [form, setForm] = useState<EventFormData>(
        emptyForm(selectedDate ?? '')
    )

    const [saving, setSaving] = useState(false)

    const [errors, setErrors] = useState<
        Record<string, string[]>
    >({})

    const isEditing = Boolean(event)

    useEffect(() => {
        if (!open) {
            return
        }

        if (event) {
            setForm({
                type: event.type || 'event',

                subject: event.subject ?? '',

                rpo_number:
                    event.rpo_number ?? '',

                start_date:
                    event.start_date,

                start_time:
                    formatTimeForForm(
                        event.start_time
                    ) || '09:00',

                end_date:
                    event.end_date ??
                    event.start_date,

                end_time:
                    formatTimeForForm(
                        event.end_time
                    ) || '17:00',

                all_day:
                    Boolean(event.all_day),

                location:
                    event.location ?? '',

                priority:
                    event.priority ?? 'normal',

                reminder_minutes:
                    event.reminder_minutes == null
                        ? ''
                        : String(
                            event.reminder_minutes
                        ),

                notes:
                    event.notes ?? '',

                color:
                    event.color ??
                    EVENT_COLORS[
                        event.type || 'event'
                    ],
            })
        } else {
            setForm(
                emptyForm(selectedDate ?? '')
            )
        }

        setErrors({})
    }, [
        open,
        event,
        selectedDate,
    ])

    if (!open) {
        return null
    }

    const update = <K extends keyof EventFormData>(
        key: K,
        value: EventFormData[K]
    ) => {
        setForm((current: EventFormData) => ({
            ...current,
            [key]: value,
        }))
    }

    const submit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault()

        setSaving(true)
        setErrors({})

        const payload = {
            ...form,

            type: form.type || 'event',

            start_time: form.all_day
                ? null
                : form.start_time
                    ? form.start_time.substring(0, 5)
                    : null,

            end_time: form.all_day
                ? null
                : form.end_time
                    ? form.end_time.substring(0, 5)
                    : null,

            end_date:
                form.end_date || null,

            reminder_minutes:
                form.reminder_minutes === ''
                    ? null
                    : Number(
                        form.reminder_minutes
                    ),
        }

        try {
            const response = await fetch(
                isEditing
                    ? `/calendar/events/${event!.id}`
                    : '/calendar/events',
                {
                    method: isEditing
                        ? 'PUT'
                        : 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json',

                        'X-CSRF-TOKEN':
                            document
                                .querySelector(
                                    'meta[name="csrf-token"]'
                                )
                                ?.getAttribute(
                                    'content'
                                ) ?? '',
                    },

                    credentials: 'same-origin',

                    body: JSON.stringify(
                        payload
                    ),
                }
            )

            const data =
                await response.json()

            if (!response.ok) {
                if (
                    response.status === 422 &&
                    data.errors
                ) {
                    setErrors(data.errors)
                    return
                }

                throw new Error(
                    data.message ??
                        'Unable to save event.'
                )
            }

            onSaved()
            onClose()
        } catch (error) {
            console.error(error)

            alert(
                error instanceof Error
                    ? error.message
                    : 'Unable to save event.'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div
            className="
                fixed inset-0 z-50
                flex items-center justify-center
                bg-slate-950/50
                p-4
                backdrop-blur-sm
            "
            onMouseDown={(e) => {
                if (
                    e.target ===
                    e.currentTarget
                ) {
                    onClose()
                }
            }}
        >
            <Card
                className="
                    flex
                    max-h-[92vh]
                    w-full
                    max-w-2xl
                    flex-col
                    overflow-hidden
                    border-slate-200
                    shadow-2xl
                "
            >
                <CardHeader
                    className="
                        flex
                        shrink-0
                        flex-row
                        items-center
                        justify-between
                        border-b
                        bg-slate-50/80
                    "
                >
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <div className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-xl
                                bg-blue-100
                                text-blue-700
                            ">
                                <CalendarDays
                                    className="h-5 w-5"
                                />
                            </div>

                            <CardTitle>
                                {isEditing
                                    ? 'Edit Event'
                                    : 'Add Event'}
                            </CardTitle>
                        </div>

                        <p className="text-sm text-slate-500">
                            {isEditing
                                ? 'Update your scheduled activity.'
                                : 'Create an event or reminder for your calendar.'}
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>

                <form
                    onSubmit={submit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <CardContent
                        className="
                            min-h-0
                            space-y-5
                            overflow-y-auto
                            p-6
                        "
                    >
                        <div className="
                            rounded-xl
                            border
                            border-blue-100
                            bg-blue-50
                            p-4
                        ">
                            <div className="
                                flex
                                items-center
                                gap-2
                                text-sm
                                font-semibold
                                text-blue-900
                            ">
                                <CalendarDays
                                    className="h-4 w-4"
                                />

                                Schedule Details
                            </div>

                            <p className="
                                mt-1
                                text-xs
                                text-blue-700
                            ">
                                Choose when this activity
                                will take place.
                            </p>
                        </div>

                        <div className="
                            grid
                            gap-5
                            sm:grid-cols-2
                        ">
                            <div className="space-y-2">
                                <Label>
                                    Event Type
                                </Label>

                                <Select
                                    value={form.type}
                                    onValueChange={(
                                        value
                                    ) => {
                                        const type =
                                            value as EventType

                                        update(
                                            'type',
                                            type
                                        )

                                        update(
                                            'color',
                                            EVENT_COLORS[
                                                type
                                            ]
                                        )
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {(
                                            Object.entries(
                                                EVENT_TYPE_LABELS
                                            ) as [
                                                EventType,
                                                string
                                            ][]
                                        ).map(
                                            ([value, label]) => (
                                                <SelectItem
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    Priority
                                </Label>

                                <Select
                                    value={
                                        form.priority
                                    }
                                    onValueChange={(
                                        value
                                    ) =>
                                        update(
                                            'priority',
                                            value as EventPriority
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="low">
                                            Low
                                        </SelectItem>

                                        <SelectItem value="normal">
                                            Normal
                                        </SelectItem>

                                        <SelectItem value="high">
                                            High
                                        </SelectItem>

                                        <SelectItem value="urgent">
                                            Urgent
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">
                                Subject
                                <span className="ml-1 text-red-500">
                                    *
                                </span>
                            </Label>

                            <Input
                                id="subject"
                                value={form.subject}
                                onChange={(e) =>
                                    update(
                                        'subject',
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. Conducted Training in blah blah"
                                autoFocus
                            />

                            {errors.subject && (
                                <p className="text-xs text-red-600">
                                    {
                                        errors.subject[0]
                                    }
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rpo_number">
                                RPO #
                            </Label>

                            <Input
                                id="rpo_number"
                                value={
                                    form.rpo_number
                                }
                                onChange={(e) =>
                                    update(
                                        'rpo_number',
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. 2026-011"
                            />
                        </div>

                        <div className="
                            rounded-xl
                            border
                            p-4
                        ">
                            <div className="
                                mb-4
                                flex
                                items-center
                                gap-2
                            ">
                                <Clock3 className="
                                    h-4
                                    w-4
                                    text-slate-500
                                " />

                                <span className="
                                    text-sm
                                    font-semibold
                                    text-slate-900
                                ">
                                    Date & Time
                                </span>
                            </div>

                            <div className="
                                grid
                                gap-4
                                sm:grid-cols-2
                            ">
                                <div className="space-y-2">
                                    <Label>
                                        Start Date
                                    </Label>

                                    <Input
                                        type="date"
                                        value={
                                            form.start_date
                                        }
                                        onChange={(e) =>
                                            update(
                                                'start_date',
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Start Time
                                    </Label>

                                    <Input
                                        type="time"
                                        value={
                                            form.start_time
                                        }
                                        disabled={
                                            form.all_day
                                        }
                                        onChange={(e) =>
                                            update(
                                                'start_time',
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        End Date
                                    </Label>

                                    <Input
                                        type="date"
                                        value={
                                            form.end_date
                                        }
                                        onChange={(e) =>
                                            update(
                                                'end_date',
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        End Time
                                    </Label>

                                    <Input
                                        type="time"
                                        value={
                                            form.end_time
                                        }
                                        disabled={
                                            form.all_day
                                        }
                                        onChange={(e) =>
                                            update(
                                                'end_time',
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <label className="
                                mt-4
                                flex
                                cursor-pointer
                                items-center
                                gap-3
                                rounded-lg
                                border
                                p-3
                            ">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.all_day
                                    }
                                    onChange={(e) =>
                                        update(
                                            'all_day',
                                            e.target.checked
                                        )
                                    }
                                    className="
                                        h-4
                                        w-4
                                        rounded
                                    "
                                />

                                <span>
                                    <span className="
                                        block
                                        text-sm
                                        font-medium
                                    ">
                                        All-day event
                                    </span>

                                    <span className="
                                        block
                                        text-xs
                                        text-slate-500
                                    ">
                                        No specific time
                                        is required.
                                    </span>
                                </span>
                            </label>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">
                                Location
                            </Label>

                            <div className="relative">
                                <MapPin className="
                                    absolute
                                    left-3
                                    top-1/2
                                    h-4
                                    w-4
                                    -translate-y-1/2
                                    text-slate-400
                                " />

                                <Input
                                    id="location"
                                    className="pl-9"
                                    value={
                                        form.location
                                    }
                                    onChange={(e) =>
                                        update(
                                            'location',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Training room, office, online meeting..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Reminder
                            </Label>

                            <Select
                                value={
                                    form.reminder_minutes === ''
                                        ? 'none'
                                        : form.reminder_minutes
                                }
                                onValueChange={(value) =>
                                    update(
                                        'reminder_minutes',
                                        value === 'none' ? '' : value,
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="none">
                                        No reminder
                                    </SelectItem>

                                    <SelectItem value="5">
                                        5 minutes before
                                    </SelectItem>

                                    <SelectItem value="15">
                                        15 minutes before
                                    </SelectItem>

                                    <SelectItem value="30">
                                        30 minutes before
                                    </SelectItem>

                                    <SelectItem value="60">
                                        1 hour before
                                    </SelectItem>

                                    <SelectItem value="120">
                                        2 hours before
                                    </SelectItem>

                                    <SelectItem value="1440">
                                        1 day before
                                    </SelectItem>

                                    <SelectItem value="10080">
                                        1 week before
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">
                                Notes
                            </Label>

                            <div className="relative">
                                <FileText className="
                                    absolute
                                    left-3
                                    top-3
                                    h-4
                                    w-4
                                    text-slate-400
                                " />

                                <Textarea
                                    id="notes"
                                    className="min-h-28 pl-9"
                                    value={form.notes}
                                    onChange={(e) =>
                                        update(
                                            'notes',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Additional information..."
                                />
                            </div>
                        </div>
                    </CardContent>

                    <div className="
                        flex
                        shrink-0
                        items-center
                        justify-end
                        gap-3
                        border-t
                        bg-slate-50
                        p-4
                    ">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={
                                saving ||
                                !form.subject.trim()
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />

                            {saving
                                ? 'Saving...'
                                : isEditing
                                  ? 'Save Changes'
                                  : 'Save Event'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}