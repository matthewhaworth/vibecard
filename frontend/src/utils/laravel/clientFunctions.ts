import Cookies from "js-cookie";

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000'

export async function csrf() {
    // Get CSRF cookie first
    await fetch(`${LARAVEL_API_URL}/sanctum/csrf-cookie`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });

    return decodeURIComponent(Cookies.get('XSRF-TOKEN') || '');
}

export async function loginWithOtp(email: string, code: string) {
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
}

export async function requestOtp(email: string) {
    // Get CSRF cookie first
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

    return {
        message: 'OTP sent successfully. Please check your email.',
    }
}

export async function getCheckoutSession() {
    // Get CSRF cookie first
    const csrfToken = await csrf();

    const res = await fetch(`${LARAVEL_API_URL}/checkout-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': csrfToken,
        },
    })

    if (!res.ok) {
        console.error('Get checkout session failed:', await res.text())
    } else {
        const session = await res.json();
        console.log('Checkout session data:', session);
    }
}

export async function getUser(){
    // Get CSRF cookie first
    const csrfToken = await csrf();

    const res = await fetch(`${LARAVEL_API_URL}/user`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': csrfToken
        },
    })

    if (!res.ok) {
        console.error('Get user failed:', await res.text())
    } else {
        const user = await res.json();
        console.log('User data:', user);
    }
}