<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->string('shipping_address_city')->nullable();
            $table->string('shipping_address_country')->nullable();
            $table->string('shipping_address_line1')->nullable();
            $table->string('shipping_address_line2')->nullable();
            $table->string('shipping_address_postal_code')->nullable();
            $table->string('shipping_address_state')->nullable();
            $table->string('shipping_name')->nullable();
            $table->string('shipping_phone')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'shipping_address_city',
                'shipping_address_country',
                'shipping_address_line1',
                'shipping_address_line2',
                'shipping_address_postal_code',
                'shipping_address_state',
                'shipping_name',
                'shipping_phone',
            ]);
        });
    }
};
