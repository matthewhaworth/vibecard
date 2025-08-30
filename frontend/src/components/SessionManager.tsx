'use client'

import { useEffect } from "react";
import { useAuth, useCheckoutSession } from "@/utils/hooks";
import { redirect } from "next/navigation";

export function SessionManager({ children }: { children: React.ReactNode }) {
    const { user, isLoading: isUserLoading } = useAuth();
    const { session, isLoading: isSessionLoading } = useCheckoutSession();

    useEffect(() => {
        if (isUserLoading || isSessionLoading) {
            return; // Don't run the effect if loading
        }

        if (window.location.pathname === '/payment-response' ||
            window.location.pathname === '/terms' ||
            window.location.pathname === '/privacy'
        ) {
            return;
        }

        if ((!user || !session) && window.location.pathname !== '/') {
            // redirect to home if not logged in
            redirect('/');
        }

        if (user && session && !session.paid) {
            // only redirect if not on the preview page
            if (window.location.pathname !== '/preview') {
                redirect('/preview');
            }
        }

        if (user && session && session.paid) {
            // redirect to checkout if user is logged in and has a session with payment reference
            if (window.location.pathname !== '/generate') {
                redirect('/generate');
            }
        }

    }, [user, session, isUserLoading, isSessionLoading]);

    if (isUserLoading || isSessionLoading) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}
