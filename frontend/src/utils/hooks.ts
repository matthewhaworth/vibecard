import useSWR from "swr";
import Cookies from "js-cookie";
import useSWRMutation from "swr/mutation";

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

const fetchCheckoutSession = async (url: string) => {
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
            return { checkoutSession: undefined };
        }

        throw error
    }

    return {
        checkoutSession: await res.json()
    };
}

export function useCheckoutSession(){
    const {user} = useAuth();

    const { data, error, isLoading, mutate } = useSWR(
        user ? 'checkout-session' : null,
        fetchCheckoutSession,
        { revalidateOnFocus: false }
    );

    return {
        session: data?.checkoutSession,
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