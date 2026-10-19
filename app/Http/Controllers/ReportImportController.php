<?php

namespace App\Http\Controllers;

use App\Models\ReportImport;
use App\Http\Requests\StoreReportImportRequest;
use App\Http\Requests\UpdateReportImportRequest;
use Inertia\Inertia;
use Inertia\Response;

class ReportImportController extends Controller
{
    public function index(): Response
    {
        $imports = ReportImport::query()
            ->with([
                'user:id,name',
                'lgu:id,name',
                'reportType:id,code,name',
            ])
            ->latest()
            ->get();

        return Inertia::render('ReportImports/index', [
            'imports' => $imports,
        ]);
    }

    public function show(ReportImport $reportImport): Response
    {
        $reportImport->load([
            'user:id,name',
            'lgu:id,name',
            'reportType:id,code,name',
            'quarters',
            'quarters.reportingPeriod.quarter',
            'quarters.changes',
        ]);

        return Inertia::render('ReportImports/show', [
            'import' => $reportImport,
        ]);
    }
}
