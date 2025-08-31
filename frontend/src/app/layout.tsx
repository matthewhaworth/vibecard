import type {Metadata} from "next";
import "./globals.css";
import {SessionManager} from "@/components/SessionManager";
import {Montserrat} from "next/font/google"
import {Open_Sans} from "next/font/google"
import "./globals.css"
import Link from "next/link";
import Script from "next/script";

const montserrat = Montserrat({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-montserrat",
    weight: ["400", "600", "700", "900"],
})

const openSans = Open_Sans({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-open-sans",
    weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
    title: "Vibecard",
    description: "Generate AI postcards",
};

export default function RootLayout({
   children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${montserrat.variable} ${openSans.variable} antialiased bg-gradient-to-b from-gray-50 to-white min-h-screen`}
        >
        <div className={'pt-10 px-4 sm:px-6'}>
            <div className="text-center">
                <Link href={'/'} className="font-serif font-black text-5xl md:text-6xl text-foreground tracking-tight">
                    <img src={'/logo-1.webp'} alt={'Vibecard Logo'} className={'inline w-36 sm:w-40 -mt-2 mr-2 drop-shadow-md'}/>
                </Link>
            </div>

            <SessionManager>
                {children}
            </SessionManager>

            <footer className={'mt-20 mb-12 text-center text-sm text-gray-500'}>
                <Link href={'/privacy'} className="hover:text-gray-700 transition-colors">Privacy Policy</Link> | <Link href={'/terms'} className="hover:text-gray-700 transition-colors">Terms of Service</Link>
            </footer>
        </div>
        </body>
        <Script src="https://scripts.simpleanalyticscdn.com/latest.js"  />

        </html>
    );
}
