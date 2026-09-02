<?php

namespace Database\Seeders;

use App\Models\SubmissionStatus;
use Illuminate\Database\Seeder;

class SubmissionStatusSeeder extends Seeder
{
    public function run(): void
    {
        SubmissionStatus::create([
            'code' => 'draft',
            'name' => 'Draft',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        SubmissionStatus::create([
            'code' => 'submitted',
            'name' => 'Submitted',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        SubmissionStatus::create([
            'code' => 'approved',
            'name' => 'Approved',
            'sort_order' => 3,
            'is_active' => true,
        ]);

        SubmissionStatus::create([
            'code' => 'rejected',
            'name' => 'Rejected',
            'sort_order' => 4,
            'is_active' => true,
        ]);
    }
}