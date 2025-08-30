import useSWR from "swr";
import Cookies from "js-cookie";
import useSWRMutation from "swr/mutation";
import {CheckoutSession} from "@/lib/types";

export const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

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

const fetchCheckoutSession = async (url: string): Promise<CheckoutSession|undefined> => {
    const res = await fetch(`${LARAVEL_API_URL}/checkout-session`, {
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

    const { data, error, isLoading, mutate } = useSWR<CheckoutSession | undefined>(
        user ? 'checkout-session' : null,
        fetchCheckoutSession,
        {
            revalidateOnFocus: false,
            refreshInterval: (latestData: CheckoutSession | undefined) => {
                if (!latestData || latestData.postcards.length === 0) {
                    return 0;
                }

                // stop polling if all images a ready
                if (latestData.postcards.every(postcard => postcard.image_url)) {
                    return 0;
                }

                return 1000;
            },

        }
    );

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

export const fetchPaymentIntent = async () => {
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

export const createPostcard = async (prompt: string) => {
    const csrfToken = await csrf();

    const response = await fetch(`${LARAVEL_API_URL || 'http://localhost:8000'}/postcards`, {
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

export const completeOrder = async (sessionId: number, chosenPostcardId: number, message: string) => {
    const csrfToken = await csrf();

    const response = await fetch(`${LARAVEL_API_URL || 'http://localhost:8000'}/checkout-complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'X-XSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            sessionId,
            chosenPostcardId,
            message
        }),
    })

    if (!response.ok) {
        throw new Error('Failed to complete order');
    }

    return await response.json();
}

export const updateShippingAddress = async (addressData: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
}) => {
    const csrfToken = await csrf();

    const response = await fetch(`${LARAVEL_API_URL || 'http://localhost:8000'}/update-shipping-address`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'X-XSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            shipping_name: addressData.name,
            shipping_address_line1: addressData.line1,
            shipping_address_line2: addressData.line2 || '',
            shipping_address_city: addressData.city,
            shipping_address_postal_code: addressData.postalCode,
            shipping_address_country: addressData.country
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to update shipping address');
    }

    return await response.json();
}