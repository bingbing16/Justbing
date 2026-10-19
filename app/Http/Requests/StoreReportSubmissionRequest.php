<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreReportSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lgu_id' => [
                'required',
                'integer',
                'exists:lgus,id',
            ],

            'report_type_id' => [
                'required',
                'integer',
                'exists:report_types,id',
            ],

            'reporting_period_id' => [
                'required',
                'integer',
                'exists:reporting_periods,id',
            ],

            'status_id' => [
                'required',
                'integer',
                'exists:submission_statuses,id',
            ],

            'remarks' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }
}
