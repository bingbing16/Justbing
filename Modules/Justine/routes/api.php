<?php

use Illuminate\Support\Facades\Route;
use Modules\Justine\Http\Controllers\JustineController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('justines', JustineController::class)->names('justine');
});
