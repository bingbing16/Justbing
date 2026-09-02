<?php

namespace Database\Seeders;

use App\Models\Lgu;
use Illuminate\Database\Seeder;

class LguSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Lgu::create([
            'name' => 'MANDALUYONG',
            'code' => 'MANDA',
            'province' => 'METRO MANILA',
            'municipality' => 'METRO MANILA',
            'is_active'=> true,
        ]);
    }
}
