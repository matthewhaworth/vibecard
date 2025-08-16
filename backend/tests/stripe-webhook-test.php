<?php

// This script simulates a Stripe webhook event to test our webhook endpoint
// Run this script with: php tests/stripe-webhook-test.php

// Load the Laravel environment
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\CheckoutSession;
use Illuminate\Support\Facades\Log;

// Function to test the webhook endpoint
function testStripeWebhook() {
    echo "Starting Stripe webhook test...\n";

    // First, find a checkout session to test with
    $checkoutSession = CheckoutSession::where('status', 'pending')
        ->whereNotNull('payment_reference')
        ->first();

    if (!$checkoutSession) {
        echo "Error: No pending checkout session with payment reference found.\n";
        echo "Please create a checkout session with a payment reference first.\n";
        return;
    }

    echo "Found checkout session ID: {$checkoutSession->id} with payment reference: {$checkoutSession->payment_reference}\n";
    echo "Current paid status: " . ($checkoutSession->paid ? 'true' : 'false') . "\n";
    echo "Current status: {$checkoutSession->status}\n";

    // Create a mock payment_intent.succeeded event payload
    $payload = [
        'id' => 'evt_' . uniqid(),
        'object' => 'event',
        'type' => 'payment_intent.succeeded',
        'data' => [
            'object' => [
                'id' => $checkoutSession->payment_reference,
                'object' => 'payment_intent',
                'status' => 'succeeded',
                'amount' => 5005,
                'currency' => 'gbp',
            ]
        ]
    ];

    // Convert to JSON
    $jsonPayload = json_encode($payload);

    // Note: In a real webhook, Stripe would sign the payload
    // For testing purposes, we'll bypass the signature verification
    // by modifying our controller temporarily or using a test endpoint

    echo "Sending webhook request to /api/webhook/stripe...\n";

    // Use Laravel's HTTP client to send a request to our webhook endpoint
    $response = \Illuminate\Support\Facades\Http::withHeaders([
        'Content-Type' => 'application/json',
    ])->post('http://localhost:8000/api/webhook/stripe', $payload);

    echo "Response status: {$response->status()}\n";
    echo "Response body: {$response->body()}\n";

    // Check if the checkout session was updated
    $checkoutSession->refresh();
    echo "Updated paid status: " . ($checkoutSession->paid ? 'true' : 'false') . "\n";
    echo "Updated status: {$checkoutSession->status}\n";

    echo "Test completed.\n";
}

// Run the test
testStripeWebhook();
