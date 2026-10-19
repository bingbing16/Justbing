<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalendarReminderController extends Controller
{
    public function todayMeetings(Request $request): JsonResponse
    {
        $meetings = Event::query()
            ->where('user_id', $request->user()->id)
            ->where('type', 'meeting')
            ->where('status', 'scheduled')
            ->whereDate('start_date', today())
            ->orderBy('start_time')
            ->get([
                'id',
                'subject',
                'rpo_number',
                'start_date',
                'start_time',
                'end_date',
                'end_time',
                'all_day',
                'location',
                'priority',
                'notes',
                'color',
                'status',
            ]);

        return response()->json($meetings);
    }
}