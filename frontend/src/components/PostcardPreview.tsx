'use client'

import useSWR from 'swr'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {LARAVEL_API_URL, useCheckoutSession} from "@/utils/hooks";

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
                return 5000 // Poll every 5 seconds
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
        <div>
            <h1>Postcard Preview</h1>
            {postcard.image_url ? (
                <img src={postcard.image_url} alt="Postcard Preview" />
            ) : (
                <div>
                    <p>Your postcard is being generated. Please wait.</p>
                    {/* You can add a loading spinner here */}
                </div>
            )}
        </div>
    )
}
