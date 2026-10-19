import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import { Head } from '@inertiajs/react'

import FullCalendar from '@fullcalendar/react'

import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

import type {
    EventContentArg,
    EventInput,
} from '@fullcalendar/core'

import {
    CalendarDays,
    Check,
    Clock3,
    Filter,
    List,
    Plus,
    Search,
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
import { Badge } from '@/components/ui/badge'

import EventModal from './EventModal'

import type {
    CalendarEvent,
} from './types'

import {
    EVENT_COLORS,
    EVENT_TYPE_LABELS,
} from './types'


/*
|--------------------------------------------------------------------------
| Priority Configuration
|--------------------------------------------------------------------------
*/

const PRIORITY_COLORS = {
    urgent: '#dc2626',
    high: '#f97316',
    normal: '#2563eb',
    low: '#94a3b8',
} as const

const PRIORITY_LABELS = {
    urgent: 'Urgent',
    high: 'High',
    normal: 'Normal',
    low: 'Low',
} as const


/*
|--------------------------------------------------------------------------
| Month Configuration
|--------------------------------------------------------------------------
*/

const MONTHS = [
    {
        value: 1,
        label: 'January',
    },
    {
        value: 2,
        label: 'February',
    },
    {
        value: 3,
        label: 'March',
    },
    {
        value: 4,
        label: 'April',
    },
    {
        value: 5,
        label: 'May',
    },
    {
        value: 6,
        label: 'June',
    },
    {
        value: 7,
        label: 'July',
    },
    {
        value: 8,
        label: 'August',
    },
    {
        value: 9,
        label: 'September',
    },
    {
        value: 10,
        label: 'October',
    },
    {
        value: 11,
        label: 'November',
    },
    {
        value: 12,
        label: 'December',
    },
]


/*
|--------------------------------------------------------------------------
| Date Helpers
|--------------------------------------------------------------------------
*/

/**
 * Returns YYYY-MM-DD using the user's local timezone.
 */
const getLocalDateString = (
    date: Date
): string => {
    const year =
        date.getFullYear()

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, '0')

    const day =
        String(
            date.getDate()
        ).padStart(2, '0')

    return `${year}-${month}-${day}`
}


/**
 * Converts YYYY-MM-DD to:
 *
 * October 1, 2026
 */
const formatDisplayDate = (
    date: string | null | undefined
): string => {
    if (!date) {
        return ''
    }

    const parsed =
        new Date(
            `${date}T00:00:00`
        )

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return date
    }

    return parsed.toLocaleDateString(
        'en-US',
        {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }
    )
}


/**
 * Converts:
 *
 * 09:00     -> 9:00 AM
 * 13:30     -> 1:30 PM
 * 17:45:00  -> 5:45 PM
 */
const formatDisplayTime = (
    time: string | null | undefined
): string => {
    if (!time) {
        return ''
    }

    const normalized =
        time.substring(
            0,
            5
        )

    const parts =
        normalized.split(':')

    if (
        parts.length < 2
    ) {
        return time
    }

    const hours =
        Number(parts[0])

    const minutes =
        Number(parts[1])

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {
        return time
    }

    const suffix =
        hours >= 12
            ? 'PM'
            : 'AM'

    const displayHour =
        hours % 12 || 12

    return `${displayHour}:${String(
        minutes
    ).padStart(2, '0')} ${suffix}`
}


/**
 * Converts:
 *
 * 2026-10-01
 *
 * into:
 *
 * THU, OCTOBER 1, 2026
 */
const formatListDate = (
    date: string
): string => {
    const parsed =
        new Date(
            `${date}T00:00:00`
        )

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return date
    }

    return parsed
        .toLocaleDateString(
            'en-US',
            {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }
        )
        .toUpperCase()
}


/**
 * Capitalizes a status/type value.
 */
const formatLabel = (
    value: string
): string => {
    return value
        .replace(
            /_/g,
            ' '
        )
        .replace(
            /\b\w/g,
            (letter) =>
                letter.toUpperCase()
        )
}


/*
|--------------------------------------------------------------------------
| Calendar Page
|--------------------------------------------------------------------------
*/

