<?php

use Illuminate\Support\Facades\Route;
use Modules\Krizza\Http\Controllers\KrizzaController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('krizzas', KrizzaController::class)->names('krizza');
});
