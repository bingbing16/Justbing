<?php

use Illuminate\Support\Facades\Route;
use Modules\Krizza\Http\Controllers\KrizzaController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('krizzas', KrizzaController::class)->names('krizza');
});
