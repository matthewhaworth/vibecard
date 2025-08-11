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

        if (!user && window.location.pathname !== '/') {
            // redirect to home if not logged in
            redirect('/');
        }

        if (user && session && session.payment_reference === null) {
            // only redirect if not on the preview page
            if (window.location.pathname !== '/preview') {
                redirect('/preview');
            }
        }



    }, [user, session, isUserLoading, isSessionLoading]);

    if (isUserLoading || isSessionLoading) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}
