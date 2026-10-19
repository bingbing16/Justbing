<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReportSubmissionController;
use App\Models\Lgu;
use App\Models\ReportType;
use App\Models\ReportingPeriod;
use App\Models\SubmissionStatus;

use App\Http\Controllers\LguController;
use App\Http\Controllers\ReportTypeController;
use App\Http\Controllers\ReportSectionController;
use App\Http\Controllers\IndicatorController;
use App\Http\Controllers\QuarterController;
use App\Http\Controllers\ReportingPeriodController;
use App\Http\Controllers\ReportImportController;
use App\Http\Controllers\ReportImportMappingController;
use App\Http\Controllers\FhsisReportController;
use App\Http\Controllers\EventCalendarController;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::resource('lgus', LguController::class)
    ->except(['show']);

    Route::patch('/lgus/{lgu}/status', [LguController::class, 'updateStatus'])
        ->name('lgus.status');

    Route::resource('report-types', ReportTypeController::class)
    ->except(['show', 'destroy']);

    Route::patch(
        '/report-types/{reportType}/status',
        [ReportTypeController::class, 'updateStatus']
    )->name('report-types.status');

    Route::resource('report-sections', ReportSectionController::class)
        ->except(['show', 'destroy']);

    Route::patch(
        '/report-sections/{reportSection}/status',
        [ReportSectionController::class, 'updateStatus']
    )->name('report-sections.status');

    Route::resource('indicators', IndicatorController::class)
        ->except(['show', 'destroy']);

    Route::patch(
        '/indicators/{indicator}/status',
        [IndicatorController::class, 'updateStatus']
    )->name('indicators.status');

    Route::resource('quarters', QuarterController::class)
    ->except(['show', 'destroy']);

    Route::patch(
        '/quarters/{quarter}/status',
        [QuarterController::class, 'updateStatus']
    )->name('quarters.status');

    Route::resource('reporting-periods', ReportingPeriodController::class)
        ->except(['show', 'destroy']);

    Route::patch('/reporting-periods/{reportingPeriod}/status',[ReportingPeriodController::class, 'updateStatus'])
        ->name('reporting-periods.status');

    Route::resource('report-imports', ReportImportController::class)
        ->only(['index', 'show']);

    Route::resource('report-import-mappings',ReportImportMappingController::class)
        ->except(['show','destroy',]);

    Route::patch('/report-import-mappings/{reportImportMapping}/status',[ReportImportMappingController::class, 'updateStatus'])
        ->name('report-import-mappings.status');

    Route::post('/fhsis/import/replace', [FhsisReportController::class, 'replace'])
        ->name('justine.fhsis.import.replace');

});

Route::middleware(['auth', 'verified'])
    ->prefix('calendar')
    ->name('calendar.')
    ->group(function () {

        Route::get(
            '/',
            [EventCalendarController::class, 'index']
        )->name('index');

        Route::get(
            '/events',
            [EventCalendarController::class, 'events']
        )->name('events');

        Route::post(
            '/events',
            [EventCalendarController::class, 'store']
        )->name('events.store');

        Route::put(
            '/events/{event}',
            [EventCalendarController::class, 'update']
        )->name('events.update');

        Route::patch(
            '/events/{event}/move',
            [EventCalendarController::class, 'move']
        )->name('events.move');

        Route::delete(
            '/events/{event}',
            [EventCalendarController::class, 'destroy']
        )->name('events.destroy');
    });

Route::get('/test-report-submission', function () {
    return view('test-report-submission', [
        'lgus' => Lgu::where('is_active', true)->get(),
        'reportTypes' => ReportType::where('is_active', true)->get(),
        'periods' => ReportingPeriod::with('quarter')
            ->orderBy('year')
            ->orderBy('quarter_id')
            ->get(),
        'statuses' => SubmissionStatus::where('is_active', true)->get(),
    ]);
});

Route::post(
    '/report-submissions',
    [ReportSubmissionController::class, 'store']
)->name('report-submissions.store');

require __DIR__.'/settings.php';
