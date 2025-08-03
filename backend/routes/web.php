<?php

use App\Http\Controllers\OtpController;
use App\Http\Controllers\CheckoutSessionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/otp-request', [OtpController::class, 'request']);
Route::post('/otp-login', [OtpController::class, 'login']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/checkout-session', [CheckoutSessionController::class, 'findOrCreate'])
    ->middleware('auth:sanctum');
