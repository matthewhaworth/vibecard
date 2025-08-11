<?php

namespace App\Http\Controllers;

use App\Models\CheckoutSession;
use App\Models\Postcard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        Log::info("checkout session {$checkoutSession->id}");

        if (!$checkoutSession) {
            return response()->json(['error' => 'Checkout session not found'], 404);
        }

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
}
