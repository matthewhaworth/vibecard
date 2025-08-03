<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class CheckoutSession extends Model
{
    protected $fillable = [
        'user_id',
        'payment_reference',
        'status'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function postcards(): HasMany
    {
        return $this->hasMany(Postcard::class);
    }

    public static function findOrCreatePendingForUser(int $userId): self
    {
        // First try to find an existing pending session
        $existingSession = self::where('user_id', $userId)
            ->where('status', 'pending')
            ->first();

        if ($existingSession) {
            return $existingSession;
        }

        // Create a new pending session
        return self::create([
            'user_id' => $userId,
            'status' => 'pending'
        ]);
    }
}
