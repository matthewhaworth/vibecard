<?php

use App\Http\Controllers\CheckoutSessionController;
use App\Http\Controllers\OtpController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/otp-request', [OtpController::class, 'request']);
Route::post('/otp-login', [OtpController::class, 'login']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/checkout-session', [CheckoutSessionController::class, 'create'])
    ->middleware('auth:sanctum');

Route::get('/checkout-session', [CheckoutSessionController::class, 'find'])
    ->middleware('auth:sanctum');

Route::post('/checkout-complete', [CheckoutSessionController::class, 'complete'])
    ->middleware('auth:sanctum');

Route::post('/payment-intent', [CheckoutSessionController::class, 'createPaymentIntent'])
    ->middleware('auth:sanctum');

// Postcard routes
Route::post('/postcards', [\App\Http\Controllers\PostcardController::class, 'store'])
    ->middleware('auth:sanctum');

Route::get('/postcards/{id}', [\App\Http\Controllers\PostcardController::class, 'show'])
    ->middleware('auth:sanctum');


Route::get('/postcard/{id}', function(Request $request, $id) {
    $postcard = \App\Models\Postcard::findOrFail($id);
    return response()->view('pdf.postcard', [
        'postcard' => $postcard,
        'image_url' => $postcard->image_url,
        'message' => "Regarding your question about character limits, to ensure the message remains relatively centered on the left side of an A5 postcard, I would recommend keeping the message to approximately 350 characters. This will provide a balanced and aesthetically pleasing layout. Regarding your question about character limits, to ensure the message remains relatively centered on the left side of an A5 postcard, I would recommend keeping the message to approximately 350 characters. This will provide a balanced and aesthetically pleasing layout.",//$postcard->message,
        'pdf_url' => $postcard->pdf_url
    ]);
});

