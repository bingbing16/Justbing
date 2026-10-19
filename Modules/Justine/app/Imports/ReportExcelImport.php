<?php

namespace Modules\Justine\Imports;

use Maatwebsite\Excel\Concerns\ToArray;

class ReportExcelImport implements ToArray
{
    public array $rows = [];

    public function array(array $array): void
    {
        $this->rows = $array;
    }
}