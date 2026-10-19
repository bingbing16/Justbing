export type EventType =
    | 'event'
    | 'reminder'
    | 'meeting'
    | 'training'
    | 'deadline'
    | 'appointment'
    | 'other'

export type EventPriority =
    | 'low'
    | 'normal'
    | 'high'
    | 'urgent'

export type EventStatus =
    | 'scheduled'
    | 'completed'
    | 'cancelled'

export interface CalendarEvent {
    id: number
    user_id: number

    type: EventType
    subject: string
    rpo_number: string | null

    start_date: string
    start_time: string | null

    end_date: string | null
    end_time: string | null

    all_day: boolean

    location: string | null

    priority: EventPriority

    reminder_minutes: number | null
    reminder_at: string | null

    notes: string | null

    color: string | null

    status: EventStatus

    created_at: string
    updated_at: string
}

export interface EventFormData {
    type: EventType
    subject: string
    rpo_number: string

    start_date: string
    start_time: string

    end_date: string
    end_time: string

    all_day: boolean

    location: string

    priority: EventPriority

    reminder_minutes: string

    notes: string

    color: string
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
    event: 'General Event',
    reminder: 'Reminder',
    meeting: 'Meeting',
    training: 'Training',
    deadline: 'Deadline',
    appointment: 'Appointment',
    other: 'Other',
}

export const EVENT_COLORS: Record<EventType, string> = {
    event: '#2563eb',
    reminder: '#7c3aed',
    meeting: '#0891b2',
    training: '#059669',
    deadline: '#dc2626',
    appointment: '#d97706',
    other: '#64748b',
}