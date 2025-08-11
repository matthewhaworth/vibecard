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

    const onContinue = async () => {
        setHasRequestedOtp(false)
        await loginWithOtp(email, oneTimePassword);
        await trigger({prompt})
    }

    if (isUserLoading || isCustomerSessionLoading) {
        console.log('loading', isUserLoading, 'error', isError);
        return <div>Loading...</div>;
    }

    return (
        <form className={'flex flex-col gap-4'}>
            {!user && <>
                <Label htmlFor="email">Email:</Label>
                <Input id="email" name="email" type="email" value={email}
                       onChange={(email) => setEmail(email.target.value)} required />
            </>}

            <Label htmlFor="prompt">Prompt:</Label>
            <Textarea id="prompt" name="prompt" value={prompt}
                   onChange={(prompt) => setPrompt(prompt.target.value)} required />

            {hasRequestedOtp && <div className="space-y-2">
                <InputOTP
                    maxLength={6}
                    value={oneTimePassword}
                    onChange={(value) => setOneTimePassword(value)}
                >
                    <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                    </InputOTPGroup>
                </InputOTP>
                <div className="text-center text-sm">
                    {oneTimePassword === "" ? (
                        <>Enter your one-time password.</>
                    ) : (
                        <>You entered: {oneTimePassword}</>
                    )}
                </div>
            </div>}

            {!hasRequestedOtp && <Button
                className={'hover:cursor-pointer'}
                type='button'
                disabled={(!user && !email.trim()) || !prompt.trim() || isUserLoading || isCustomerSessionLoading}
                onClick={() => onRequestOtp(email)}>
                {(isUserLoading || isCustomerSessionLoading) ?
                    <><Loader2Icon className="animate-spin" /> Please wait</> : 'Continue'}
            </Button>}

            {hasRequestedOtp && <Button
                className={'hover:cursor-pointer'}
                type='button'
                disabled={isUserLoading || isCustomerSessionLoading || oneTimePassword.length !== 6}
                onClick={() => onContinue()}>
                {(isUserLoading || isCustomerSessionLoading) ?
                    <><Loader2Icon className="animate-spin" /> Please wait</> : 'Login'}
            </Button>}

            <Button type={'button'} onClick={() => console.log(user)}>
                Get User
            </Button>
        </form>
    )
}