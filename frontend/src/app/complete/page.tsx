'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import {CheckoutSession, Postcard} from "@/lib/types";

export default function Complete() {
    const router = useRouter()
    // load checkout session from local storage
    const checkoutSession: CheckoutSession | null = localStorage.getItem('lastCheckoutSession') ?
        JSON.parse(localStorage.getItem('lastCheckoutSession') as string) : null;

    const chosenPostcard = checkoutSession?.postcards.find((pc: Postcard) => pc.id === checkoutSession.chosen_postcard_id);
    console.log('Chosen postcard:', chosenPostcard);

    if (!checkoutSession || !chosenPostcard) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                <h2 className="text-xl font-semibold mb-2">Loading...</h2>
                <p className="text-gray-600 text-center">
                    Please wait while we load your order details.
                </p>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <div className="flex flex-col items-center text-center mb-8">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                    <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Order Complete!</h1>
                <p className="text-gray-600 mb-6">
                    Your postcard has been successfully ordered and will be sent to your address soon.
                </p>
            </div>

            <div className="bg-gray-50 rounded-lg overflow-hidden shadow-md mb-8">
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                    
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Your Postcard</h3>
                        {chosenPostcard.image_url ? (
                            <img 
                                src={chosenPostcard.image_url}
                                alt="Your Postcard" 
                                className="w-full rounded-md mb-4 shadow-sm"
                            />
                        ) : (
                            <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                                <p className="text-gray-500">Image processing</p>
                            </div>
                        )}
                        <p className="text-sm text-gray-600 italic mb-4">
                            "{chosenPostcard.prompt}"
                        </p>
                        {chosenPostcard.message && (
                            <div className="bg-white p-4 rounded-md border border-gray-200 mb-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Your Message</h4>
                                <p className="text-gray-700">{chosenPostcard.message}</p>
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Shipping Address</h3>
                        <div className="bg-white p-4 rounded-md border border-gray-200">
                            <div className="font-medium">{checkoutSession.shipping_name || ''}</div>
                            <div>{checkoutSession.shipping_address_line1 || ''}</div>
                            {checkoutSession.shipping_address_line2 && <div>{checkoutSession.shipping_address_line2}</div>}
                            <div>
                                {checkoutSession.shipping_address_city || ''}{' '}
                                {checkoutSession.shipping_address_postal_code || ''}
                            </div>
                            <div>{checkoutSession.shipping_address_country || ''}</div>
                        </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-6">
                        <p>Your postcard will be printed and mailed within 1-2 business days.</p>
                        <p>Delivery typically takes 3-7 business days depending on your location.</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center">
                <Button asChild size="lg" className="mb-4">
                    <Link href="/">Create Another Postcard</Link>
                </Button>
            </div>
        </div>
    )
}