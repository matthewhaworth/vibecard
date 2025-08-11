<?php

namespace App\Models;

use App\Jobs\ProcessPostcard;
use Illuminate\Database\Eloquent\Model;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class Postcard extends Model
{
    protected $fillable = [
        'prompt',
        'checkout_session_id',
        'image_url',
        'pdf_url',
        'message',
    ];

    protected static function booted()
    {
        static::created(function ($postcard) {
            ProcessPostcard::dispatch($postcard);
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function checkoutSession()
    {
        return $this->belongsTo(CheckoutSession::class);
    }
}
