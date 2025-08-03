import { NextResponse, type NextRequest } from 'next/server'
import {getCheckoutSession, getUser} from "@/utils/laravel/serverFunctions";

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({ request })

    const isProtectedRoute = request.nextUrl.pathname.startsWith('/checkout/')

    try {
        const user = await getUser();

        const checkoutSession = await getCheckoutSession(user.id);

        console.log('User data:', user);
        console.log('Checkout session data:', checkoutSession);
    } catch (error) {
        if (isProtectedRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/start'
            return NextResponse.redirect(url)
        }
    }

    return response;
}
