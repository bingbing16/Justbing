<?php

use Illuminate\Support\Facades\Route;
use Modules\Justine\Http\Controllers\JustineController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('justines', JustineController::class)->names('justine');
});
