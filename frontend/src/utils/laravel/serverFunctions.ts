import { cookies } from "next/headers";

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000'

const getCookie = async (name: string) => {
    return (await cookies()).get(name)?.value ?? '';
}

export async function getCheckoutSession(userId: string) {
    const res = await fetch(`${LARAVEL_API_URL}/api/checkout-session`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.VIBECARD_API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({userId}),
    })

    if (!res.ok) {
        throw new Error(`Failed to find checkout session.`);
    } else {
        return await res.json();
    }
}

export async function getUser(){
    const laravelSessionCookie = await getCookie('laravel_session');

    const res = await fetch(`${LARAVEL_API_URL}/user`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Cookie: `laravel_session=${laravelSessionCookie};`
        },
    })

    if (!res.ok) {
        console.log('Failed to fetch user:', await res.text());
        throw new Error(`Failed to fetch user: ${await res.text()}`);
    } else {
        return await res.json();
    }
}