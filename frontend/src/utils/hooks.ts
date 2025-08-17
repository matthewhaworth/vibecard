import useSWR from "swr";
import Cookies from "js-cookie";
import useSWRMutation from "swr/mutation";
import {CheckoutSession} from "@/lib/types";

export const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000'

const fetchUser = async (url: string) => {
    const res = await fetch(`${LARAVEL_API_URL}/${url}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        }
    });

    if (!res.ok) {
        const error: any = new Error('An error occurred while fetching the data.')
        // Attach extra info to the error object.
        error.info = await res.json()
        error.status = res.status
        if (res.status === 401) {
            return { user: undefined };
        }

        throw error
    }

    return {
        user: await res.json()
    };
}

const csrf = async () => {
    // Get CSRF cookie first
    await fetch(`${LARAVEL_API_URL}/sanctum/csrf-cookie`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    return decodeURIComponent(Cookies.get('XSRF-TOKEN') || '');
}

export function useAuth() {
    const { data, error, isLoading, mutate } = useSWR(`user`, fetchUser, {
        revalidateOnFocus: false,
    });

    const loginWithOtp = async (email: string, code: string) => {
        const csrfToken = await csrf();

        const res = await fetch(`${LARAVEL_API_URL}/otp-login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({ email, code }),
        })

        if (!res.ok) {
            console.error('OTP login failed:', await res.text())
        }

        mutate();
    }

    const requestOtp = async (email: string) => {
        const csrfToken = await csrf();

        const res = await fetch(`${LARAVEL_API_URL}/otp-request`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-XSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({ email }),
        })

        if (!res.ok) {
            console.error('OTP request failed:', await res.text())
        }
    }

    return {
        user: data?.user,
        loginWithOtp,
        requestOtp,
        isLoading,
        isError: error
    }
}

const fetchCheckoutSession = async (url: string): Promise<CheckoutSession> => {
    const res = await fetch(`${LARAVEL_API_URL}/${url}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        }
    });

    if (!res.ok) {
        const error: any = new Error('An error occurred while fetching the data.')
        // Attach extra info to the error object.
        error.info = await res.json()
        error.status = res.status
        if (res.status === 401) {
            return undefined;
        }

        throw error
    }

    return await res.json();
}

export function useCheckoutSession(){
    const {user} = useAuth();

    console.log('user', user);
    const { data, error, isLoading, mutate } = useSWR<CheckoutSession | undefined>(
        user ? 'checkout-session' : null,
        fetchCheckoutSession,
        {
            revalidateOnFocus: false,
            refreshInterval: (latestData: CheckoutSession | undefined) => {
                if (!latestData) {
                    console.log('No user or session data available, stopping polling');
                    return 0;
                }

                if (latestData.postcards.length === 0) {
                    console.log('No postcards in session, stopping polling');
                    return 0;
                }

                // stop polling if all images a ready
                if (latestData.postcards.every(postcard => postcard.image_url)) {
                    console.log('All postcards are ready, stopping polling');
                    return 0;
                }

                console.log('Polling for checkout session updates');
                return 3000;
            },

        }
    );
    console.log('checkout', data);

    return {
        session: data,
        isLoading,
        isError: error,
        mutate
    }
}

const fetchPost = async (url: string, { arg }: { arg: {prompt: string} }) => {
    const csrfToken = await csrf();
    const res = await fetch(`${LARAVEL_API_URL}/${url}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': csrfToken
        },
        method: 'POST',
        body: JSON.stringify(arg),
    });

    if (!res.ok) throw new Error('Failed to create or fetch session');
    return res.json();
}

export const useCreateCheckoutSession = () => {
    const { data, error, trigger, isMutating } = useSWRMutation(
        'checkout-session',
        fetchPost
    );

    return {
        session: data,
        isError: error,
        trigger,
        isMutating,
    }
}

const fetchPaymentIntent = async () => {
    const csrfToken = await csrf();
    const res = await fetch(`${LARAVEL_API_URL}/payment-intent`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': csrfToken
        },
        method: 'POST',
        body: JSON.stringify({}),
    });

    if (!res.ok) {
        const error: any = new Error('Failed to create payment intent')
        error.info = await res.json()
        error.status = res.status
        throw error
    }

    return res.json();
}

export const usePaymentIntent = () => {
    const { user } = useAuth();
    const { session } = useCheckoutSession();
    
    const { data, error, isLoading, mutate } = useSWR(
        user && session ? 'payment-intent' : null,
        () => fetchPaymentIntent(),
        { revalidateOnFocus: false }
    );

    return {
        clientSecret: data?.clientSecret,
        isLoading,
        isError: error,
        mutate
    }
}

export const createPostcard = async (prompt: string) => {
    const csrfToken = await csrf();

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/postcards`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'X-XSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    })

    return await response.json();
}

export const completeOrder = async (sessionId: number, chosenPostcardId: number) => {
    const csrfToken = await csrf();

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/checkout-complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'X-XSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            sessionId,
            chosenPostcardId
        }),
    })

    if (!response.ok) {
        throw new Error('Failed to complete order');
    }

    return await response.json();
}