<?php

namespace App\Services\Imports;

use App\Models\ReportImportMapping;
use App\Models\ReportType;

class ReportMapper
{
    public function map(
        array $rows,
        ReportType $reportType,
        array $quarterColumns
    ): array {
        $metadata = $this->extractMetadata($rows);

        $mappings = ReportImportMapping::query()
            ->where('report_type_id', $reportType->id)
            ->where('is_active', true)
            ->with([
                'indicator:id,report_section_id,code,name',
            ])
            ->orderBy('id')
            ->get();

        $result = [
            'report_type_id' => $reportType->id,
            'report_type_code' => $reportType->code,
            'report_type_name' => $reportType->name,

            'lgu_name' => $metadata['lgu_name'],
            'year' => $metadata['year'],

            'quarters' => [
                'Q1' => [],
                'Q2' => [],
                'Q3' => [],
                'Q4' => [],
            ],

            'warnings' => [],
        ];

        foreach ($mappings as $mapping) {

            $rowIndex = $this->findRow(
                $rows,
                $mapping->source_label
            );

            if ($rowIndex === null) {
                $result['warnings'][] = [
                    'type' => 'missing_indicator',
                    'indicator' => $mapping->indicator->name,
                    'source_label' => $mapping->source_label,
                ];

                continue;
            }

            foreach ($quarterColumns as $quarter => $columns) {

                $male = $this->numericValue(
                    $rows[$rowIndex][$columns['male']] ?? null
                );

                $female = $this->numericValue(
                    $rows[$rowIndex][$columns['female']] ?? null
                );

                /*
                 * Both empty = no data reported for this quarter.
                 */
                if ($male === null && $female === null) {
                    continue;
                }

                /*
                 * Male missing
                 */
                if ($male === null) {
                    $result['warnings'][] = [
                        'type' => 'missing_gender',
                        'quarter' => $quarter,
                        'indicator' => $mapping->indicator->name,
                        'gender' => 'Male',
                    ];

                    $male = 0;
                }

                /*
                 * Female missing
                 */
                if ($female === null) {
                    $result['warnings'][] = [
                        'type' => 'missing_gender',
                        'quarter' => $quarter,
                        'indicator' => $mapping->indicator->name,
                        'gender' => 'Female',
                    ];

                    $female = 0;
                }

                /*
                 * IMPORTANT:
                 * Ignore Excel's Total column.
                 *
                 * Laravel calculates Total from Male + Female.
                 */
                $total = $male + $female;

                $result['quarters'][$quarter][] = [
                    'indicator_id' => $mapping->indicator_id,
                    'indicator_code' => $mapping->indicator->code,
                    'indicator_name' => $mapping->indicator->name,

                    'male' => $male,
                    'female' => $female,
                    'total' => $total,

                    'source_row' => $rowIndex + 1,
                ];
            }
        }

        return $result;
    }

    /**
     * Extract report metadata.
     */
    private function extractMetadata(array $rows): array
    {
        return [
            'year' => $this->extractYear($rows),
            'lgu_name' => $this->extractLguName($rows),
        ];
    }

    /**
     * Extract reporting year from the Excel header.
     */
    private function extractYear(array $rows): ?int
    {
        foreach (array_slice($rows, 0, 10) as $row) {

            foreach ($row as $cell) {

                $value = trim((string) $cell);

                if (
                    preg_match(
                        '/\b(20\d{2})\b/',
                        $value,
                        $matches
                    )
                ) {
                    return (int) $matches[1];
                }
            }
        }

        return null;
    }

    /**
     * Extract LGU name from:
     *
     * LOCAL GOVERNMENT UNIT OF San Juan City
     */
    private function extractLguName(array $rows): ?string
    {
        foreach (array_slice($rows, 0, 10) as $row) {

            foreach ($row as $cell) {

                $value = trim((string) $cell);

                if (
                    preg_match(
                        '/LOCAL GOVERNMENT UNIT OF\s+(.+)/i',
                        $value,
                        $matches
                    )
                ) {
                    return trim($matches[1]);
                }
            }
        }

        return null;
    }

    /**
     * Find an indicator row using the database source_label.
     *
     * Handles:
     *
     * - different capitalization
     * - multiple spaces
     * - line breaks
     * - non-breaking spaces
     * - Excel labels containing additional instructions
     */
    private function findRow(
    array $rows,
    string $sourceLabel,
    ?string $indicatorCode = null
    ): ?int {

        $normalizedSourceLabel =
            $this->normalizeLabel($sourceLabel);

        /*
        * First: exact / contains matching
        */
        foreach ($rows as $index => $row) {

            $label = $this->normalizeLabel(
                $row[0] ?? null
            );

            if ($label === '') {
                continue;
            }

            // Exact match
            if ($label === $normalizedSourceLabel) {
                return $index;
            }

            // Excel label contains the system indicator name
            if (str_starts_with($label, $normalizedSourceLabel)) {
                return $index;
            }

            if (str_contains($label, $normalizedSourceLabel)) {
                return $index;
            }
        }

        /*
        * Special HWPSC template aliases
        */
        // $aliases = $this->getAliases($indicatorCode);

        // foreach ($aliases as $alias) {

        //     $normalizedAlias =
        //         $this->normalizeLabel($alias);

        //     foreach ($rows as $index => $row) {

        //         $label = $this->normalizeLabel(
        //             $row[0] ?? null
        //         );

        //         if ($label === '') {
        //             continue;
        //         }

        //         if ($label === $normalizedAlias) {
        //             return $index;
        //         }

        //         if (str_starts_with($label, $normalizedAlias)) {
        //             return $index;
        //         }

        //         if (str_contains($label, $normalizedAlias)) {
        //             return $index;
        //         }
        //     }
        // }

        return null;
    }


    // private function getAliases(?string $indicatorCode): array
    // {
    //     return match ($indicatorCode) {

    //         'GERIATRIC_SCREENING_TARGET' => [
    //             'Target or Geriatric Screening',
    //             'Target or Geriatric Screening (based on the Total Eligible Population)',
    //         ],

    //         'SENIOR_CITIZENS_SEEN' => [
    //             'Total No. of Senior Citizens Seen at the health facility',
    //         ],

    //         'OTHER_VACCINE' => [
    //             'Others',
    //             'Others (Specify:_______________)',
    //         ],

    //         default => [],
    //     };
    // }


    /**
     * Normalize Excel text before comparison.
     */
    private function normalizeLabel(?string $value): string
    {
        $value = (string) $value;

        /*
         * Convert non-breaking spaces to normal spaces.
         */
        $value = str_replace(
            "\u{00A0}",
            ' ',
            $value
        );

        /*
         * Convert newlines, tabs and multiple spaces
         * into a single normal space.
         */
        $value = preg_replace(
            '/\s+/u',
            ' ',
            $value
        );

        /*
         * Case-insensitive comparison.
         */
        $value = mb_strtolower($value);

        return trim($value);
    }

    /**
     * Convert Excel numeric values safely.
     */
    private function numericValue(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_string($value)) {
            $value = str_replace(
                ',',
                '',
                trim($value)
            );
        }

        if (!is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }
}