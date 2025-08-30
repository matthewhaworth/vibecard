'use client'

import {useEffect, useState} from 'react'
import { useRouter } from 'next/navigation'
import { 
  Elements, 
  PaymentElement, 
  AddressElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import {fetchPaymentIntent, useCheckoutSession} from '@/utils/hooks'
import {Button} from "@/components/ui/button";

// Initialize Stripe with your publishable key
// In a real app, this would be an environment variable
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

// The wrapper component that provides Stripe context
export default function PaymentFormWrapper() {
  const { session: checkoutSession } = useCheckoutSession()
  const [ isLoadingSecret, setIsLoadingSecret ] = useState(true);
  const [ clientSecret, setClientSecret ] = useState<string | null>(null);
  const [ isError, setIsError ] = useState<any>(null);

  useEffect(() => {
    const loadPaymentIntent = async () => {
        try {
            const response = await fetchPaymentIntent();
            setClientSecret(response.clientSecret);
        } catch (error) {
            setIsError(error);
            console.error('Error fetching payment intent:', error)
        } finally {
            setIsLoadingSecret(false)
        }
    }

    if (checkoutSession) {
        loadPaymentIntent()
    }
  }, [checkoutSession]);


  if (!checkoutSession || isLoadingSecret) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  
  if (isError) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Error</h1>
        <p className="text-red-500">
          There was an error setting up the payment. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Complete Your Purchase</h1>
      
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-md text-center shadow-sm">
        <p className="text-gray-600 mb-1">Total Amount</p>
        <p className="text-2xl font-semibold text-gray-800">£4.49</p>
        <p className="text-sm text-gray-500 mt-1">Includes postcard printing and delivery</p>
      </div>
      
      <div className="mb-6 flex justify-between items-center px-2">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">1</div>
          <p className="text-xs mt-1 text-gray-600">Details</p>
        </div>
        <div className="h-1 flex-1 bg-gray-200 mx-2"></div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">2</div>
          <p className="text-xs mt-1 text-gray-600">Payment</p>
        </div>
        <div className="h-1 flex-1 bg-gray-200 mx-2"></div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-medium">3</div>
          <p className="text-xs mt-1 text-gray-400">Confirmation</p>
        </div>
      </div>
      
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm checkoutSession={checkoutSession} />
        </Elements>
      )}
    </div>
  )
}

// The actual payment form component
function PaymentForm({ checkoutSession }: { checkoutSession: any }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(undefined)

    try {
      // Confirm the payment with Stripe
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Make sure to change this to your payment completion page
          return_url: `${window.location.protocol}//${window.location.host}/payment-response`,
        },
        redirect: 'if_required',
      })

      if (submitError) {
        // This point will only be reached if there is an immediate error when
        // confirming the payment. Show error to your customer (for example, payment
        // details incomplete)
        console.error('Payment error:', submitError)
        setErrorMessage('An error occurred while processing your payment. Please try again.')
        return;
      } else {
        // Your customer will be redirected to your `return_url`.
        // For some payment methods like iDEAL, your customer will be redirected to an intermediate
        // site first to authorize the payment, then redirected to the `return_url`.
        router.push('/payment-response')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      setErrorMessage(error.message || 'An error occurred while processing your payment. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-5 border border-gray-100 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center mb-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium mr-2">1</div>
          <h2 className="text-lg font-semibold text-gray-800">Shipping Address</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">Enter the address where you'd like your postcard delivered</p>
        <AddressElement options={{ mode: 'shipping' }} />
      </div>
      
      <div className="p-5 border border-gray-100 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center mb-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium mr-2">2</div>
          <h2 className="text-lg font-semibold text-gray-800">Payment Details</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">Secure payment processing by Stripe</p>
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="hover:cursor-pointer w-full py-6 text-lg font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
      >
        {isProcessing ? 
          <><Loader2Icon className="animate-spin mr-2" /> Processing...</> : 
          'Pay £4.49 Now'}
      </Button>
      
      <div className="flex items-center justify-center space-x-2 mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <p className="text-center text-sm text-gray-500">
          Secure payment - your card will be charged £4.49
        </p>
      </div>
    </form>
  )
}