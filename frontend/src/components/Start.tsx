'use client';

import {useState} from "react";
import {useAuth, useCheckoutSession, useCreateCheckoutSession} from "@/utils/hooks";
import {Label} from "@/components/ui/label";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/components/ui/input-otp";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Loader2Icon} from "lucide-react";
import {Textarea} from "@/components/ui/textarea";

export default function Start() {
    const [email, setEmail] = useState('');
    const [prompt, setPrompt] = useState('');

    const [hasRequestedOtp, setHasRequestedOtp] = useState(false);
    const [oneTimePassword, setOneTimePassword] = useState("")

    const { user, loginWithOtp, requestOtp, isLoading: isUserLoading, isError } = useAuth();
    const { session, isLoading: isCustomerSessionLoading } = useCheckoutSession();
    const { trigger } = useCreateCheckoutSession();

    const onRequestOtp = async (email: string) => {
        setHasRequestedOtp(true);
        await requestOtp(email);
    }

    const onContinueLoggedOut = async () => {
        setHasRequestedOtp(false)
        await loginWithOtp(email, oneTimePassword);
        await trigger({prompt})
    }

    if (isUserLoading || isCustomerSessionLoading) {
        return <div>Loading...</div>;
    }

    const onContinueLoggedIn = async () => {
        setHasRequestedOtp(false)
        await trigger({prompt})
    }

    if (isUserLoading || isCustomerSessionLoading) {
        return <div>Loading...</div>;
    }

    return (
        <form className={'flex flex-col gap-5'}>
            <div className="space-y-1.5">
                <h2 className="text-xl font-semibold text-center mb-4">Create Your AI Postcard</h2>
                {!user && <>
                    <Label htmlFor="email" className="text-sm font-medium">Email Address:</Label>
                    <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={email}
                        placeholder="your@email.com"
                        className="transition-all focus:ring-2 focus:ring-blue-100"
                        onChange={(email) => setEmail(email.target.value)} 
                        required 
                    />
                </>}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="prompt" className="text-sm font-medium">Describe Your Postcard:</Label>
                <p className="text-xs text-gray-500 mb-1">Be descriptive about what you'd like to see on your postcard</p>
                <Textarea 
                    id="prompt" 
                    name="prompt" 
                    value={prompt}
                    placeholder="E.g., A serene beach sunset with palm trees and gentle waves..."
                    className="min-h-[100px] transition-all focus:ring-2 focus:ring-blue-100"
                    onChange={(prompt) => setPrompt(prompt.target.value)} 
                    required 
                />
            </div>

            {hasRequestedOtp && <div className="space-y-3 mt-2 p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
                <div className="text-center">
                    <h3 className="text-sm font-medium text-blue-800 mb-1">Verification Code</h3>
                    <p className="text-xs text-blue-600 mb-3">We've sent a 6-digit code to your email</p>
                </div>
                <InputOTP
                    maxLength={6}
                    value={oneTimePassword}
                    onChange={(value) => setOneTimePassword(value)}
                    className="justify-center"
                >
                    <InputOTPGroup className={'mx-auto'}>
                        <InputOTPSlot index={0} className="transition-all border-gray-300 focus:border-blue-500" />
                        <InputOTPSlot index={1} className="transition-all border-gray-300 focus:border-blue-500" />
                        <InputOTPSlot index={2} className="transition-all border-gray-300 focus:border-blue-500" />
                        <InputOTPSlot index={3} className="transition-all border-gray-300 focus:border-blue-500" />
                        <InputOTPSlot index={4} className="transition-all border-gray-300 focus:border-blue-500" />
                        <InputOTPSlot index={5} className="transition-all border-gray-300 focus:border-blue-500" />
                    </InputOTPGroup>
                </InputOTP>
            </div>}

            <div className="mt-4">
                {(!hasRequestedOtp && !user) && <Button
                    className="w-full py-5 text-base font-medium transition-transform hover:cursor-pointer"
                    type='button'
                    disabled={(!user && !email.trim()) || !prompt.trim() || isUserLoading || isCustomerSessionLoading}
                    onClick={() => onRequestOtp(email)}>
                    {(isUserLoading || isCustomerSessionLoading) ?
                        <><Loader2Icon className="animate-spin mr-2" /> Please wait</> : 'Continue'}
                </Button>}

                {(hasRequestedOtp || user) && <Button
                    className="w-full py-5 text-base font-medium transition-transform hover:cursor-pointer"
                    type='button'
                    disabled={isUserLoading || isCustomerSessionLoading || (!user && oneTimePassword.length !== 6)}
                    onClick={user ? () => onContinueLoggedIn() : () => onContinueLoggedOut()}>
                    {(isUserLoading || isCustomerSessionLoading) ?
                        <><Loader2Icon className="animate-spin mr-2" /> Please wait</> : user ? 'Create My Postcard' : 'Verify & Continue'}
                </Button>}
            </div>
        </form>
    )
}