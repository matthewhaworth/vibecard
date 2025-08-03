<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OtpController extends Controller
{
    public function request(Request $request)
    {
        $request->validate(['email' => 'required|email']);


        $user = User::firstOrCreate([
            'email' => $request->email
        ], [
            'name' => $request->email,
            'password' => bcrypt(Str::random(32)), // Temporary password for user creation
        ]);

        $user->sendOneTimePassword();

        return response()->json(['message' => 'OTP sent']);
    }

    public function login(Request $request)
    {
        Log::info('Full request', [
            'request' => $request->all(),
        ]);

        Log::info('OTP login attempt', [
            'email' => $request->email,
            'code' => $request->code,
        ]);

        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid user'], 404);
        }

        $result = $user->attemptLoginUsingOneTimePassword($request->code);

        if (! $result->isOk()) {
            return response()->json(['message' => 'Invalid or expired OTP'], 401);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['message' => 'Authenticated']);
    }
}
