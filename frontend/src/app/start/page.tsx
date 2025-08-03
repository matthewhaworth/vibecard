'use client'

import {useEffect, useState} from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/components/ui/input-otp";
import {getCheckoutSession, getUser, loginWithOtp, requestOtp} from "@/utils/laravel/clientFunctions";

export default function LoginPage() {
    const onRequestOtp = async (email: string) => {
        const response = await requestOtp(email);
        console.log('OTP request response:', response);
    }

    const [email, setEmail] = useState('');

    const [oneTimePassword, setOneTimePassword] = useState("")

    useEffect(() =>  {
        const run = async () => {
            console.log(email, oneTimePassword);
            const response = await loginWithOtp(email, oneTimePassword);
            console.log('Login response:', response);
            const session = await getCheckoutSession();
            console.log('Checkout session:', session);
        }

        if (oneTimePassword.length < 6) {
            return;
        }

        run();
    }, [oneTimePassword]);

    return (
        <form className={'flex flex-col gap-4'}>
            <Label htmlFor="email">Email:</Label>
            <Input id="email" name="email" type="email" value={email} onChange={(email) => setEmail(email.target.value)} required />
            <Label htmlFor="prompt">Prompt:</Label>
            <Input id="prompt" name="prompt" type="text" required />

            <div className="space-y-2">
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
            </div>


            <Button type='button' onClick={() => onRequestOtp(email)}>Log in</Button>
            <Button type='button' onClick={() => getUser()}>Get user</Button>
        </form>
    )
}
