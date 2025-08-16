<?php

namespace App\Http\Controllers;

use App\Models\Postcard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PostcardController extends Controller
{
    /**
     * Create a new postcard for the current checkout session.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Validate the request
        $validated = $request->validate([
            'prompt' => 'required|string|max:500',
            'message' => 'nullable|string|max:500',
        ]);

        // Find the current checkout session for the user
        $checkoutSession = $user->checkoutSessions()
            ->where('status', 'pending')
            ->first();

        if (!$checkoutSession) {
            return response()->json(['error' => 'No active checkout session found'], 404);
        }

        // Create a new postcard
        $postcard = $checkoutSession->postcards()->create([
            'prompt' => $validated['prompt'],
            'message' => $validated['message'] ?? null,
            'checkout_session_id' => $checkoutSession->id,
        ]);

        return response()->json($postcard, 201);
    }

    /**
     * Get a specific postcard.
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Find the postcard and ensure it belongs to the user
        $postcard = Postcard::whereHas('checkoutSession', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->find($id);

        if (!$postcard) {
            return response()->json(['error' => 'Postcard not found'], 404);
        }

        return response()->json($postcard);
    }
}
