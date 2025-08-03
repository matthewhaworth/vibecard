<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CheckoutSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CheckoutSessionController extends Controller
{
    public function findOrCreate(Request $request): JsonResponse
    {
        $isAdmin = $request->user()->type === 'admin';

        Log::info('CheckoutSessionController: findOrCreate called', [
            'user_id' => $request->user()->id,
            'is_admin' => $isAdmin,
        ]);

        if (!$isAdmin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $checkoutSession = CheckoutSession::where('user_id', $request->user()->id)->firstOrFail();

        return response()->json($checkoutSession);
    }
}
