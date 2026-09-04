<?php

namespace Modules\Justine\Database\Seeders;

use Illuminate\Database\Seeder;

class JustineDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            HWPSCSeeder::class,
        ]);
    }
}