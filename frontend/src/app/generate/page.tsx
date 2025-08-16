'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {createPostcard, useCheckoutSession} from '@/utils/hooks'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2Icon } from 'lucide-react'

export default function GeneratePage() {
    const router = useRouter()
    const { session: checkoutSession, mutate: refreshSession } = useCheckoutSession()

    const [prompt, setPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedPostcardId, setSelectedPostcardId] = useState<number | null>(null)


    const shippingAddress = <>
        {checkoutSession.shipping_name || ''},<br />
        {checkoutSession.shipping_address_line1 || ''},<br />
        {checkoutSession.shipping_address_line2 &&  <>{checkoutSession.shipping_address_line2 || ''},<br /></> || ''}
        {checkoutSession.shipping_address_city || ''},<br />
        {checkoutSession.shipping_address_postal_code || ''},<br />
        {checkoutSession.shipping_address_country || ''}<br />
    </>
    
    if (!checkoutSession) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    const handleCreatePostcard = async () => {
        if (!prompt.trim()) return

        setIsLoading(true);

        try {
            await createPostcard(prompt);
            await refreshSession();
        } catch (error) {
            console.error('Error creating postcard:', error)
        }

        setPrompt('')
        setIsLoading(false);
    }
    
    const handleSelectPostcard = (postcardId: number) => {
        setSelectedPostcardId(postcardId)
    }
    
    const handleSendPostcard = () => {
        if (selectedPostcardId) {
            // In a real app, this would save the selected postcard ID to the checkout session
            // and redirect to the next step in the checkout flow
            router.push('/payment')
        }
    }
    
    const canCreateMorePostcards = checkoutSession.postcards.length < 4
    
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Your Postcards</h1>
            
            {checkoutSession.postcards.length === 0 ? (
                <div className="text-center p-6 bg-gray-100 rounded-lg">
                    <p className="mb-4">You haven't created any postcards yet.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6 mb-8">
                    {checkoutSession.postcards.map((postcard: any) => (
                        <div 
                            key={postcard.id} 
                            className={`border rounded-lg overflow-hidden shadow-md ${selectedPostcardId === postcard.id ? 'ring-2 ring-blue-500' : ''}`}
                        >
                            {postcard.image_url ? (
                                <img 
                                    src={postcard.image_url} 
                                    alt="Postcard" 
                                    className="w-full"
                                />
                            ) : (
                                <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                                </div>
                            )}
                            
                            <div className="p-4">
                                <Button
                                    onClick={() => handleSelectPostcard(postcard.id)}
                                    variant={selectedPostcardId === postcard.id ? "default" : "outline"}
                                    className="w-full mt-2 hover:cursor-pointer"
                                >
                                    {selectedPostcardId === postcard.id 
                                        ? "Selected" 
                                        : "Send this postcard to your address"}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {canCreateMorePostcards && (
                <div className="border border-dashed border-gray-300 rounded-lg mb-6 overflow-hidden">
                    <div className="w-full h-64 bg-white z-50 flex flex-col items-center justify-center p-6">
                        <h2 className="text-xl font-semibold mb-4">Create a New Postcard</h2>
                        <div className="w-full max-w-md">
                            <Label htmlFor="prompt" className="mb-2 block">Enter a prompt for your postcard:</Label>
                            <Textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe what you'd like to see on your postcard..."
                                className="w-full"
                                rows={3}
                            />
                            <Button 
                                onClick={handleCreatePostcard} 
                                disabled={!prompt.trim() || isLoading}
                                className="w-full mt-4 hover:cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Postcard'
                                )}
                            </Button>
                            <p className="text-sm text-gray-500 mt-2 text-center">
                                You can create up to {4 - checkoutSession.postcards.length} more postcards.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {checkoutSession.postcards.length > 0 && (
                <div className="text-center border-t pt-6 mt-6">
                    {selectedPostcardId !== null && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg inline-block">
                            <p className="text-sm text-gray-600 mb-2">Shipping to:</p>
                            <p className="font-medium">{shippingAddress}</p>
                        </div>
                    )}
                    <div>
                        <Button 
                            onClick={handleSendPostcard} 
                            disabled={selectedPostcardId === null}
                            size="lg"
                        >
                            {selectedPostcardId === null 
                                ? "Select a postcard to continue" 
                                : "Continue with selected postcard"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}