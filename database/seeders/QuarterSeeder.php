<?php

namespace Database\Seeders;

use App\Models\Quarter;
use Illuminate\Database\Seeder;

class QuarterSeeder extends Seeder
{
    public function run(): void
    {
        Quarter::create([
            'code' => 'Q1',
            'name' => 'Quarter 1',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        Quarter::create([
            'code' => 'Q2',
            'name' => 'Quarter 2',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        Quarter::create([
            'code' => 'Q3',
            'name' => 'Quarter 3',
            'sort_order' => 3,
            'is_active' => true,
        ]);

        Quarter::create([
            'code' => 'Q4',
            'name' => 'Quarter 4',
            'sort_order' => 4,
            'is_active' => true,
        ]);
    }
}