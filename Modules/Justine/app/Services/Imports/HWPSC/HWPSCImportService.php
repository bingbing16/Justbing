<?php

namespace Modules\Justine\Services\Imports\HWPSC;

use App\Models\Lgu;
use App\Models\ReportSubmission;
use App\Models\ReportType;
use App\Models\ReportingPeriod;
use App\Services\Imports\ReportMapper;
use Illuminate\Http\UploadedFile;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Justine\Imports\ReportExcelImport;
use Illuminate\Validation\ValidationException;


class HWPSCImportService
{
    public function __construct(
        private ReportMapper $mapper
    ) {
    }

    public function preview(
        UploadedFile $file,
        ReportType $reportType
    ): array {
        if (!$reportType->is_active) {
            throw new \RuntimeException(
                "Report type '{$reportType->name}' is inactive."
            );
        }

        /*
         * Load only active sections and indicators.
         */
        $reportType->load([
            'sections' => function ($query) {
                $query
                    ->where('is_active', true)
                    ->orderBy('display_order');
            },

            'sections.indicators' => function ($query) {
                $query
                    ->where('is_active', true)
                    ->orderBy('display_order');
            },
        ]);

        /*
         * Excel reader.
         *
         * For now ReportExcelImport simply reads the workbook into
         * an array. It does not contain HWPSC business logic.
         */
        $sheets = Excel::toArray(
            new ReportExcelImport(),
            $file
        );

        if (empty($sheets)) {
            throw new \RuntimeException(
                'The Excel workbook does not contain any sheets.'
            );
        }

        $rows = $sheets[0];

        /*
         * Excel structure for the current LGU templates.
         *
         * This should eventually also become configurable
         * through ReportImportMapping.
         */
        $quarterColumns = $this->getQuarterColumns();

        $preview = $this->mapper->map(
            rows: $rows,
            reportType: $reportType,
            quarterColumns: $quarterColumns
        );

        $preview['report_type_id'] = $reportType->id;
        $preview['report_type_code'] = $reportType->code;
        $preview['report_type_name'] = $reportType->name;
        $preview['report_type_slug'] = $reportType->slug;

        $preview['warnings'] = $preview['warnings'] ?? [];

        if (!$preview['year']) {
            throw new \RuntimeException(
                'Unable to identify the reporting year from the Excel report header.'
            );
        }

        if (!$preview['lgu_name']) {
            throw new \RuntimeException(
                'Unable to identify the LGU from the Excel report header.'
            );
        }

        $lgu = Lgu::query()
            ->where('name', $preview['lgu_name'])
            ->where('is_active', true)
            ->first();

        if (!$lgu) {
            throw new \RuntimeException(
                "LGU '{$preview['lgu_name']}' was not found in the system."
            );
        }

        $preview['lgu_id'] = $lgu->id;

        $reportingPeriods = ReportingPeriod::query()
            ->where('year', $preview['year'])
            ->where('is_active', true)
            ->with('quarter:id,code,name')
            ->get()
            ->keyBy(
                fn ($period) => $period->quarter->code
            );

        $preview['reporting_periods'] = [];
        $preview['quarter_status'] = [];

        foreach (
            $reportingPeriods->keys()
            as $quarter
        ) {
            $quarterValues =
                $preview['quarters'][$quarter] ?? [];

            if (empty($quarterValues)) {
                $preview['quarter_status'][$quarter] = [
                    'status' => 'no_data',
                    'label' => 'No Data',
                    'submission_id' => null,
                    'submission_status' => null,
                    'submission_status_name' => null,
                    'indicator_count' => 0,
                    'changed_count' => 0,
                    'can_import' => false,
                    'can_update' => false,
                ];

                continue;
            }

            $period = $reportingPeriods->get($quarter);

            if (!$period) {
                throw new \RuntimeException(
                    "Reporting period for {$preview['year']} {$quarter} does not exist."
                );
            }

            $preview['reporting_periods'][$quarter] = [
                'id' => $period->id,
                'year' => $period->year,
                'quarter_id' => $period->quarter_id,
                'quarter_code' => $period->quarter->code,
                'quarter_name' => $period->quarter->name,
                'start_date' => $period->start_date?->format('Y-m-d'),
                'end_date' => $period->end_date?->format('Y-m-d'),
            ];

            $this->buildQuarterStatus(
                $preview,
                $quarter,
                $quarterValues,
                $reportType,
                $lgu,
                $period
            );
        }

        return $preview;
    }

