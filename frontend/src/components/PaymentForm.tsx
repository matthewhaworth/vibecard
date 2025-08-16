'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Elements, 
  PaymentElement, 
  AddressElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCheckoutSession, usePaymentIntent } from '@/utils/hooks'

// Initialize Stripe with your publishable key
// In a real app, this would be an environment variable
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

// The wrapper component that provides Stripe context
export default function PaymentFormWrapper() {
  const { session: checkoutSession } = useCheckoutSession()
  const { clientSecret, isLoading: isLoadingSecret, isError } = usePaymentIntent()
  
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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Purchase</h1>
      
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
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
        <AddressElement options={{ mode: 'shipping' }} />
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Payment Details</h2>
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  )
}