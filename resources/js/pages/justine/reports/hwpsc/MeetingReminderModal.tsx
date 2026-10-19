import { createPortal } from 'react-dom'
import {
    BellRing,
    CalendarDays,
    Check,
    Clock3,
    MapPin,
    X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

export interface DashboardMeetingReminder {
    id: number
    subject: string
    rpo_number: string | null
    start_date: string
    start_time: string | null
    end_date: string | null
    end_time: string | null
    all_day: boolean
    location: string | null
    priority: string
    notes: string | null
    color: string | null
    status: string
}

function formatMeetingDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
}

function formatMeetingTime(time: string | null) {
    if (!time) return 'All day'

    const [hours, minutes] = time.split(':').map(Number)
    const date = new Date()

    date.setHours(hours, minutes, 0, 0)

    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    })
}

function getPriorityStyles(priority: string) {
    switch (priority) {
        case 'urgent':
            return {
                dot: 'bg-red-500',
                badge: 'border-red-200 bg-red-50 text-red-700',
                label: 'Urgent',
            }

        case 'high':
            return {
                dot: 'bg-orange-500',
                badge: 'border-orange-200 bg-orange-50 text-orange-700',
                label: 'High',
            }

        case 'low':
            return {
                dot: 'bg-slate-400',
                badge: 'border-slate-200 bg-slate-50 text-slate-600',
                label: 'Low',
            }

        default:
            return {
                dot: 'bg-blue-500',
                badge: 'border-blue-200 bg-blue-50 text-blue-700',
                label: 'Normal',
            }
    }
}

interface MeetingReminderModalProps {
    meeting: DashboardMeetingReminder
    onClose: () => void
    onDontShowAgain: () => void
    onViewCalendar: () => void
}

function MeetingReminderModal({
    meeting,
    onClose,
    onDontShowAgain,
    onViewCalendar,
}: MeetingReminderModalProps) {
    if (typeof document === 'undefined') {
        return null
    }

    const priority = getPriorityStyles(meeting.priority)

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="meeting-reminder-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        onClose()
                    }
                }}
            />

            {/* Modal */}
            <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl ring-1 ring-black/5">
                {/* Top accent */}
                <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

                {/* Close */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Close meeting reminder"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
                        <div className="flex items-start gap-4 pr-8">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/60">
                                <BellRing className="h-6 w-6" />
                            </div>

                            <div className="min-w-0">
                                <div className="mb-1 flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                                        Calendar Reminder
                                    </span>
                                </div>

                                <h2
                                    id="meeting-reminder-title"
                                    className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
                                >
                                    You have a meeting today
                                </h2>

                                <p className="mt-1.5 text-sm leading-5 text-slate-500">
                                    Here is your scheduled meeting for today.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Meeting information */}
                    <div className="px-6 pb-6 sm:px-8">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
                            {/* Subject */}
                            <div className="border-b border-slate-200 bg-white px-5 py-5">
                                <div className="flex items-start gap-3">
                                    <span
                                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${priority.dot}`}
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-lg font-bold text-slate-900">
                                                {meeting.subject}
                                            </h3>

                                            <span
                                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${priority.badge}`}
                                            >
                                                {priority.label}
                                            </span>
                                        </div>

                                        {meeting.rpo_number && (
                                            <p className="mt-1.5 text-sm text-slate-500">
                                                RPO #{meeting.rpo_number}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Date / Time */}
                            <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                                <div className="flex items-start gap-3 p-5">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                                        <CalendarDays className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Date
                                        </p>

                                        <p className="mt-1 text-sm font-semibold leading-5 text-slate-800">
                                            {formatMeetingDate(
                                                meeting.start_date,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-5">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                                        <Clock3 className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Time
                                        </p>

                                        <p className="mt-1 text-sm font-semibold leading-5 text-slate-800">
                                            {formatMeetingTime(
                                                meeting.start_time,
                                            )}

                                            {meeting.end_time && (
                                                <>
                                                    {' – '}
                                                    {formatMeetingTime(
                                                        meeting.end_time,
                                                    )}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            {meeting.location && (
                                <div className="border-t border-slate-200 px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                                            <MapPin className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Location
                                            </p>

                                            <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                                                {meeting.location}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {meeting.notes && (
                                <div className="border-t border-slate-200 px-5 py-4">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Notes
                                    </p>

                                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                        {meeting.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <button
                                type="button"
                                onClick={onDontShowAgain}
                                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                            >
                                <Check className="h-4 w-4" />
                                Don't show again
                            </button>

                            <div className="flex flex-col-reverse gap-2 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="h-10 rounded-xl border-slate-200 px-5"
                                >
                                    Dismiss
                                </Button>

                                <Button
                                    type="button"
                                    onClick={onViewCalendar}
                                    className="h-10 rounded-xl bg-blue-600 px-5 shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                                >
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    View Calendar
                                </Button>
                            </div>
                        </div>

                        {/* Footer hint */}
                        <p className="mt-4 text-center text-[11px] leading-4 text-slate-400">
                            You can still access all meetings from the Calendar
                            page.
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    )
}

export default MeetingReminderModal