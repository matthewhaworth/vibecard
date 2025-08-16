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
        'status',
        'paid',
        'shipping_address_city',
        'shipping_address_country',
        'shipping_address_line1',
        'shipping_address_line2',
        'shipping_address_postal_code',
        'shipping_address_state',
        'shipping_name',
        'shipping_phone',
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