export default function CalendarPage() {

    /*
    |--------------------------------------------------------------------------
    | Calendar State
    |--------------------------------------------------------------------------
    */

    const [
        events,
        setEvents,
    ] = useState<
        CalendarEvent[]
    >([])

    const [
        loading,
        setLoading,
    ] = useState(true)

    const [
        modalOpen,
        setModalOpen,
    ] = useState(false)

    const [
        selectedDate,
        setSelectedDate,
    ] = useState<
        string | null
    >(null)

    const [
        selectedEvent,
        setSelectedEvent,
    ] = useState<
        CalendarEvent | null
    >(null)

    const [
        search,
        setSearch,
    ] = useState('')


    /*
    |--------------------------------------------------------------------------
    | Event List Modal State
    |--------------------------------------------------------------------------
    */

    const [
        eventListOpen,
        setEventListOpen,
    ] = useState(false)

    const currentDate =
        new Date()

    const [
        eventListYear,
        setEventListYear,
    ] = useState(
        currentDate.getFullYear()
    )

    const [
        eventListMonth,
        setEventListMonth,
    ] = useState(
        currentDate.getMonth() + 1
    )


    /*
    |--------------------------------------------------------------------------
    | Load Events
    |--------------------------------------------------------------------------
    */

    const loadEvents =
        useCallback(
            async () => {
                setLoading(true)

                try {
                    const response =
                        await fetch(
                            '/calendar/events',
                            {
                                headers: {
                                    Accept:
                                        'application/json',
                                },

                                credentials:
                                    'same-origin',
                            }
                        )

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            'Unable to load events.'
                        )
                    }

                    const data =
                        await response.json()

                    setEvents(data)
                } catch (
                    error
                ) {
                    console.error(
                        error
                    )
                } finally {
                    setLoading(false)
                }
            },
            []
        )


    useEffect(() => {
        loadEvents()
    }, [loadEvents])


    /*
    |--------------------------------------------------------------------------
    | Open Create Event Modal
    |--------------------------------------------------------------------------
    */

    const openCreateModal = (
        date: string
    ) => {
        setSelectedEvent(null)
        setSelectedDate(date)
        setModalOpen(true)
    }


    /*
    |--------------------------------------------------------------------------
    | Open Edit Event Modal
    |--------------------------------------------------------------------------
    */

    const openEditModal = (
        event: CalendarEvent
    ) => {
        setSelectedEvent(event)

        setSelectedDate(
            event.start_date
        )

        setEventListOpen(false)

        setModalOpen(true)
    }


    /*
    |--------------------------------------------------------------------------
    | Close Event Modal
    |--------------------------------------------------------------------------
    */

    const closeModal = () => {
        setModalOpen(false)
        setSelectedEvent(null)
    }


    /*
    |--------------------------------------------------------------------------
    | Open Event List
    |--------------------------------------------------------------------------
    */

    const openEventList = () => {
        const today =
            new Date()

        setEventListYear(
            today.getFullYear()
        )

        setEventListMonth(
            today.getMonth() + 1
        )

        setEventListOpen(true)
    }


    /*
    |--------------------------------------------------------------------------
    | Search / Calendar Events
    |--------------------------------------------------------------------------
    */

    const calendarEvents:
        EventInput[] =
        useMemo(() => {
            return events
                .filter(
                    (event) => {
                        const query =
                            search
                                .trim()
                                .toLowerCase()

                        if (
                            !query
                        ) {
                            return true
                        }

                        return [
                            event.subject,
                            event.rpo_number,
                            event.location,
                            event.notes,
                            event.type,
                            event.status,
                        ]
                            .filter(
                                Boolean
                            )
                            .some(
                                (
                                    value
                                ) =>
                                    String(
                                        value
                                    )
                                        .toLowerCase()
                                        .includes(
                                            query
                                        )
                            )
                    }
                )
                .map(
                    (event) => ({
                        id: String(
                            event.id
                        ),

                        title:
                            event.subject,

                        start:
                            event.all_day
                                ? event.start_date
                                : `${event.start_date}T${
                                      event.start_time ??
                                      '09:00'
                                  }`,

                        end:
                            event.end_date
                                ? event.all_day
                                    ? event.end_date
                                    : `${event.end_date}T${
                                          event.end_time ??
                                          '17:00'
                                      }`
                                : undefined,

                        allDay:
                            event.all_day,

                        /*
                        |--------------------------------------------------------------------------
                        | Event Type Color
                        |--------------------------------------------------------------------------
                        */

                        backgroundColor:
                            event.color ??
                            EVENT_COLORS[
                                event.type
                            ],

                        /*
                        |--------------------------------------------------------------------------
                        | Priority Border
                        |--------------------------------------------------------------------------
                        */

                        borderColor:
                            PRIORITY_COLORS[
                                event.priority
                            ],

                        extendedProps: {
                            calendarEvent:
                                event,
                        },
                    })
                )
        }, [
            events,
            search,
        ])


    /*
    |--------------------------------------------------------------------------
    | Upcoming Events
    |--------------------------------------------------------------------------
    */

    const upcomingEvents =
        useMemo(() => {
            const today =
                new Date()

            today.setHours(
                0,
                0,
                0,
                0
            )

            return [
                ...events,
            ]
                .filter(
                    (event) =>
                        event.status ===
                        'scheduled'
                )
                .filter(
                    (event) =>
                        new Date(
                            `${event.start_date}T00:00:00`
                        ) >= today
                )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        new Date(
                            `${a.start_date}T${
                                a.start_time ??
                                '00:00'
                            }`
                        ).getTime() -
                        new Date(
                            `${b.start_date}T${
                                b.start_time ??
                                '00:00'
                            }`
                        ).getTime()
                )
                .slice(
                    0,
                    6
                )
        }, [events])


    /*
    |--------------------------------------------------------------------------
    | Event List Years
    |--------------------------------------------------------------------------
    */

    const eventListYears =
        useMemo(() => {
            const years =
                new Set<number>()

            years.add(
                new Date()
                    .getFullYear()
            )

            events.forEach(
                (event) => {
                    const year =
                        Number(
                            event.start_date.slice(
                                0,
                                4
                            )
                        )

                    if (
                        !Number.isNaN(
                            year
                        )
                    ) {
                        years.add(
                            year
                        )
                    }
                }
            )

            return Array.from(
                years
            ).sort(
                (a, b) =>
                    b - a
            )
        }, [events])


    /*
    |--------------------------------------------------------------------------
    | Filtered Event List
    |--------------------------------------------------------------------------
    */

    const eventListEvents =
        useMemo(() => {
            return [
                ...events,
            ]
                .filter(
                    (event) => {
                        const year =
                            Number(
                                event.start_date.slice(
                                    0,
                                    4
                                )
                            )

                        const month =
                            Number(
                                event.start_date.slice(
                                    5,
                                    7
                                )
                            )

                        const yearMatches =
                            year ===
                            eventListYear

                        const monthMatches =
                            eventListMonth ===
                                0 ||
                            month ===
                                eventListMonth

                        return (
                            yearMatches &&
                            monthMatches
                        )
                    }
                )
                .filter(
                    (event) => {
                        const query =
                            search
                                .trim()
                                .toLowerCase()

                        if (
                            !query
                        ) {
                            return true
                        }

                        return [
                            event.subject,
                            event.rpo_number,
                            event.location,
                            event.notes,
                            event.type,
                            event.status,
                        ]
                            .filter(
                                Boolean
                            )
                            .some(
                                (
                                    value
                                ) =>
                                    String(
                                        value
                                    )
                                        .toLowerCase()
                                        .includes(
                                            query
                                        )
                            )
                    }
                )
                .sort(
                    (
                        a,
                        b
                    ) => {
                        const dateA =
                            `${a.start_date}T${
                                a.start_time ??
                                '00:00'
                            }`

                        const dateB =
                            `${b.start_date}T${
                                b.start_time ??
                                '00:00'
                            }`

                        return (
                            new Date(
                                dateA
                            ).getTime() -
                            new Date(
                                dateB
                            ).getTime()
                        )
                    }
                )
        }, [
            events,
            eventListYear,
            eventListMonth,
            search,
        ])


    /*
    |--------------------------------------------------------------------------
    | Group Event List By Day
    |--------------------------------------------------------------------------
    */

    const groupedEventList =
        useMemo(() => {
            const groups =
                new Map<
                    string,
                    CalendarEvent[]
                >()

            eventListEvents.forEach(
                (event) => {
                    const existing =
                        groups.get(
                            event.start_date
                        ) ?? []

                    existing.push(
                        event
                    )

                    groups.set(
                        event.start_date,
                        existing
                    )
                }
            )

            return Array.from(
                groups.entries()
            )
        }, [
            eventListEvents,
        ])


    /*
    |--------------------------------------------------------------------------
    | Event Click
    |--------------------------------------------------------------------------
    */

    const handleEventClick = (
        info: any
    ) => {
        const event =
            info.event
                .extendedProps
                .calendarEvent as
                | CalendarEvent
                | undefined

        if (event) {
            openEditModal(
                event
            )
        }
    }


    /*
    |--------------------------------------------------------------------------
    | Date Click
    |--------------------------------------------------------------------------
    */

    const handleDateClick = (
        info: {
            dateStr: string
        }
    ) => {
        openCreateModal(
            info.dateStr
        )
    }


    /*
    |--------------------------------------------------------------------------
    | Move Event
    |--------------------------------------------------------------------------
    */

    const moveEvent =
        async (
            event: CalendarEvent,
            start: Date,
            end: Date | null
        ) => {

            const formatDate = (
                date: Date
            ) =>
                getLocalDateString(
                    date
                )

            const formatTime = (
                date: Date
            ) =>
                date
                    .toTimeString()
                    .slice(
                        0,
                        5
                    )

            const response =
                await fetch(
                    `/calendar/events/${event.id}/move`,
                    {
                        method: 'PATCH',

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

                        credentials:
                            'same-origin',

                        body: JSON.stringify({
                            start_date:
                                formatDate(
                                    start
                                ),

                            start_time:
                                event.all_day
                                    ? null
                                    : formatTime(
                                          start
                                      ),

                            end_date:
                                end
                                    ? formatDate(
                                          end
                                      )
                                    : null,

                            end_time:
                                end &&
                                !event.all_day
                                    ? formatTime(
                                          end
                                      )
                                    : null,
                        }),
                    }
                )

            if (
                !response.ok
            ) {
                throw new Error(
                    'Unable to move event.'
                )
            }

            await loadEvents()
        }


    /*
    |--------------------------------------------------------------------------
    | Event Drop
    |--------------------------------------------------------------------------
    */

    const handleEventDrop =
        async (
            info: any
        ) => {
            const event =
                info.event
                    .extendedProps
                    .calendarEvent as
                    CalendarEvent

            try {
                await moveEvent(
                    event,
                    info.event.start!,
                    info.event.end
                )
            } catch (
                error
            ) {
                console.error(
                    error
                )

                info.revert()
            }
        }


    /*
    |--------------------------------------------------------------------------
    | Event Resize
    |--------------------------------------------------------------------------
    */

    const handleEventResize =
        async (
            info: any
        ) => {
            const event =
                info.event
                    .extendedProps
                    .calendarEvent as
                    CalendarEvent

            try {
                await moveEvent(
                    event,
                    info.event.start!,
                    info.event.end
                )
            } catch (
                error
            ) {
                console.error(
                    error
                )

                info.revert()
            }
        }


    /*
    |--------------------------------------------------------------------------
    | Custom Calendar Event
    |--------------------------------------------------------------------------
    */

    const renderEventContent =
        (
            info: EventContentArg
        ) => {

            const event =
                info.event
                    .extendedProps
                    .calendarEvent as
                    | CalendarEvent
                    | undefined

            if (!event) {
                return (
                    <div className="truncate">
                        {
                            info.event
                                .title
                        }
                    </div>
                )
            }

            const priorityColor =
                PRIORITY_COLORS[
                    event.priority
                ]

            const displayTime =
                !event.all_day &&
                info.event.start
                    ? formatDisplayTime(
                          info.event.start
                              .toTimeString()
                              .slice(
                                  0,
                                  5
                              )
                      )
                    : ''

            return (
                <div
                    className="
                        flex
                        min-w-0
                        items-center
                        gap-1.5
                        overflow-hidden
                        px-0.5
                    "
                >
                    {/* Priority */}

                    <span
                        className="
                            h-2
                            w-2
                            shrink-0
                            rounded-full
                        "
                        style={{
                            backgroundColor:
                                priorityColor,
                        }}
                        title={
                            PRIORITY_LABELS[
                                event.priority
                            ]
                        }
                    />

                    {/* Time */}

                    {!event.all_day &&
                        displayTime && (
                            <span
                                className="
                                    shrink-0
                                    text-[11px]
                                    font-medium
                                "
                            >
                                {
                                    displayTime
                                }
                            </span>
                        )}

                    {/* Subject */}

                    <span
                        className="
                            min-w-0
                            truncate
                            font-medium
                        "
                    >
                        {
                            event.subject
                        }
                    </span>
                </div>
            )
        }


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <>
            <Head title="Event Calendar" />

            <div
                className="
                    min-h-screen
                    bg-slate-50
                    p-4
                    sm:p-6
                    lg:p-8
                "
            >
                <div
                    className="
                        mx-auto
                        max-w-[1600px]
                        space-y-6
                    "
                >

                    {/* ======================================================
                        HEADER
                    ====================================================== */}

                    <div
                        className="
                            flex
                            flex-col
                            gap-4
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                        "
                    >
                        <div>
                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >
                                <div
                                    className="
                                        flex
                                        h-11
                                        w-11
                                        items-center
                                        justify-center
                                        rounded-2xl
                                        bg-blue-600
                                        text-white
                                        shadow-sm
                                    "
                                >
                                    <CalendarDays
                                        className="h-6 w-6"
                                    />
                                </div>

                                <div>
                                    <h1
                                        className="
                                            text-2xl
                                            font-bold
                                            tracking-tight
                                            text-slate-900
                                        "
                                    >
                                        Event Calendar
                                    </h1>

                                    <p
                                        className="
                                            text-sm
                                            text-slate-500
                                        "
                                    >
                                        Manage your personal
                                        events, activities,
                                        and reminders.
                                    </p>
                                </div>
                            </div>
                        </div>


                        {/* ==================================================
                            HEADER BUTTONS
                        ================================================== */}

                        <div
                            className="
                                flex
                                flex-wrap
                                items-center
                                gap-2
                            "
                        >
                            <Button
                                variant="outline"
                                onClick={
                                    openEventList
                                }
                            >
                                <List
                                    className="
                                        mr-2
                                        h-4
                                        w-4
                                    "
                                />

                                Event List
                            </Button>

                            <Button
                                onClick={() =>
                                    openCreateModal(
                                        getLocalDateString(
                                            new Date()
                                        )
                                    )
                                }
                            >
                                <Plus
                                    className="
                                        mr-2
                                        h-4
                                        w-4
                                    "
                                />

                                Add Event
                            </Button>
                        </div>
                    </div>


                    {/* ======================================================
                        SEARCH
                    ====================================================== */}

                    <Card
                        className="
                            border-slate-200
                            shadow-sm
                        "
                    >
                        <CardContent
                            className="p-4"
                        >
                            <div
                                className="
                                    relative
                                    max-w-xl
                                "
                            >
                                <Search
                                    className="
                                        absolute
                                        left-3
                                        top-1/2
                                        h-4
                                        w-4
                                        -translate-y-1/2
                                        text-slate-400
                                    "
                                />

                                <Input
                                    className="pl-9"
                                    placeholder="
                                        Search subject,
                                        RPO number,
                                        location...
                                    "
                                    value={
                                        search
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>


                    {/* ======================================================
                        PRIORITY LEGEND
                    ====================================================== */}

                    <Card
                        className="
                            border-slate-200
                            shadow-sm
                        "
                    >
                        <CardContent
                            className="
                                flex
                                flex-wrap
                                items-center
                                gap-x-6
                                gap-y-3
                                px-4
                                py-3
                            "
                        >
                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >
                                <Filter
                                    className="
                                        h-3.5
                                        w-3.5
                                        text-slate-400
                                    "
                                />

                                <span
                                    className="
                                        text-xs
                                        font-semibold
                                        text-slate-600
                                    "
                                >
                                    Priority
                                </span>
                            </div>

                            {(
                                Object.keys(
                                    PRIORITY_LABELS
                                ) as Array<
                                    keyof typeof PRIORITY_LABELS
                                >
                            ).map(
                                (
                                    priority
                                ) => (
                                    <div
                                        key={
                                            priority
                                        }
                                        className="
                                            flex
                                            items-center
                                            gap-2
                                            text-xs
                                            text-slate-600
                                        "
                                    >
                                        <span
                                            className="
                                                h-2.5
                                                w-2.5
                                                rounded-full
                                            "
                                            style={{
                                                backgroundColor:
                                                    PRIORITY_COLORS[
                                                        priority
                                                    ],
                                            }}
                                        />

                                        {
                                            PRIORITY_LABELS[
                                                priority
                                            ]
                                        }
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>


                    {/* ======================================================
                        MAIN CONTENT
                    ====================================================== */}

                    <div
                        className="
                            grid
                            gap-6
                            lg:grid-cols-[280px_minmax(0,1fr)]
                        "
                    >

                        {/* ==================================================
                            UPCOMING
                        ================================================== */}

                        <Card
                            className="
                                border-slate-200
                                shadow-sm
                            "
                        >
                            <CardHeader>
                                <CardTitle
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                        text-base
                                    "
                                >
                                    <Clock3
                                        className="
                                            h-4
                                            w-4
                                            text-blue-600
                                        "
                                    />

                                    Upcoming
                                </CardTitle>
                            </CardHeader>

                            <CardContent
                                className="space-y-3"
                            >
                                {upcomingEvents.length ===
                                0 ? (
                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-dashed
                                            p-6
                                            text-center
                                            text-sm
                                            text-slate-400
                                        "
                                    >
                                        No upcoming
                                        events.
                                    </div>
                                ) : (
                                    upcomingEvents.map(
                                        (
                                            event
                                        ) => (
                                            <button
                                                key={
                                                    event.id
                                                }
                                                type="button"
                                                className="
                                                    w-full
                                                    rounded-xl
                                                    border
                                                    border-slate-200
                                                    bg-white
                                                    p-3
                                                    text-left
                                                    transition
                                                    hover:border-blue-200
                                                    hover:bg-blue-50/40
                                                "
                                                onClick={() =>
                                                    openEditModal(
                                                        event
                                                    )
                                                }
                                            >
                                                <div
                                                    className="
                                                        flex
                                                        items-start
                                                        gap-3
                                                    "
                                                >
                                                    {/* Priority */}

                                                    <span
                                                        className="
                                                            mt-1
                                                            h-2.5
                                                            w-2.5
                                                            shrink-0
                                                            rounded-full
                                                        "
                                                        style={{
                                                            backgroundColor:
                                                                PRIORITY_COLORS[
                                                                    event.priority
                                                                ],
                                                        }}
                                                        title={
                                                            PRIORITY_LABELS[
                                                                event.priority
                                                            ]
                                                        }
                                                    />

                                                    <div
                                                        className="
                                                            min-w-0
                                                            flex-1
                                                        "
                                                    >
                                                        <div
                                                            className="
                                                                flex
                                                                items-start
                                                                justify-between
                                                                gap-2
                                                            "
                                                        >
                                                            <p
                                                                className="
                                                                    truncate
                                                                    text-sm
                                                                    font-semibold
                                                                    text-slate-900
                                                                "
                                                            >
                                                                {
                                                                    event.subject
                                                                }
                                                            </p>

                                                            <span
                                                                className="
                                                                    shrink-0
                                                                    text-[10px]
                                                                    font-medium
                                                                    uppercase
                                                                    text-slate-400
                                                                "
                                                            >
                                                                {
                                                                    PRIORITY_LABELS[
                                                                        event.priority
                                                                    ]
                                                                }
                                                            </span>
                                                        </div>

                                                        <p
                                                            className="
                                                                mt-1
                                                                text-xs
                                                                text-slate-500
                                                            "
                                                        >
                                                            {
                                                                formatDisplayDate(
                                                                    event.start_date
                                                                )
                                                            }

                                                            {event.start_time && (
                                                                <>
                                                                    {' • '}
                                                                    {
                                                                        formatDisplayTime(
                                                                            event.start_time
                                                                        )
                                                                    }
                                                                </>
                                                            )}
                                                        </p>

                                                        {event.rpo_number && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="mt-2"
                                                            >
                                                                RPO #
                                                                {
                                                                    event.rpo_number
                                                                }
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    )
                                )}
                            </CardContent>
                        </Card>


                        {/* ==================================================
                            CALENDAR
                        ================================================== */}

                        <Card
                            className="
                                min-w-0
                                border-slate-200
                                shadow-sm
                            "
                        >
                            <CardContent
                                className="
                                    p-4
                                    sm:p-6
                                "
                            >
                                {loading ? (
                                    <div
                                        className="
                                            flex
                                            h-[650px]
                                            items-center
                                            justify-center
                                            text-sm
                                            text-slate-500
                                        "
                                    >
                                        Loading calendar...
                                    </div>
                                ) : (
                                    <div className="calendar-wrapper">

                                        <FullCalendar
                                            plugins={[
                                                dayGridPlugin,
                                                timeGridPlugin,
                                                interactionPlugin,
                                            ]}

                                            initialView="dayGridMonth"

                                            headerToolbar={{
                                                left:
                                                    'prev,next today',

                                                center:
                                                    'title',

                                                right:
                                                    'dayGridMonth,timeGridWeek,timeGridDay',
                                            }}

                                            height="auto"

                                            dayMaxEvents={3}

                                            editable

                                            selectable

                                            events={
                                                calendarEvents
                                            }

                                            dateClick={
                                                handleDateClick
                                            }

                                            eventClick={
                                                handleEventClick
                                            }

                                            eventDrop={
                                                handleEventDrop
                                            }

                                            eventResize={
                                                handleEventResize
                                            }

                                            eventContent={
                                                renderEventContent
                                            }

                                            /*
                                            |--------------------------------------------------------------------------
                                            | AM / PM
                                            |--------------------------------------------------------------------------
                                            */

                                            eventTimeFormat={{
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                meridiem: 'short',
                                            }}

                                            slotLabelFormat={{
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                meridiem: 'short',
                                            }}

                                            dayMaxEventRows={4}

                                            weekends
                                        />

                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>


            {/* ==============================================================
                EVENT LIST MODAL
            ============================================================== */}

            {eventListOpen && (
                <div
                    className="
                        fixed
                        inset-0
                        z-[100]
                        flex
                        items-center
                        justify-center
                        bg-slate-950/50
                        p-4
                        backdrop-blur-sm
                    "
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            setEventListOpen(
                                false
                            )
                        }
                    }}
                >
                    <div
                        className="
                            flex
                            max-h-[90vh]
                            w-full
                            max-w-4xl
                            flex-col
                            overflow-hidden
                            rounded-2xl
                            bg-white
                            shadow-2xl
                        "
                    >

                        {/* ==================================================
                            MODAL HEADER
                        ================================================== */}

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                border-b
                                border-slate-200
                                px-5
                                py-4
                                sm:px-6
                            "
                        >
                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >
                                <div
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-blue-50
                                        text-blue-600
                                    "
                                >
                                    <List
                                        className="
                                            h-5
                                            w-5
                                        "
                                    />
                                </div>

                                <div>
                                    <h2
                                        className="
                                            text-lg
                                            font-bold
                                            text-slate-900
                                        "
                                    >
                                        Event List
                                    </h2>

                                    <p
                                        className="
                                            text-xs
                                            text-slate-500
                                        "
                                    >
                                        View your events
                                        by year and month.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setEventListOpen(
                                        false
                                    )
                                }
                                className="
                                    rounded-lg
                                    p-2
                                    text-slate-400
                                    transition
                                    hover:bg-slate-100
                                    hover:text-slate-700
                                "
                            >
                                <X
                                    className="
                                        h-5
                                        w-5
                                    "
                                />
                            </button>
                        </div>


                        {/* ==================================================
                            FILTERS
                        ================================================== */}

                        <div
                            className="
                                border-b
                                border-slate-200
                                bg-slate-50
                                px-5
                                py-4
                                sm:px-6
                            "
                        >
                            <div
                                className="
                                    grid
                                    gap-3
                                    sm:grid-cols-2
                                "
                            >

                                {/* Year */}

                                <div>
                                    <label
                                        htmlFor="event-list-year"
                                        className="
                                            mb-1.5
                                            block
                                            text-xs
                                            font-semibold
                                            text-slate-600
                                        "
                                    >
                                        Year
                                    </label>

                                    <select
                                        id="event-list-year"
                                        value={
                                            eventListYear
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setEventListYear(
                                                Number(
                                                    e.target.value
                                                )
                                            )
                                        }
                                        className="
                                            h-10
                                            w-full
                                            rounded-lg
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            transition
                                            focus:border-blue-500
                                            focus:ring-2
                                            focus:ring-blue-500/20
                                        "
                                    >
                                        {eventListYears.map(
                                            (
                                                year
                                            ) => (
                                                <option
                                                    key={
                                                        year
                                                    }
                                                    value={
                                                        year
                                                    }
                                                >
                                                    {year}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>


                                {/* Month */}

                                <div>
                                    <label
                                        htmlFor="event-list-month"
                                        className="
                                            mb-1.5
                                            block
                                            text-xs
                                            font-semibold
                                            text-slate-600
                                        "
                                    >
                                        Month
                                    </label>

                                    <select
                                        id="event-list-month"
                                        value={
                                            eventListMonth
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setEventListMonth(
                                                Number(
                                                    e.target.value
                                                )
                                            )
                                        }
                                        className="
                                            h-10
                                            w-full
                                            rounded-lg
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            transition
                                            focus:border-blue-500
                                            focus:ring-2
                                            focus:ring-blue-500/20
                                        "
                                    >
                                        <option value="0">
                                            All Months
                                        </option>

                                        {MONTHS.map(
                                            (
                                                month
                                            ) => (
                                                <option
                                                    key={
                                                        month.value
                                                    }
                                                    value={
                                                        month.value
                                                    }
                                                >
                                                    {
                                                        month.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>


                            {/* Summary */}

                            <div
                                className="
                                    mt-3
                                    flex
                                    items-center
                                    justify-between
                                "
                            >
                                <p
                                    className="
                                        text-xs
                                        text-slate-500
                                    "
                                >
                                    Showing events for{' '}
                                    <span
                                        className="
                                            font-semibold
                                            text-slate-700
                                        "
                                    >
                                        {
                                            eventListYear
                                        }
                                    </span>

                                    {eventListMonth >
                                        0 && (
                                        <>
                                            {' • '}
                                            <span
                                                className="
                                                    font-semibold
                                                    text-slate-700
                                                "
                                            >
                                                {
                                                    MONTHS.find(
                                                        (
                                                            month
                                                        ) =>
                                                            month.value ===
                                                            eventListMonth
                                                    )?.label
                                                }
                                            </span>
                                        </>
                                    )}
                                </p>

                                <Badge
                                    variant="secondary"
                                >
                                    {
                                        eventListEvents.length
                                    }{' '}
                                    {eventListEvents.length ===
                                    1
                                        ? 'event'
                                        : 'events'}
                                </Badge>
                            </div>
                        </div>


                        {/* ==================================================
                            EVENT LIST CONTENT
                        ================================================== */}

                        <div
                            className="
                                min-h-0
                                flex-1
                                overflow-y-auto
                                px-5
                                py-5
                                sm:px-6
                            "
                        >
                            {groupedEventList.length ===
                            0 ? (
                                <div
                                    className="
                                        flex
                                        min-h-[300px]
                                        flex-col
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-dashed
                                        border-slate-200
                                        bg-slate-50
                                        px-6
                                        text-center
                                    "
                                >
                                    <div
                                        className="
                                            mb-3
                                            flex
                                            h-12
                                            w-12
                                            items-center
                                            justify-center
                                            rounded-full
                                            bg-slate-100
                                            text-slate-400
                                        "
                                    >
                                        <CalendarDays
                                            className="
                                                h-6
                                                w-6
                                            "
                                        />
                                    </div>

                                    <h3
                                        className="
                                            text-sm
                                            font-semibold
                                            text-slate-700
                                        "
                                    >
                                        No events found
                                    </h3>

                                    <p
                                        className="
                                            mt-1
                                            max-w-sm
                                            text-xs
                                            text-slate-400
                                        "
                                    >
                                        There are no events
                                        matching the selected
                                        year and month.
                                    </p>

                                    <Button
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => {
                                            setEventListOpen(
                                                false
                                            )

                                            openCreateModal(
                                                getLocalDateString(
                                                    new Date()
                                                )
                                            )
                                        }}
                                    >
                                        <Plus
                                            className="
                                                mr-2
                                                h-4
                                                w-4
                                            "
                                        />

                                        Add Event
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    className="
                                        space-y-7
                                    "
                                >
                                    {groupedEventList.map(
                                        ([
                                            date,
                                            dayEvents,
                                        ]) => (
                                            <div
                                                key={
                                                    date
                                                }
                                            >

                                                {/* Date Header */}

                                                <div
                                                    className="
                                                        mb-3
                                                        flex
                                                        items-center
                                                        gap-3
                                                    "
                                                >
                                                    <div
                                                        className="
                                                            flex
                                                            h-8
                                                            min-w-8
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            bg-blue-600
                                                            px-2
                                                            text-[10px]
                                                            font-bold
                                                            text-white
                                                        "
                                                    >
                                                        {
                                                            date.slice(
                                                                8,
                                                                10
                                                            )
                                                        }
                                                    </div>

                                                    <div>
                                                        <h3
                                                            className="
                                                                text-sm
                                                                font-bold
                                                                text-slate-900
                                                            "
                                                        >
                                                            {
                                                                formatListDate(
                                                                    date
                                                                )
                                                            }
                                                        </h3>

                                                        <p
                                                            className="
                                                                text-[11px]
                                                                text-slate-400
                                                            "
                                                        >
                                                            {
                                                                dayEvents.length
                                                            }{' '}
                                                            {dayEvents.length ===
                                                            1
                                                                ? 'event'
                                                                : 'events'}
                                                        </p>
                                                    </div>

                                                    <div
                                                        className="
                                                            h-px
                                                            flex-1
                                                            bg-slate-100
                                                        "
                                                    />
                                                </div>


                                                {/* Events */}

                                                <div
                                                    className="
                                                        space-y-2
                                                    "
                                                >
                                                    {dayEvents.map(
                                                        (
                                                            event
                                                        ) => (
                                                            <button
                                                                key={
                                                                    event.id
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        event
                                                                    )
                                                                }
                                                                className="
                                                                    group
                                                                    w-full
                                                                    rounded-xl
                                                                    border
                                                                    border-slate-200
                                                                    bg-white
                                                                    p-4
                                                                    text-left
                                                                    transition
                                                                    hover:border-blue-200
                                                                    hover:bg-blue-50/30
                                                                    hover:shadow-sm
                                                                "
                                                            >
                                                                <div
                                                                    className="
                                                                        flex
                                                                        items-start
                                                                        gap-4
                                                                    "
                                                                >

                                                                    {/* Priority */}

                                                                    <span
                                                                        className="
                                                                            mt-1
                                                                            h-3
                                                                            w-3
                                                                            shrink-0
                                                                            rounded-full
                                                                        "
                                                                        style={{
                                                                            backgroundColor:
                                                                                PRIORITY_COLORS[
                                                                                    event.priority
                                                                                ],
                                                                        }}
                                                                        title={
                                                                            PRIORITY_LABELS[
                                                                                event.priority
                                                                            ]
                                                                        }
                                                                    />


                                                                    {/* Time */}

                                                                    <div
                                                                        className="
                                                                            w-20
                                                                            shrink-0
                                                                        "
                                                                    >
                                                                        <p
                                                                            className="
                                                                                text-sm
                                                                                font-semibold
                                                                                text-slate-700
                                                                            "
                                                                        >
                                                                            {event.all_day
                                                                                ? 'All day'
                                                                                : formatDisplayTime(
                                                                                      event.start_time
                                                                                  )}
                                                                        </p>
                                                                    </div>


                                                                    {/* Subject */}

                                                                    <div
                                                                        className="
                                                                            min-w-0
                                                                            flex-1
                                                                        "
                                                                    >
                                                                        <div
                                                                            className="
                                                                                flex
                                                                                flex-wrap
                                                                                items-center
                                                                                gap-2
                                                                            "
                                                                        >
                                                                            <p
                                                                                className="
                                                                                    text-sm
                                                                                    font-semibold
                                                                                    text-slate-900
                                                                                "
                                                                            >
                                                                                {
                                                                                    event.subject
                                                                                }
                                                                            </p>

                                                                            <span
                                                                                className="
                                                                                    rounded-full
                                                                                    px-2
                                                                                    py-0.5
                                                                                    text-[10px]
                                                                                    font-medium
                                                                                "
                                                                                style={{
                                                                                    backgroundColor:
                                                                                        `${EVENT_COLORS[event.type]}15`,
                                                                                    color:
                                                                                        EVENT_COLORS[
                                                                                            event.type
                                                                                        ],
                                                                                }}
                                                                            >
                                                                                {
                                                                                    EVENT_TYPE_LABELS[
                                                                                        event.type
                                                                                    ]
                                                                                }
                                                                            </span>
                                                                        </div>


                                                                        {/* Details */}

                                                                        <div
                                                                            className="
                                                                                mt-1.5
                                                                                flex
                                                                                flex-wrap
                                                                                items-center
                                                                                gap-x-2
                                                                                gap-y-1
                                                                                text-xs
                                                                                text-slate-500
                                                                            "
                                                                        >
                                                                            {event.rpo_number && (
                                                                                <span>
                                                                                    RPO #
                                                                                    {
                                                                                        event.rpo_number
                                                                                    }
                                                                                </span>
                                                                            )}

                                                                            {event.rpo_number &&
                                                                                event.location && (
                                                                                    <span>
                                                                                        •
                                                                                    </span>
                                                                                )}

                                                                            {event.location && (
                                                                                <span>
                                                                                    {
                                                                                        event.location
                                                                                    }
                                                                                </span>
                                                                            )}

                                                                            {(event.rpo_number ||
                                                                                event.location) && (
                                                                                <span>
                                                                                    •
                                                                                </span>
                                                                            )}

                                                                            <span>
                                                                                {
                                                                                    formatLabel(
                                                                                        event.status
                                                                                    )
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>


                                                                    {/* Priority Label */}

                                                                    <div
                                                                        className="
                                                                            hidden
                                                                            shrink-0
                                                                            sm:block
                                                                        "
                                                                    >
                                                                        <span
                                                                            className="
                                                                                text-[10px]
                                                                                font-semibold
                                                                                uppercase
                                                                                tracking-wide
                                                                            "
                                                                            style={{
                                                                                color:
                                                                                    PRIORITY_COLORS[
                                                                                        event.priority
                                                                                    ],
                                                                            }}
                                                                        >
                                                                            {
                                                                                PRIORITY_LABELS[
                                                                                    event.priority
                                                                                ]
                                                                            }
                                                                        </span>
                                                                    </div>

                                                                </div>
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>


                        {/* ==================================================
                            MODAL FOOTER
                        ================================================== */}

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                border-t
                                border-slate-200
                                bg-slate-50
                                px-5
                                py-3
                                sm:px-6
                            "
                        >
                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    text-xs
                                    text-slate-500
                                "
                            >
                                <Check
                                    className="
                                        h-3.5
                                        w-3.5
                                        text-emerald-500
                                    "
                                />

                                Click an event to edit
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setEventListOpen(
                                        false
                                    )
                                }
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}


            {/* ==============================================================
                EVENT MODAL
            ============================================================== */}

            <EventModal
                open={
                    modalOpen
                }

                selectedDate={
                    selectedDate
                }

                event={
                    selectedEvent
                }

                onClose={
                    closeModal
                }

                onSaved={
                    loadEvents
                }
            />
        </>
    )
}