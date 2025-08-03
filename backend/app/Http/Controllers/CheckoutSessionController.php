<?php

namespace App\Http\Controllers;

use App\Models\CheckoutSession;
use App\Models\Postcard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutSessionController extends Controller
{
    public function findOrCreate(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $checkoutSession = CheckoutSession::findOrCreatePendingForUser($user->id);

        // create postcard based on prompt passed in the request and attach to session
        if ($request->has('prompt')) {
            $postcard = Postcard::create([
                'user_id' => $user->id,
                'prompt' => $request->input('prompt'),
                'checkout_session_id' => $checkoutSession->id,
            ]);
            $checkoutSession->postcards()->save($postcard);
        }

        return response()->json();
    }
}
