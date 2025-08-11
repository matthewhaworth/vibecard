<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostcardResource;
use App\Models\Postcard;
use Illuminate\Http\Request;

class PostcardController extends Controller
{
    public function show(Request $request, Postcard $postcard)
    {
        // Ensure the user can only access their own postcards
        // Assuming a relationship between user and postcard exists
        if ($request->user()->id !== $postcard->checkoutSession->user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json($postcard);
    }
}

