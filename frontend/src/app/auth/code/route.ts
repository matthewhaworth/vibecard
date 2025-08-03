import { type NextRequest } from 'next/server'

import { redirect } from 'next/navigation'
import {createClient} from "@/utils/supabase/server";
import {User} from "@supabase/auth-js";
import {SupabaseClient} from "@supabase/supabase-js";

const handleNextAction = async (user: User) => {
    const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .single();

    console.log({
        sessionData,
        sessionError,
    });

    // has session
    if (sessionData) {
        // @todo queue prompt
        redirect('/checkout/preview');
    } else {
        console.log('no session found for user', user.id);

        const { data: sessionData, error: sessionError } = await supabase
            .from('sessions')
            .insert({ user_id: user.id })
            .select();

        console.log({
            sessionData,
            sessionError
        });

        // @todo queue prompt

        redirect('/checkout/preview');
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    if (!code) {
        // if no code is provided, redirect to an error page
        redirect('/error')
        return;
    }

    const supabase = await createClient()
    const session = await supabase.auth.exchangeCodeForSession(code);

    if (session.error) {
        redirect('/error')
    }

    await handleNextAction(supabase, session.data.user);

    redirect('/private');
}