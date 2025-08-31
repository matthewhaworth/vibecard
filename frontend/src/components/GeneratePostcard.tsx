'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {completeOrder, createPostcard, updateShippingAddress, useCheckoutSession} from '@/utils/hooks'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2Icon } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function GeneratePostcard() {
    const router = useRouter()
    const { session: checkoutSession, mutate: refreshSession } = useCheckoutSession()

    const [prompt, setPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isAddressLoading, setIsAddressLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [selectedPostcardId, setSelectedPostcardId] = useState<number | null>(null)
    const [isEditingAddress, setIsEditingAddress] = useState(false)
    const [addressForm, setAddressForm] = useState({
        name: '',
        line1: '',
        line2: '',
        city: '',
        postalCode: '',
        country: ''
    })
    
    // Initialize address form with current values when checkout session changes
    useEffect(() => {
        if (checkoutSession) {
            setAddressForm({
                name: checkoutSession.shipping_name || '',
                line1: checkoutSession.shipping_address_line1 || '',
                line2: checkoutSession.shipping_address_line2 || '',
                city: checkoutSession.shipping_address_city || '',
                postalCode: checkoutSession.shipping_address_postal_code || '',
                country: checkoutSession.shipping_address_country || ''
            })
        }
    }, [checkoutSession])

    // Format shipping address for display
    const shippingAddress = (
        <div className="text-left">
            <div className="font-semibold">{checkoutSession?.shipping_name || ''}</div>
            <div>{checkoutSession?.shipping_address_line1 || ''}</div>
            {checkoutSession?.shipping_address_line2 && <div>{checkoutSession?.shipping_address_line2}</div>}
            <div>
                {checkoutSession?.shipping_address_city || ''}{' '}
                {checkoutSession?.shipping_address_postal_code || ''}
            </div>
            <div>{checkoutSession?.shipping_address_country || ''}</div>
        </div>
    )
    
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
    
    const handleSendPostcard = async () => {
        if (selectedPostcardId) {
            setIsLoading(true);
            await completeOrder(checkoutSession.id, selectedPostcardId, message);

            // write the checkout session to local storage for the complete page to read
            localStorage.setItem('lastCheckoutSession', JSON.stringify({
                ...checkoutSession,
                chosen_postcard_id: selectedPostcardId,
                message: message
            }));

            await refreshSession();

            setIsLoading(false);
            router.push('/complete')
        }
    }
    
    const canCreateMorePostcards = checkoutSession.postcards.length < 4
    
    return (
        <div className={'max-w-2xl mx-auto mt-8 bg-white p-5 sm:p-6 rounded-lg shadow-sm border border-gray-100'}>
            <h1 className="text-2xl font-bold mb-6">Choose a Postcard to Send</h1>
            
            {checkoutSession.postcards.length === 0 ? (
                <div className="text-center p-6 bg-gray-100 rounded-lg">
                    <p className="mb-4">You haven't created any postcards yet.</p>
                    <p className="text-sm text-gray-600">Create your first postcard below to get started.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6 mb-8">
                    <p className="text-gray-700 font-medium">Select one of your postcards below to continue:</p>
                    {checkoutSession.postcards.map((postcard: any) => (
                        <div 
                            key={postcard.id} 
                            onClick={() => handleSelectPostcard(postcard.id)}
                            className={`border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer ${selectedPostcardId === postcard.id ? 'ring-2 ring-blue-500' : ''}`}
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectPostcard(postcard.id);
                                    }}
                                    variant={selectedPostcardId === postcard.id ? "default" : "outline"}
                                    className="w-full mt-2 hover:cursor-pointer"
                                >
                                    {selectedPostcardId === postcard.id 
                                        ? "Selected ✓" 
                                        : "Choose this postcard"}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {canCreateMorePostcards && (
                <div className="mt-8 mb-6">
                    <details className="group">
                        <summary className="flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer list-none text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
                            <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Create another postcard option
                            </span>
                            <span className="text-xs text-gray-500">
                                ({4 - checkoutSession.postcards.length} more included)
                            </span>
                        </summary>
                        
                        <div className="mt-4 border border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                            <div className="w-full p-6 flex flex-col items-center justify-center">
                                <h2 className="text-lg font-medium mb-4 text-gray-700">Generate a new postcard design</h2>
                                <div className="w-full max-w-md">
                                    <Label htmlFor="prompt" className="mb-2 block text-sm">Enter a prompt for your postcard:</Label>
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
                                        variant="outline"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Generate New Design'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            )}
            
            {checkoutSession.postcards.length > 0 && (
                <div className="text-center border-t pt-6 mt-6">
                    {selectedPostcardId !== null && (
                        <>
                            <div className="mb-4 p-5 bg-gray-50 rounded-lg inline-block w-full max-w-md shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-3">
                                    <p className="text-sm text-gray-600">Shipping to:</p>
                                    {!isEditingAddress ? (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 px-2 text-blue-600 hover:text-blue-800"
                                            onClick={() => setIsEditingAddress(true)}
                                        >
                                            Edit
                                        </Button>
                                    ) : (
                                        <div className="flex space-x-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 px-2 text-gray-600 hover:text-gray-800"
                                                disabled={isAddressLoading}
                                                onClick={() => setIsEditingAddress(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 px-2 text-green-600 hover:text-green-800"
                                                disabled={isAddressLoading}
                                                onClick={async () => {
                                                    try {
                                                        setIsAddressLoading(true);
                                                        await updateShippingAddress({
                                                            name: addressForm.name,
                                                            line1: addressForm.line1,
                                                            line2: addressForm.line2,
                                                            city: addressForm.city,
                                                            postalCode: addressForm.postalCode,
                                                            country: addressForm.country
                                                        });
                                                        await refreshSession();
                                                        setIsEditingAddress(false);
                                                    } catch (error) {
                                                        console.error('Error updating shipping address:', error);
                                                        // Could add error handling UI here
                                                    } finally {
                                                        setIsAddressLoading(false);
                                                    }
                                                }}
                                            >
                                                {isAddressLoading ? (
                                                    <>
                                                        <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : 'Save'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                
                                {!isEditingAddress ? (
                                    <div className="font-medium">{shippingAddress}</div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <Label htmlFor="name" className="text-xs text-gray-500">Full Name</Label>
                                            <Input 
                                                id="name"
                                                value={addressForm.name}
                                                onChange={(e) => setAddressForm({...addressForm, name: e.target.value})}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="line1" className="text-xs text-gray-500">Address Line 1</Label>
                                            <Input 
                                                id="line1"
                                                value={addressForm.line1}
                                                onChange={(e) => setAddressForm({...addressForm, line1: e.target.value})}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="line2" className="text-xs text-gray-500">Address Line 2 (Optional)</Label>
                                            <Input 
                                                id="line2"
                                                value={addressForm.line2}
                                                onChange={(e) => setAddressForm({...addressForm, line2: e.target.value})}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label htmlFor="city" className="text-xs text-gray-500">City</Label>
                                                <Input 
                                                    id="city"
                                                    value={addressForm.city}
                                                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="postalCode" className="text-xs text-gray-500">Postal Code</Label>
                                                <Input 
                                                    id="postalCode"
                                                    value={addressForm.postalCode}
                                                    onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="country" className="text-xs text-gray-500">Country</Label>
                                            <Input 
                                                id="country"
                                                value={addressForm.country}
                                                onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mb-6 max-w-md mx-auto">
                                <Label htmlFor="message" className="mb-2 block text-left">Message for your postcard:</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value.slice(0, 350))}
                                    placeholder="Write a message that will appear on your postcard..."
                                    className="w-full"
                                    rows={3}
                                    maxLength={350}
                                />
                                <div className="flex justify-between mt-1">
                                    <p className="text-sm text-gray-500 text-left">
                                        This message will be printed on the back of your postcard.
                                    </p>
                                    <p className="text-sm text-gray-500 text-right">
                                        {message.length}/350 characters
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="mt-6">
                        {selectedPostcardId === null ? (
                            <div className="bg-amber-50 p-4 rounded-lg mb-4 text-amber-800 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                Please select a postcard above to continue
                            </div>
                        ) : (
                            <div className="bg-green-50 p-4 rounded-lg mb-4 text-green-800 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                Postcard selected! You can now continue
                            </div>
                        )}
                        <Button 
                            onClick={handleSendPostcard} 
                            disabled={selectedPostcardId === null}
                            className={'hover:cursor-pointer w-full md:w-auto px-8'}
                            size="lg"
                            variant={selectedPostcardId === null ? "outline" : "default"}
                        >
                            {selectedPostcardId === null 
                                ? "Choose a postcard first" 
                                : "Continue with selected postcard →"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}