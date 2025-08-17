<?php

use App\Http\Controllers\Api\CheckoutSessionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/checkout-session', [CheckoutSessionController::class, 'findOrCreate'])
    ->middleware('auth:sanctum');

// Stripe webhook endpoint - no auth middleware as it's called by Stripe
Route::post('/webhook/stripe', [\App\Http\Controllers\CheckoutSessionController::class, 'handleStripeWebhook']);
