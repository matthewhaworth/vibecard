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
      <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Purchase</h1>
      
      <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-md text-center">
        <p className="text-gray-600 mb-1">Total Amount</p>
        <p className="text-2xl font-semibold text-gray-800">£4.49</p>
        <p className="text-sm text-gray-500 mt-1">Includes postcard printing and delivery</p>
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
      <div className="p-5 border border-gray-100 rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Shipping Address</h2>
        <AddressElement options={{ mode: 'shipping' }} />
      </div>
      
      <div className="p-5 border border-gray-100 rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Payment Details</h2>
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
        className="hover:cursor-pointer w-full py-6 text-lg font-medium transition-transform"
      >
        {isProcessing ? 'Processing...' : 'Pay £4.49 Now'}
      </Button>
      
      <p className="text-center text-sm text-gray-500 mt-4">
        Your card will be charged £4.49 upon submission
      </p>
    </form>
  )
}