    private function getQuarterColumns(): array
    {
        return [
            'Q1' => [
                'male' => 1,
                'female' => 2,
            ],

            'Q2' => [
                'male' => 4,
                'female' => 5,
            ],

            'Q3' => [
                'male' => 7,
                'female' => 8,
            ],

            'Q4' => [
                'male' => 10,
                'female' => 11,
            ],
        ];
    }

    private function buildQuarterStatus(
        array &$preview,
        string $quarter,
        array $quarterValues,
        ReportType $reportType,
        Lgu $lgu,
        ReportingPeriod $period
    ): void {
        $existingSubmission = ReportSubmission::query()
            ->with([
                'status:id,code,name',
                'values:id,report_submission_id,indicator_id,male,female,total',
                'values.indicator:id,name',
            ])
            ->where('lgu_id', $lgu->id)
            ->where('report_type_id', $reportType->id)
            ->where('reporting_period_id', $period->id)
            ->first();

        if (!$existingSubmission) {
            $preview['quarter_status'][$quarter] = [
                'status' => 'new',
                'label' => 'New',
                'submission_id' => null,
                'submission_status' => null,
                'submission_status_name' => null,
                'indicator_count' => count($quarterValues),
                'changed_count' => 0,
                'can_import' => true,
                'can_update' => false,
            ];

            return;
        }

        $existingValues = $existingSubmission->values
            ->keyBy('indicator_id');

        $changedValues = [];

        foreach ($quarterValues as $value) {
            $indicatorId = $value['indicator_id'];

            $existingValue =
                $existingValues->get($indicatorId);

            if (!$existingValue) {
                $changedValues[] = [
                    'indicator_id' => $indicatorId,
                    'indicator_name' => $value['indicator_name'],

                    'old_male' => null,
                    'old_female' => null,
                    'old_total' => null,

                    'new_male' => $value['male'],
                    'new_female' => $value['female'],
                    'new_total' => $value['total'],

                    'change_type' => 'added',
                ];

                continue;
            }

            $oldMale = (float) $existingValue->male;
            $oldFemale = (float) $existingValue->female;

            $newMale = (float) ($value['male'] ?? 0);
            $newFemale = (float) ($value['female'] ?? 0);

            if (
                $oldMale !== $newMale ||
                $oldFemale !== $newFemale
            ) {
                $changedValues[] = [
                    'indicator_id' => $indicatorId,
                    'indicator_name' => $value['indicator_name'],

                    'old_male' => $oldMale,
                    'old_female' => $oldFemale,
                    'old_total' => $oldMale + $oldFemale,

                    'new_male' => $newMale,
                    'new_female' => $newFemale,
                    'new_total' => $newMale + $newFemale,

                    'change_type' => 'changed',
                ];
            }
        }

        if (empty($changedValues)) {
            $preview['quarter_status'][$quarter] = [
                'status' => 'unchanged',
                'label' => 'Unchanged',
                'submission_id' => $existingSubmission->id,
                'submission_status' =>
                    $existingSubmission->status?->code,
                'submission_status_name' =>
                    $existingSubmission->status?->name,
                'indicator_count' => count($quarterValues),
                'changed_count' => 0,
                'can_import' => false,
                'can_update' => false,
                'changes' => [],
            ];

            return;
        }

        $submissionStatus =
            $existingSubmission->status?->code;

        $canUpdate = in_array(
            $submissionStatus,
            ['draft', 'rejected'],
            true
        );

        $preview['quarter_status'][$quarter] = [
            'status' => 'changed',
            'label' => 'Changed',
            'submission_id' => $existingSubmission->id,
            'submission_status' => $submissionStatus,
            'submission_status_name' =>
                $existingSubmission->status?->name,
            'indicator_count' => count($quarterValues),
            'changed_count' => count($changedValues),
            'can_import' => $canUpdate,
            'can_update' => $canUpdate,
            'changes' => $changedValues,
        ];
    }
}