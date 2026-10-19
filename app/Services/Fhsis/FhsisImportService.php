<?php

namespace App\Services\Fhsis;

use App\Models\FhsisImportMapping;
use App\Models\FhsisReport;
use App\Models\Lgu;
use App\Models\Quarter;
use App\Models\ReportType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class FhsisImportService
{
    public function preview(UploadedFile $file, int $year, int $quarterId, ReportType $reportType): array
    {
        $sheets = Excel::toArray(
            new class implements \Maatwebsite\Excel\Concerns\ToArray {
                public function array(array $array): void
                {
                    // Required by the ToArray concern.
                }
            },
            $file
        );

        /*
         * Find the FHSIS Data sheet based on its headers.
         */
        $sheet = collect($sheets)->first(
            fn ($rows) => $this->isFhsisSheet($rows)
        );

        if (!$sheet) {
            throw new \RuntimeException(
                'The workbook does not contain a recognizable FHSIS Data sheet. ' .
                'Expected the FHSIS Data (Q1) format.'
            );
        }

        /*
         * Get HWPSC report type.
         */
        // $reportType = ReportType::query()
        //     ->where('code', 'HWPSC')
        //     ->where('is_active', true)
        //     ->firstOrFail();

        /*
         * Get quarter.
         */
        $quarter = Quarter::findOrFail($quarterId);

        /*
         * Get active FHSIS mappings.
         */
        $mappings = FhsisImportMapping::with(
            'indicator:id,code,name'
        )
            ->where('report_type_id', $reportType->id)
            ->where('is_active', true)
            ->get();

        /*
         * Load LGUs ONCE instead of querying the database
         * for every FHSIS row.
         */
        $lgus = Lgu::query()
            ->where('is_active', true)
            ->get(['id', 'name']);

        $lguMap = $lgus->keyBy(
            fn ($lgu) => $this->normalize($lgu->name)
        );

        $rows = [];
        $warnings = [];
        $matchedLgus = [];

        /*
         * First row is the header.
         */
        foreach (array_slice($sheet, 1) as $row) {

            $psgc = trim((string) ($row[0] ?? ''));
            $name = trim((string) ($row[1] ?? ''));

            /*
             * Skip blank rows.
             */
            if ($name === '') {
                continue;
            }

            /*
             * Skip national and regional aggregate rows.
             */
            $normalizedName = $this->normalize($name);

            if (
                in_array(
                    $normalizedName,
                    [
                        'philippines',
                        'ncr',
                    ],
                    true
                )
            ) {
                continue;
            }

            /*
             * Match FHSIS LGU against the LGUs in the system.
             */
            $lgu = $lguMap->get($normalizedName);

            if (!$lgu) {
                $warnings[] =
                    "LGU '{$name}' from FHSIS was not found in the system.";

                continue;
            }

            $values = [];

            /*
             * Process every active FHSIS mapping.
             */
            foreach ($mappings as $mapping) {

                /*
                 * male_column and female_column are 1-based
                 * Excel column numbers.
                 *
                 * PHP array indexes are 0-based.
                 */
                $maleColumn = $mapping->male_column;
                $femaleColumn = $mapping->female_column;

                $male = $this->number(
                    $maleColumn
                        ? ($row[$maleColumn - 1] ?? null)
                        : null
                );

                $female = $this->number(
                    $femaleColumn
                        ? ($row[$femaleColumn - 1] ?? null)
                        : null
                );

                /*
                 * We intentionally calculate total from
                 * Male + Female instead of importing the
                 * FHSIS percentage/total columns.
                 */
                $values[] = [
                    'indicator_id' => $mapping->indicator_id,
                    'indicator_code' => $mapping->indicator->code,
                    'indicator_name' => $mapping->indicator->name,
                    'male' => $male,
                    'female' => $female,
                    'total' => $male + $female,
                ];
            }

            $matchedLgus[$lgu->id] = $lgu->name;

            $rows[] = [
                'lgu_id' => $lgu->id,
                'lgu_name' => $lgu->name,
                'psgc_code' => $psgc,
                'values' => $values,
            ];
        }

        return [
            'report_type_id' => $reportType->id,
            'report_type_code' => $reportType->code,
            'report_type_name' => $reportType->name,

            'year' => $year,

            'quarter' => [
                'id' => $quarter->id,
                'code' => $quarter->code,
                'name' => $quarter->name,
            ],

            'file_name' => $file->getClientOriginalName(),
            'file_extension' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),

            'lgu_count' => count($matchedLgus),
            'indicator_count' => $mappings->count(),

            'rows' => $rows,

            'warnings' => array_values(
                array_unique($warnings)
            ),
        ];
    }

    public function import(array $preview, int $userId): FhsisReport 
    {
        return DB::transaction(function () use (
            $preview,
            $userId
        ) {

            /*
             * Check whether an FHSIS snapshot already exists
             * for this report type/year/quarter.
             */
            $existing = FhsisReport::query()
                ->where(
                    'report_type_id',
                    $preview['report_type_id']
                )
                ->where(
                    'year',
                    $preview['year']
                )
                ->where(
                    'quarter_id',
                    $preview['quarter']['id']
                )
                ->first();

            if ($existing) {

                /*
                 * Replace the existing snapshot.
                 */
                $existing->values()->delete();

                $report = $existing;

                $report->update([
                    'file_name' => $preview['file_name'],
                    'file_extension' => $preview['file_extension'],
                    'file_size' => $preview['file_size'],
                    'imported_by' => $userId,
                    'imported_at' => now(),
                ]);

            } else {

                /*
                 * Create a new FHSIS snapshot.
                 */
                $report = FhsisReport::create([
                    'report_type_id' => $preview['report_type_id'],
                    'quarter_id' => $preview['quarter']['id'],
                    'year' => $preview['year'],
                    'file_name' => $preview['file_name'],
                    'file_extension' => $preview['file_extension'],
                    'file_size' => $preview['file_size'],
                    'imported_by' => $userId,
                    'imported_at' => now(),
                ]);
            }

            /*
             * Save all FHSIS values.
             */
            foreach ($preview['rows'] as $lguRow) {

                foreach ($lguRow['values'] as $value) {

                    $report->values()->create([
                        'lgu_id' => $lguRow['lgu_id'],
                        'indicator_id' => $value['indicator_id'],
                        'psgc_code' => $lguRow['psgc_code'],
                        'male' => $value['male'],
                        'female' => $value['female'],
                        'total' => $value['total'],
                    ]);
                }
            }

            return $report->load([
                'quarter',
                'reportType',
                'importer',
            ]);
        });
    }

    /**
     * Determine whether the sheet is the FHSIS Data sheet.
     */
    private function isFhsisSheet(array $rows): bool
    {
        if (empty($rows[0])) {
            return false;
        }

        /*
         * Read the first three headers.
         */
        $headers = array_map(
            fn ($value) => $this->normalize($value),
            array_slice($rows[0], 0, 3)
        );

        /*
         * Actual FHSIS Data (Q1) headers begin with:
         *
         * PSGC 10
         * Region, Province/City, Municipality
         * Projected Population of Senior Citizens (SC) (a)
         *
         * normalize() removes punctuation and spaces,
         * so we compare against normalized strings.
         */
        return str_contains(
            $headers[0] ?? '',
            'psgc10'
        )
            && str_contains(
                $headers[1] ?? '',
                'regionprovincecitymunicipality'
            )
            && str_contains(
                $headers[2] ?? '',
                'projectedpopulationofseniorcitizens'
            );
    }

    /**
     * Normalize Excel headers and LGU names.
     *
     * This removes:
     * - spaces
     * - line breaks
     * - tabs
     * - commas
     * - slashes
     * - parentheses
     * - punctuation
     *
     * Example:
     *
     * "Region, Province/City, Municipality"
     *
     * becomes:
     *
     * "regionprovincecitymunicipality"
     */
    private function normalize(mixed $value): string
    {
        $value = (string) $value;

        /*
         * Replace non-breaking spaces.
         */
        $value = str_replace(
            "\u{00A0}",
            ' ',
            $value
        );

        /*
         * Convert line breaks/tabs/multiple spaces.
         */
        $value = preg_replace(
            '/\s+/u',
            ' ',
            $value
        );

        /*
         * Remove all non-alphanumeric characters.
         */
        $value = preg_replace(
            '/[^a-zA-Z0-9]/',
            '',
            $value
        );

        return strtolower($value);
    }

    /**
     * Convert an Excel cell into a numeric value.
     */
    private function number(mixed $value): float
    {
        if (
            $value === null ||
            $value === ''
        ) {
            return 0;
        }

        if (is_numeric($value)) {
            return (float) $value;
        }

        /*
         * Remove comma thousands separators.
         *
         * Example:
         * "1,234" -> 1234
         */
        $value = str_replace(
            ',',
            '',
            (string) $value
        );

        return is_numeric($value)
            ? (float) $value
            : 0;
    }

    public function previewReplacement(UploadedFile $file, int $year, int $quarterId, ReportType $reportType): array
    {
        $preview = $this->preview(
            $file,
            $year,
            $quarterId,
            $reportType
        );

        $existing = FhsisReport::query()
            ->where('report_type_id', $reportType->id)
            ->where('year', $year)
            ->where('quarter_id', $quarterId)
            ->where('is_current', true)
            ->with('values')
            ->first();

        if (!$existing) {
            return [
                ...$preview,

                'existing_report' => null,

                'replacement' => [
                    'has_existing' => false,
                    'is_identical' => false,
                    'changed_count' => 0,
                    'unchanged_count' => 0,
                    'changes' => [],
                ],
            ];
        }

        $comparison = $this->comparePreviewWithExisting(
            $preview,
            $existing
        );

        return [
            ...$preview,

            'existing_report' => [
                'id' => $existing->id,
                'version' => $existing->version,
                'imported_at' => $existing->imported_at,
                'file_name' => $existing->file_name,
            ],

            'replacement' => $comparison,
        ];
    }

    private function comparePreviewWithExisting(array $preview, FhsisReport $existing): array 
    {
        $existingValues = $existing->values
            ->keyBy(function ($value) {
                return $value->lgu_id . ':' . $value->indicator_id;
            });

        $changes = [];

        $unchangedCount = 0;

        foreach ($preview['rows'] as $row) {

            $lguId = $row['lgu_id'];

            foreach ($row['values'] as $value) {

                $indicatorId = $value['indicator_id'];

                $key = $lguId . ':' . $indicatorId;

                $old = $existingValues->get($key);

                /*
                * Existing LGU/indicator doesn't exist
                */
                if (!$old) {

                    $changes[] = [
                        'type' => 'new',
                        'lgu_id' => $lguId,
                        'lgu_name' => $row['lgu_name'],

                        'indicator_id' => $indicatorId,
                        'indicator_name' =>
                            $value['indicator_name'],

                        'old' => null,

                        'new' => [
                            'male' => $value['male'],
                            'female' => $value['female'],
                            'total' => $value['total'],
                        ],

                        'difference' => [
                            'male' => $value['male'],
                            'female' => $value['female'],
                            'total' => $value['total'],
                        ],
                    ];

                    continue;
                }

                $oldMale = (float) $old->male;
                $oldFemale = (float) $old->female;
                $oldTotal = (float) $old->total;

                $newMale = (float) $value['male'];
                $newFemale = (float) $value['female'];
                $newTotal = (float) $value['total'];

                $maleDiff = $newMale - $oldMale;
                $femaleDiff = $newFemale - $oldFemale;
                $totalDiff = $newTotal - $oldTotal;

                if (
                    $maleDiff == 0 &&
                    $femaleDiff == 0 &&
                    $totalDiff == 0
                ) {
                    $unchangedCount++;

                    continue;
                }

                $changes[] = [
                    'type' => 'updated',

                    'lgu_id' => $lguId,
                    'lgu_name' => $row['lgu_name'],

                    'indicator_id' => $indicatorId,
                    'indicator_name' =>
                        $value['indicator_name'],

                    'old' => [
                        'male' => $oldMale,
                        'female' => $oldFemale,
                        'total' => $oldTotal,
                    ],

                    'new' => [
                        'male' => $newMale,
                        'female' => $newFemale,
                        'total' => $newTotal,
                    ],

                    'difference' => [
                        'male' => $maleDiff,
                        'female' => $femaleDiff,
                        'total' => $totalDiff,
                    ],
                ];
            }
        }

        return [
            'has_existing' => true,

            'is_identical' =>
                count($changes) === 0,

            'changed_count' => count($changes),

            'unchanged_count' => $unchangedCount,

            'changes' => $changes,
        ];
    }

    public function replace(UploadedFile $file, int $year, int $quarterId, int $userId, ReportType $reportType): FhsisReport 
    {
        return DB::transaction(function () use (
            $file,
            $year,
            $quarterId,
            $userId,
            $reportType
        ) {

            $existing = FhsisReport::query()
                ->where('report_type_id', $reportType->id)
                ->where('year', $year)
                ->where('quarter_id', $quarterId)
                ->where('is_current', true)
                ->lockForUpdate()
                ->first();

            $preview = $this->preview(
                $file,
                $year,
                $quarterId,
                $reportType
            );

            $nextVersion = FhsisReport::query()
                ->where('report_type_id', $reportType->id)
                ->where('year', $year)
                ->where('quarter_id', $quarterId)
                ->max('version') + 1;

            if ($existing) {
                $existing->update([
                    'is_current' => false,
                    'superseded_at' => now(),
                ]);
            }

            $report = FhsisReport::create([
                'report_type_id' => $reportType->id,
                'quarter_id' => $quarterId,
                'year' => $year,

                'version' => $nextVersion,

                'is_current' => true,

                'file_name' => $file->getClientOriginalName(),

                'file_extension' =>
                    $file->getClientOriginalExtension(),

                'file_size' => $file->getSize(),

                'imported_by' => $userId,

                'imported_at' => now(),
            ]);

            foreach ($preview['rows'] as $row) {
                foreach ($row['values'] as $value) {
                    $report->values()->create([
                        'lgu_id' => $row['lgu_id'],

                        'indicator_id' =>
                            $value['indicator_id'],

                        'psgc_code' =>
                            $row['psgc_code'] ?? null,

                        'male' => $value['male'],

                        'female' => $value['female'],

                        'total' => $value['total'],
                    ]);
                }
            }

            return $report;
        });
    }
}