<?php

namespace App\Http\Controllers;

use App\Models\CheckoutSession;
use App\Models\Postcard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;

class CheckoutSessionController extends Controller
{
    public function find(Request $request): JsonResponse
    {
        $user = $request->user();

        Log::info("user {$user->id}");

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Find the checkout session for the authenticated user
        $checkoutSession = $user->checkoutSessions()
            ->where('status', 'pending')
            ->with('postcards')
            ->first();

        if (!$checkoutSession) {
            return response()->json(['error' => 'Checkout session not found'], 404);
        }

        Log::info("checkout session {$checkoutSession->id}");

        return response()->json($checkoutSession);
    }

    public function create(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Create a new checkout session
        $checkoutSession = CheckoutSession::create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        // If a prompt is provided, create a postcard
        if ($request->has('prompt')) {
            $checkoutSession->postcards()->create([
                'prompt' => $request->input('prompt'),
                'checkout_session_id' => $checkoutSession->id,
            ]);
        }

        return response()->json($checkoutSession->with('postcards')->first(), 201);
    }

    public function complete(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $chosenPostcardId = $request->json('chosenPostcardId');

        // Find the checkout session for the authenticated user
        $checkoutSession = $user->checkoutSessions()
            ->where('status', 'pending')
            ->with('postcards')
            ->first();

        if (!$checkoutSession) {
            return response()->json(['error' => 'Checkout session not found'], 404);
        }

        // Find the chosen postcard
        $postcard = $checkoutSession->postcards()->find($chosenPostcardId);
        if (!$postcard) {
            return response()->json(['error' => 'Postcard not found'], 404);
        }

        // Update the postcard with the customer's message
        $postcard->update([
            'message' => $request->json('message', '')
        ]);

        // If the postcard is not already processed, dispatch the job to process it
        \App\Jobs\SendPostcard::dispatch($postcard);

        // Update the checkout session status to completed
        $checkoutSession->update(['status' => 'completed']);

        return response()->json($checkoutSession->load('postcards'));
    }

    public function createPaymentIntent(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Find the checkout session for the authenticated user
        $checkoutSession = $user->checkoutSessions()
            ->where('status', 'pending')
            ->with('postcards')
            ->first();

        if (!$checkoutSession) {
            return response()->json(['error' => 'Checkout session not found'], 404);
        }

        // Initialize Stripe with the secret key
        $stripe = new StripeClient(config('services.stripe.secret'));

        try {
            if ($checkoutSession->payment_reference) {
                // If a payment intent already exists, retrieve it
                $existingPaymentIntent = $stripe->paymentIntents->retrieve($checkoutSession->payment_reference);
                if ($checkoutSession->paid) {
                    return response()->json(['error' => 'Payment already completed'], 400);
                }

                if (!$checkoutSession->paid && $existingPaymentIntent->status === 'succeeded') {
                    // Update the checkout session to paid if the payment intent succeeded
                    $checkoutSession->update(['paid' => true]);
                    return response()->json(['error' => 'Payment already completed'], 400);
                }

                return response()->json([
                    'clientSecret' => $existingPaymentIntent->client_secret,
                ]);
            }

            // Create a PaymentIntent with the order amount and currency
            $paymentIntent = $stripe->paymentIntents->create([
                'amount' => 5005, // Amount in cents (e.g., $10.00)
                'currency' => 'gbp',
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
                'metadata' => [
                    'checkout_session_id' => $checkoutSession->id,
                    'user_id' => $user->id,
                ],
            ]);

            // Update the checkout session with the payment reference
            $checkoutSession->update([
                'payment_reference' => $paymentIntent->id,
            ]);

            // Return the client secret to the frontend
            return response()->json([
                'clientSecret' => $paymentIntent->client_secret,
            ]);
        } catch (\Exception $e) {
            Log::error('Stripe error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create payment intent'], 500);
        }
    }

    public function updateShippingAddress(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Find the checkout session for the authenticated user
        $checkoutSession = $user->checkoutSessions()
            ->where('status', 'pending')
            ->first();

        if (!$checkoutSession) {
            return response()->json(['error' => 'Checkout session not found'], 404);
        }

        // Validate the request data
        $validated = $request->validate([
            'shipping_name' => 'required|string|max:255',
            'shipping_address_line1' => 'required|string|max:255',
            'shipping_address_line2' => 'nullable|string|max:255',
            'shipping_address_city' => 'required|string|max:255',
            'shipping_address_postal_code' => 'required|string|max:20',
            'shipping_address_country' => 'required|string|max:255',
        ]);

        // Update the checkout session with the new shipping address
        $checkoutSession->update($validated);

        return response()->json($checkoutSession->load('postcards'));
    }

    public function handleStripeWebhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $endpointSecret = config('services.stripe.webhook_secret');

        try {
            // Verify the webhook signature
            // If this is a test environment without a valid signature, comment this out
            // and use the json_decode approach below
            $event = \Stripe\Webhook::constructEvent(
                $payload, $sigHeader, $endpointSecret
            );

            // Handle the event
            switch ($event->type) {
                case 'payment_intent.succeeded':
                    $paymentIntent = $event->data->object;
                    $checkoutSessionId = $paymentIntent->metadata->checkout_session_id;
                    $checkoutSession = CheckoutSession::find($checkoutSessionId);

                    if ($checkoutSession) {
                        $shipping = $paymentIntent->shipping;
                        $address = $shipping->address;

                        $checkoutSession->update([
                            'paid' => true,
                            'shipping_address_city' => $address->city,
                            'shipping_address_country' => $address->country,
                            'shipping_address_line1' => $address->line1,
                            'shipping_address_line2' => $address->line2,
                            'shipping_address_postal_code' => $address->postal_code,
                            'shipping_address_state' => $address->state,
                            'shipping_name' => $shipping->name,
                            'shipping_phone' => $shipping->phone,
                        ]);
                    }
                    break;
                default:
                    Log::info('Received unknown event type ' . $event->type);
            }

            return response()->json(['status' => 'success']);
        } catch (\UnexpectedValueException $e) {
            // Invalid payload
            Log::error('Webhook error: Invalid payload.', ['exception' => $e]);
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            // Invalid signature
            Log::error('Webhook error: Invalid signature.', ['exception' => $e]);
            return response()->json(['error' => 'Invalid signature'], 400);
        } catch (\Exception $e) {
            Log::error('Webhook error: ' . $e->getMessage());
            return response()->json(['error' => 'Webhook error'], 500);
        }
    }
}
