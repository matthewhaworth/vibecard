<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
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
}
