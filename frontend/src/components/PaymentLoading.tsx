'use client'

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCheckoutSession } from '@/utils/hooks';

/**
 * PaymentLoading component displays a spinner while waiting for payment confirmation
 * and automatically redirects to the generate page when payment is confirmed
 */
export default function PaymentLoading() {
  const router = useRouter();
  const { session, isLoading, mutate } = useCheckoutSession();

  // Set up polling to check payment status
  useEffect(() => {
    // Poll every 2 seconds to check if payment has been processed
    const intervalId = setInterval(() => {
      mutate(); // Refresh the checkout session data
    }, 2000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [mutate]);

  // Redirect to generate page when payment is confirmed
  useEffect(() => {
    if (session && session.paid) {
      router.push('/generate');
    }
  }, [session, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
      <p className="text-gray-600 text-center">
        Please wait while we confirm your payment. You will be redirected automatically.
      </p>
    </div>
  );
}