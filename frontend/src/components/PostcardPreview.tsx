'use client'

import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import {LARAVEL_API_URL, useCheckoutSession} from "@/utils/hooks";
import {Button} from "@/components/ui/button";

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json())

export default function PostcardPreview() {
    const router = useRouter()

    const { session: checkoutSession, isError: checkoutError } = useCheckoutSession();

    if (checkoutSession && checkoutSession.postcards.length === 0) {
        // If there are no postcards in the session, redirect to create page
        router.push('/')
        return null
    }

    const postcardId = checkoutSession?.postcards[0]?.id

    const { data: postcard, error: postcardError } = useSWR(
        postcardId ? `${LARAVEL_API_URL}/postcards/${postcardId}` : null,
        fetcher,
        {
            refreshInterval: (latestData) => {
                // Stop polling if the image is ready or if there was an error
                if (latestData?.image_url || postcardError) {
                    return 0
                }
                return 1000 // Poll every 5 seconds
            },
        }
    )

    if (checkoutError || postcardError) {
        return <div>Error loading preview. Please try again.</div>
    }

    if (!checkoutSession) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    if (!postcard) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center p-6">
            <h1 className="text-2xl font-bold mb-6">Postcard Preview</h1>
            {postcard.image_url ? (
                <>
                    <div className="mb-6">
                        <img 
                            src={postcard.image_url} 
                            alt="Postcard Preview" 
                            className="max-w-full rounded-lg shadow-lg"
                        />
                    </div>
                    <Button
                        size={'lg'}
                        onClick={() => router.push('/payment')}
                        className="hover:cursor-pointer"
                    >
                        Continue to Payment
                    </Button>
                </>
            ) : (
                <div className="text-center">
                    <p className="mb-4">Your postcard is being generated. Please wait.</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
                </div>
            )}
        </div>
    )
}
