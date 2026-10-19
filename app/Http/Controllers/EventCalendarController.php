<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventCalendarController extends Controller
{
    /**
     * Calendar page.
     */
    public function index(): Response
    {
        return Inertia::render('Calendar/Index');
    }

    /**
     * Return authenticated user's events.
     */
    public function events(Request $request)
    {
        $events = Event::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('start_date')
            ->orderBy('start_time')
            ->get();

        return response()->json($events);
    }

    /**
     * Create event.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => [
                'required',
                'string',
                'max:50',
            ],

            'subject' => [
                'required',
                'string',
                'max:255',
            ],

            'rpo_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            'start_date' => [
                'required',
                'date',
            ],

            'start_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'end_date' => [
                'nullable',
                'date',
            ],

            'end_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'all_day' => [
                'boolean',
            ],

            'location' => [
                'nullable',
                'string',
                'max:255',
            ],

            'priority' => [
                'required',
                'in:low,normal,high,urgent',
            ],

            'reminder_minutes' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'notes' => [
                'nullable',
                'string',
            ],

            'color' => [
                'nullable',
                'string',
                'max:30',
            ],
        ]);

        $validated['user_id'] = $request->user()->id;

        $validated['reminder_at'] = $this->calculateReminder(
            $validated
        );

        $event = Event::create($validated);

        return response()->json([
            'message' => 'Event created successfully.',
            'event' => $event->fresh(),
        ], 201);
    }

    /**
     * Update event.
     */
    public function update(
        Request $request,
        Event $event
    ) {
        $this->authorizeEvent($request, $event);

        $validated = $request->validate([
            'type' => [
                'required',
                'string',
                'max:50',
            ],

            'subject' => [
                'required',
                'string',
                'max:255',
            ],

            'rpo_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            'start_date' => [
                'required',
                'date',
            ],

            'start_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'end_date' => [
                'nullable',
                'date',
            ],

            'end_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'all_day' => [
                'boolean',
            ],

            'location' => [
                'nullable',
                'string',
                'max:255',
            ],

            'priority' => [
                'required',
                'in:low,normal,high,urgent',
            ],

            'reminder_minutes' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'notes' => [
                'nullable',
                'string',
            ],

            'color' => [
                'nullable',
                'string',
                'max:30',
            ],
        ]);

        $validated['reminder_at'] = $this->calculateReminder(
            $validated
        );

        $event->update($validated);

        return response()->json([
            'message' => 'Event updated successfully.',
            'event' => $event->fresh(),
        ]);
    }

    /**
     * Delete event.
     */
    public function destroy(
        Request $request,
        Event $event
    ) {
        $this->authorizeEvent($request, $event);

        $event->delete();

        return response()->json([
            'message' => 'Event deleted successfully.',
        ]);
    }

    /**
     * Update event dates after drag/drop.
     */
    public function move(
        Request $request,
        Event $event
    ) {
        $this->authorizeEvent($request, $event);

        $validated = $request->validate([
            'start_date' => [
                'required',
                'date',
            ],

            'start_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'end_date' => [
                'nullable',
                'date',
            ],

            'end_time' => [
                'nullable',
                'date_format:H:i',
            ],
        ]);

        $event->update([
            ...$validated,
            'reminder_at' => $this->calculateReminder([
                ...$event->toArray(),
                ...$validated,
            ]),
        ]);

        return response()->json([
            'message' => 'Event moved successfully.',
            'event' => $event->fresh(),
        ]);
    }

    /**
     * Ensure the event belongs to the logged-in user.
     */
    private function authorizeEvent(
        Request $request,
        Event $event
    ): void {
        abort_unless(
            $event->user_id === $request->user()->id,
            403
        );
    }

    /**
     * Calculate reminder timestamp.
     */
    private function calculateReminder(array $data): ?\Carbon\Carbon
    {
        if (
            empty($data['reminder_minutes']) ||
            empty($data['start_date'])
        ) {
            return null;
        }

        $time = $data['start_time'] ?? '09:00';

        return \Carbon\Carbon::parse(
            $data['start_date'] . ' ' . $time
        )->subMinutes(
            (int) $data['reminder_minutes']
        );
    }
}