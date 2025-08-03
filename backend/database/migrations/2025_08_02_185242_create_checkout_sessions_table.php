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
        Schema::create('checkout_sessions', function (Blueprint $table) {
            $table->id();

            // user reference
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->string('payment_reference')->unique()->nullable(); // Unique reference for payment processing
            $table->string('status')->default('pending'); // pending, completed, failed

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('checkout_sessions');
    }
};
