import {createClient} from "@/utils/supabase/server";
import Link from "next/link";

export default async function Home() {
    return <>
        <p>this is the homepage, needs marketing material</p>
        <Link href="/start">Start</Link>
    </>;
}
