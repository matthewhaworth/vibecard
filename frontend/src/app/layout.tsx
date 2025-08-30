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
            className={`${montserrat.variable} ${openSans.variable} antialiased`}
        >
        <div className={'pt-12'}>
            <div className="text-center mb-8">
                <a href={'/'} className="font-serif font-black text-5xl md:text-6xl text-foreground tracking-tight">
                    <img src={'/logo-1.webp'} alt={'Vibecard Logo'} className={'inline w-48 -mt-2 mr-2'}/>
                </a>
            </div>
            <div className={'max-w-2xl mx-auto mt-12'}>
                <SessionManager>
                    {children}
                </SessionManager>
            </div>

            <footer className={'mt-20 mb-12 text-center text-sm text-gray-500'}>
                <Link href={'/privacy'}>Privacy Policy</Link> | <Link href={'/terms'}>Terms of Service</Link>
            </footer>
        </div>
        </body>
        <Script src="https://scripts.simpleanalyticscdn.com/latest.js"  />

        </html>
    );
}
