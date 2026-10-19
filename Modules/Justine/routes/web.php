<?php

use Illuminate\Support\Facades\Route;
use Modules\Justine\Http\Controllers\JustineController;
use Modules\Justine\Http\Controllers\HWPSCController;
use App\Http\Controllers\FhsisComparisonController;
use App\Http\Controllers\FhsisImportMappingController;
use App\Http\Controllers\FhsisReportController;
use App\Http\Controllers\LguReportEmailController;
use App\Http\Controllers\HWPSCDashboardController;
use App\Http\Controllers\ReportFormulaController;
use App\Models\Lgu;
use Modules\Justine\Http\Controllers\ReportTypeController;
use App\Http\Controllers\DashboardConfigurationController;
use App\Http\Controllers\CalendarReminderController;


Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('justines', JustineController::class)->names('justine');

        Route::prefix('justine')->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Report Types
        |--------------------------------------------------------------------------
        */

        Route::resource('report-types', ReportTypeController::class)
            ->only(['index', 'store', 'update'])
            ->names('justine.report-types');

        Route::patch(
            '/report-types/{reportType}/toggle',
            [ReportTypeController::class, 'toggle']
        )->name('justine.report-types.toggle');


        /*
        |--------------------------------------------------------------------------
        | HWPSC - Explicit Routes
        |--------------------------------------------------------------------------
        |
        | These MUST come before the generic {reportType} routes.
        |
        */

        Route::get(
            '/reports/hwpsc',
            [HWPSCController::class, 'index']
        )->name('justine.reports.hwpsc.index');

        Route::get(
            '/reports/hwpsc/create',
            [HWPSCController::class, 'create']
        )->name('justine.reports.hwpsc.create');

        Route::post(
            '/reports/hwpsc',
            [HWPSCController::class, 'store']
        )->name('justine.reports.hwpsc.store');

        // Route::get(
        //     '/reports/hwpsc/annual',
        //     [HWPSCController::class, 'annual']
        // )->name('justine.reports.hwpsc.annual');

        // Route::get(
        //     '/reports/hwpsc/import',
        //     [HWPSCController::class, 'import']
        // )->name('justine.reports.hwpsc.import');

        /*
        |--------------------------------------------------------------------------
        | HWPSC Import
        |--------------------------------------------------------------------------
        */

        // Route::post(
        //     '/reports/hwpsc/import',
        //     [HWPSCController::class, 'importPreview']
        // )->name('justine.reports.hwpsc.import.preview');

        Route::post(
            '/reports/hwpsc/import/confirm',
            [HWPSCController::class, 'importConfirm']
        )->name('justine.reports.hwpsc.import.confirm');

        Route::get(
            '/reports/hwpsc/import-history',
            [HWPSCController::class, 'importHistory']
        )->name('justine.reports.hwpsc.import.history');

        Route::get(
            '/reports/hwpsc/import-history/{reportImport}',
            [HWPSCController::class, 'importHistoryShow']
        )->name('justine.reports.hwpsc.import.history.show');


        /*
        |--------------------------------------------------------------------------
        | HWPSC Submission
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/reports/hwpsc/{submission}/edit',
            [HWPSCController::class, 'edit']
        )->name('justine.reports.hwpsc.edit');

        Route::put(
            '/reports/hwpsc/{submission}',
            [HWPSCController::class, 'update']
        )->name('justine.reports.hwpsc.update');

        // Route::get(
        //     '/reports/hwpsc/{submission}/preview',
        //     [HWPSCController::class, 'preview']
        // )->name('justine.reports.hwpsc.preview');

        Route::get(
            '/reports/{reportType}/{submission}/preview',
            [HWPSCController::class, 'preview']
        )->name('justine.reports.preview');

        Route::post(
            '/reports/hwpsc/{submission}/submit',
            [HWPSCController::class, 'submit']
        )->name('justine.reports.hwpsc.submit');

        Route::post(
            '/reports/hwpsc/{submission}/approve',
            [HWPSCController::class, 'approve']
        )->name('justine.reports.hwpsc.approve');

        Route::post(
            '/reports/hwpsc/{submission}/reject',
            [HWPSCController::class, 'reject']
        )->name('justine.reports.hwpsc.reject');


        /*
        |--------------------------------------------------------------------------
        | HWPSC FHSIS Validation
        |--------------------------------------------------------------------------
        */

        // Route::post(
        //     '/reports/hwpsc/{submission}/validate-fhsis',
        //     [HWPSCController::class, 'validateAgainstFhsis']
        // )->name('justine.reports.hwpsc.validate-fhsis');

        Route::post(
            '/reports/{reportType}/{submission}/validate-fhsis',
            [HWPSCController::class, 'validateAgainstFhsis']
        )->name('justine.reports.validate-fhsis');


        /*
        |--------------------------------------------------------------------------
        | HWPSC Bulk Actions
        |--------------------------------------------------------------------------
        */

        // Route::post(
        //     '/reports/hwpsc/bulk-submit',
        //     [HWPSCController::class, 'bulkSubmit']
        // )->name('justine.reports.hwpsc.bulk-submit');

        // Route::post(
        //     '/reports/hwpsc/bulk-validate-fhsis',
        //     [HWPSCController::class, 'bulkValidateAgainstFhsis']
        // )->name('justine.reports.hwpsc.bulk-validate-fhsis');

        // Route::post(
        //     '/reports/hwpsc/bulk-approve',
        //     [HWPSCController::class, 'bulkApprove']
        // )->name('justine.reports.hwpsc.bulk-approve');

        // Route::post(
        //     '/reports/hwpsc/bulk-reject',
        //     [HWPSCController::class, 'bulkReject']
        // )->name('justine.reports.hwpsc.bulk-reject');


        /*
        |--------------------------------------------------------------------------
        | HWPSC LGU Profile
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/reports/hwpsc/lgu/{lgu}',
            [HWPSCDashboardController::class, 'lguProfile']
        )->name('justine.reports.hwpsc.lgu-profile');

        // Generic LGU Profile — must come after the explicit HWPSC route.
        Route::get(
            '/reports/{reportType}/lgu/{lgu}',
            [HWPSCDashboardController::class, 'genericLguProfile']
        )->name('justine.reports.lgu-profile');


        /*
        |--------------------------------------------------------------------------
        | HWPSC Dashboard
        |--------------------------------------------------------------------------
        */

        // Route::get(
        //     '/reports/hwpsc/dashboard',
        //     [HWPSCDashboardController::class, 'index']
        // )->name('justine.reports.hwpsc.dashboard');

        // Route::get(
        //     '/reports/hwpsc/dashboard/export',
        //     [HWPSCDashboardController::class, 'export']
        // )->name('justine.reports.hwpsc.dashboard.export');

        Route::get(
            '/reports/{reportType}/dashboard',
            [HWPSCDashboardController::class, 'index']
        )->name('justine.reports.dashboard');

        Route::get(
            '/reports/{reportType}/dashboard/export',
            [HWPSCDashboardController::class, 'export']
        )->name('justine.reports.dashboard.export');


        Route::get(
            '/dashboard-configuration',
            function () {
                $reportType = \App\Models\ReportType::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->firstOrFail();

                return redirect()->route(
                    'justine.dashboard-configuration.index',
                    [
                        'reportType' => $reportType->slug,
                    ]
                );
            }
        )->name('justine.dashboard-configuration');


        Route::get(
            '/dashboard-configuration/{reportType}',
            [DashboardConfigurationController::class, 'index']
        )->name('justine.dashboard-configuration.index');




        /*
        |--------------------------------------------------------------------------
        | Dashboard Configuration - Sections
        |--------------------------------------------------------------------------
        */

        Route::post(
            '/dashboard-configuration/{reportType}/sections',
            [DashboardConfigurationController::class, 'storeSection']
        )->name('justine.dashboard-configuration.sections.store');

        Route::put(
            '/dashboard-configuration/{reportType}/sections/{section}',
            [DashboardConfigurationController::class, 'updateSection']
        )->name('justine.dashboard-configuration.sections.update');

        Route::delete(
            '/dashboard-configuration/{reportType}/sections/{section}',
            [DashboardConfigurationController::class, 'destroySection']
        )->name('justine.dashboard-configuration.sections.destroy');


        /*
        |--------------------------------------------------------------------------
        | Dashboard Configuration - Widgets
        |--------------------------------------------------------------------------
        */

        Route::post(
            '/dashboard-configuration/{reportType}/widgets',
            [DashboardConfigurationController::class, 'storeWidget']
        )->name('justine.dashboard-configuration.widgets.store');

        Route::put(
            '/dashboard-configuration/{reportType}/widgets/{widget}',
            [DashboardConfigurationController::class, 'updateWidget']
        )->name('justine.dashboard-configuration.widgets.update');

        Route::delete(
            '/dashboard-configuration/{reportType}/widgets/{widget}',
            [DashboardConfigurationController::class, 'destroyWidget']
        )->name('justine.dashboard-configuration.widgets.destroy');


        /*
        |--------------------------------------------------------------------------
        | HWPSC Email
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/reports/hwpsc/email-recipients',
            [HWPSCController::class, 'emailRecipients']
        )->name('justine.reports.hwpsc.email-recipients');

        Route::post(
            '/reports/hwpsc/email',
            [HWPSCController::class, 'sendEmail']
        )->name('justine.reports.hwpsc.email');


        /*
        |--------------------------------------------------------------------------
        | Generic Report Routes
        |--------------------------------------------------------------------------
        |
        | These are placed AFTER the explicit HWPSC routes.
        |
        */

        /*
        |--------------------------------------------------------------------------
        | FHSIS
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/fhsis',
            [FhsisReportController::class, 'index']
        )->name('justine.fhsis.index');

        /*
        |--------------------------------------------------------------------------
        | FHSIS Import
        |--------------------------------------------------------------------------
        */

        // Initial import page — user selects Report Type
        Route::get(
            '/fhsis/import',
            [FhsisReportController::class, 'import']
        )->name('justine.fhsis.import');

        // Report-type-specific import
        Route::get(
            '/fhsis/{reportType}/import',
            [FhsisReportController::class, 'import']
        )->name('justine.fhsis.import.type');

        Route::post(
            '/fhsis/{reportType}/import',
            [FhsisReportController::class, 'preview']
        )->name('justine.fhsis.import.preview');

        Route::post(
            '/fhsis/{reportType}/import/confirm',
            [FhsisReportController::class, 'confirm']
        )->name('justine.fhsis.import.confirm');

        Route::post(
            '/fhsis/{reportType}/import/replace',
            [FhsisReportController::class, 'replace']
        )->name('justine.fhsis.import.replace');

        /*
        |--------------------------------------------------------------------------
        | FHSIS Other
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/fhsis/{reportType}/comparison',
            [FhsisComparisonController::class, 'index']
        )->name('justine.fhsis.comparison');

        Route::get(
            '/fhsis/{reportType}/discrepancy-report',
            [FhsisComparisonController::class, 'discrepancyReport']
        )->name('justine.fhsis.discrepancy-report');

        Route::get(
            '/fhsis/{reportType}/discrepancy-report/export',
            [FhsisComparisonController::class, 'exportDiscrepancyReport']
        )->name('justine.fhsis.discrepancy-report.export');

        Route::get(
            '/fhsis/{fhsisReport}',
            [FhsisReportController::class, 'show']
        )->name('justine.fhsis.show');

        /*
        |--------------------------------------------------------------------------
        | BULK
        |--------------------------------------------------------------------------
        */


        Route::post(
            '/reports/{reportType}/bulk-submit',
            [HWPSCController::class, 'bulkSubmit']
        )->name('justine.reports.bulk-submit');

        Route::post(
            '/reports/{reportType}/bulk-validate-fhsis',
            [HWPSCController::class, 'bulkValidateAgainstFhsis']
        )->name('justine.reports.bulk-validate-fhsis');

        Route::post(
            '/reports/{reportType}/bulk-approve',
            [HWPSCController::class, 'bulkApprove']
        )->name('justine.reports.bulk-approve');

        Route::post(
            '/reports/{reportType}/bulk-reject',
            [HWPSCController::class, 'bulkReject']
        )->name('justine.reports.bulk-reject');

        Route::get(
            '/reports/{reportType}/import',
            [HWPSCController::class, 'import']
        )->name('justine.reports.import');

        Route::post(
            '/reports/{reportType}/import',
            [HWPSCController::class, 'importPreview']
        )->name('justine.reports.import.preview');

        Route::post(
            '/reports/{reportType}/import/confirm',
            [HWPSCController::class, 'importConfirm']
        )->name('justine.reports.import.confirm');


        Route::get(
            '/reports/{reportType}/create',
            [HWPSCController::class, 'create']
        )->name('justine.reports.create');

        Route::post(
            '/reports/{reportType}',
            [HWPSCController::class, 'store']
        )->name('justine.reports.store');

        Route::get(
            '/reports/{reportType}/{submission}/edit',
            [HWPSCController::class, 'edit']
        )->name('justine.reports.edit');

        Route::put(
            '/reports/{reportType}/{submission}',
            [HWPSCController::class, 'update']
        )->name('justine.reports.update');

        Route::get(
            '/reports/{reportType}/{submission}/preview',
            [HWPSCController::class, 'preview']
        )->name('justine.reports.preview');

        Route::post(
            '/reports/{reportType}/{submission}/submit',
            [HWPSCController::class, 'submit']
        )->name('justine.reports.submit');

        Route::post(
            '/reports/{reportType}/{submission}/approve',
            [HWPSCController::class, 'approve']
        )->name('justine.reports.approve');

        Route::post(
            '/reports/{reportType}/{submission}/reject',
            [HWPSCController::class, 'reject']
        )->name('justine.reports.reject');

        Route::get(
            '/reports/{reportType}/annual',
            [HWPSCController::class, 'annual']
        )->name('justine.reports.annual');

         Route::get(
            '/reports/{reportType}',
            [HWPSCController::class, 'index']
        )->name('justine.reports.index');

        

        /*
        |--------------------------------------------------------------------------
        | FHSIS
        |--------------------------------------------------------------------------
        */

        // Route::get(
        //     '/fhsis',
        //     [HWPSCController::class, 'fhsis']
        // )->name('justine.fhsis');

          
            // GLOBAL ROUTES

            // Route::get('/reports/{reportType}', [HWPSCController::class, 'index'])->name('justine.reports.index');

            // Route::get('/reports/{reportType}/create', [HWPSCController::class, 'create'])->name('justine.reports.create');

            // Route::post('/reports/{reportType}', [HWPSCController::class, 'store'])->name('justine.reports.store');

            // Route::get('/reports/{reportType}/{submission}/edit', [HWPSCController::class, 'edit'])->name('justine.reports.edit');

            // Route::put('/reports/{reportType}/{submission}',[HWPSCController::class, 'update'])->name('justine.reports.update');

            // Route::get('/reports/{reportType}/{submission}/preview',[HWPSCController::class, 'preview'])->name('justine.reports.preview');

            // Route::post('/reports/{reportType}/{submission}/submit',[HWPSCController::class, 'submit'])->name('justine.reports.submit');

            // Route::post('/reports/{reportType}/{submission}/approve',[HWPSCController::class, 'approve'])->name('justine.reports.approve');

            // Route::post('/reports/{reportType}/{submission}/reject',[HWPSCController::class, 'reject'])->name('justine.reports.reject');

            // Route::get('/reports/{reportType}/annual',[HWPSCController::class, 'annual'])->name('justine.reports.annual');

            // Route::get('/reports/{reportType}/import',[HWPSCController::class, 'import'])->name('justine.reports.import');


            ////////

            // Route::get('/reports/hwpsc', [HWPSCController::class, 'index'])
            //     ->name('justine.reports.hwpsc.index');

            // Route::get('/reports/hwpsc/create', [HWPSCController::class, 'create'])
            //     ->name('justine.reports.hwpsc.create');

            // Route::post('/reports/hwpsc', [HWPSCController::class, 'store'])
            //     ->name('justine.reports.hwpsc.store');

            // Route::get('/reports/hwpsc/annual', [HWPSCController::class, 'annual'])
            //     ->name('justine.reports.hwpsc.annual');

            // Route::get('/reports/hwpsc/import',[HWPSCController::class, 'import'])
            //     ->name('justine.reports.hwpsc.import');

            // Route::post('/reports/hwpsc/import', [HWPSCController::class, 'importPreview'])
            //     ->name('justine.reports.hwpsc.import.preview');

                
            // Route::get('/reports/hwpsc/import',[HWPSCController::class, 'import'])
            //     ->name('justine.reports.hwpsc.import');

            // Route::post('/reports/hwpsc/import',[HWPSCController::class, 'importPreview'])
            //     ->name('justine.reports.hwpsc.import.preview');

            // Route::post('/reports/hwpsc/import/confirm',[HWPSCController::class, 'importConfirm'])
            //     ->name('justine.reports.hwpsc.import.confirm');

            // Route::get('/reports/hwpsc/import-history',[HWPSCController::class, 'importHistory'])
            //     ->name('justine.reports.hwpsc.import.history');

            // Route::get('/reports/hwpsc/import-history/{reportImport}', [HWPSCController::class, 'importHistoryShow'])
            //     ->name('justine.reports.hwpsc.import.history.show');

            // Route::get('/reports/hwpsc/lgu/{lgu}', [HWPSCDashboardController::class, 'lguProfile'])
            //     ->name('justine.reports.hwpsc.lgu-profile');

            // Route::get('/reports/hwpsc/{submission}/edit', [HWPSCController::class, 'edit'])
            //     ->name('justine.reports.hwpsc.edit');

            // Route::put('/reports/hwpsc/{submission}', [HWPSCController::class, 'update'])
            //     ->name('justine.reports.hwpsc.update');

            // Route::get('/reports/hwpsc/{submission}/preview', [HWPSCController::class, 'preview'])
            //     ->name('justine.reports.hwpsc.preview');

            // Route::post('/reports/hwpsc/{submission}/submit', [HWPSCController::class, 'submit'])
            //     ->name('justine.reports.hwpsc.submit');

            // Route::post('/reports/hwpsc/{submission}/approve', [HWPSCController::class, 'approve'])
            //     ->name('justine.reports.hwpsc.approve');

            // Route::post('/reports/hwpsc/{submission}/reject', [HWPSCController::class, 'reject'])
            //     ->name('justine.reports.hwpsc.reject');

            // Route::get('/fhsis', [FhsisReportController::class, 'index'])->name('justine.fhsis.index');
            // Route::get('/fhsis/import', [FhsisReportController::class, 'import'])->name('justine.fhsis.import');
            // Route::post('/fhsis/import', [FhsisReportController::class, 'preview'])->name('justine.fhsis.import.preview');
            // Route::post('/fhsis/import/confirm', [FhsisReportController::class, 'confirm'])->name('justine.fhsis.import.confirm');
            //Route::get('/fhsis/comparison', [FhsisComparisonController::class, 'index'])->name('justine.fhsis.comparison');

            // Route::get('/fhsis/discrepancy-report', [FhsisComparisonController::class, 'discrepancyReport'])
            //     ->name('justine.fhsis.discrepancy-report');

            // Route::get('/fhsis/discrepancy-report/export', [FhsisComparisonController::class, 'exportDiscrepancyReport'])
            //     ->name('justine.fhsis.discrepancy-report.export');
                
            // Route::get('/fhsis/{fhsisReport}', [FhsisReportController::class, 'show'])->name('justine.fhsis.show');

            // Route::post('/fhsis/import/replace',[FhsisReportController::class, 'replace'])
            //     ->name('justine.fhsis.import.replace');

            Route::resource('fhsis-import-mappings', FhsisImportMappingController::class)
                ->except(['show','destroy'])
                ->names('justine.fhsis-mappings');
            Route::patch('/fhsis-import-mappings/{fhsisImportMapping}/status', [FhsisImportMappingController::class, 'updateStatus'])
                ->name('justine.fhsis-mappings.status');

            // Route::post('/reports/hwpsc/{submission}/validate-fhsis',[HWPSCController::class, 'validateAgainstFhsis'])
            //     ->name('justine.reports.hwpsc.validate-fhsis');

            // Route::post('/reports/hwpsc/bulk-submit', [HWPSCController::class, 'bulkSubmit'])
            //     ->name('justine.reports.hwpsc.bulk-submit');

            // Route::post('/reports/hwpsc/bulk-validate-fhsis', [HWPSCController::class, 'bulkValidateAgainstFhsis'])
            //     ->name('justine.reports.hwpsc.bulk-validate-fhsis');

            // Route::post('/reports/hwpsc/bulk-approve',[HWPSCController::class, 'bulkApprove'])
            //     ->name('justine.reports.hwpsc.bulk-approve');

            // Route::post('/reports/hwpsc/bulk-reject',[HWPSCController::class, 'bulkReject'])
            //     ->name('justine.reports.hwpsc.bulk-reject');

            Route::resource('lgu-report-emails', LguReportEmailController::class)
                ->except(['show', 'create', 'edit']);

            Route::get('/reports/hwpsc/email-recipients', [HWPSCController::class, 'emailRecipients'])
                ->name('justine.reports.hwpsc.email-recipients');

            Route::post('/reports/hwpsc/email', [HWPSCController::class, 'sendEmail'])
                ->name('justine.reports.hwpsc.email');

            // Route::get('/reports/hwpsc/dashboard', [HWPSCDashboardController::class, 'index'])
            //     ->name('justine.reports.hwpsc.dashboard');

            // Route::get('/reports/hwpsc/dashboard/export', [HWPSCDashboardController::class, 'export'])
            //     ->name('justine.reports.hwpsc.dashboard.export');


                

            // Route::get('/report-formulas', [\App\Http\Controllers\ReportFormulaController::class,'index'])
            //     ->name('justine.report-formulas.index');

            // Route::post('/report-formulas', [\App\Http\Controllers\ReportFormulaController::class,'upsert'])
            //     ->name('justine.report-formulas.upsert');

            // Route::delete('/report-formulas/{formula}', [\App\Http\Controllers\ReportFormulaController::class,'destroy'])
            //     ->name('justine.report-formulas.destroy');
                

            Route::get('/report-formulas', [ReportFormulaController::class, 'index'])
                ->name('justine.report-formulas.index');

            Route::post('/fhsis/formulas', [ReportFormulaController::class, 'upsert'])
                ->name('justine.fhsis.formulas.upsert');

            Route::delete('/fhsis/formulas/{formula}', [ReportFormulaController::class, 'destroy'])
                ->name('justine.fhsis.formulas.destroy');

            Route::get('/calendar/reminders/today',[CalendarReminderController::class, 'todayMeetings'])
                ->name('justine.reports.hwpsc.MeetingReminderModal');
        });
});


