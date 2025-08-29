// app/layouts/LegalLayout.tsx
import React from 'react'

interface LegalLayoutProps {
    children: React.ReactNode
    title: string
    lastUpdated?: string
}

export default function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-3xl mx-auto py-12 px-6">
                {/* Page title */}
                <h1 className="text-4xl font-bold mb-2">{title}</h1>

                {/* Last updated badge */}
                {lastUpdated && (
                    <p className="text-sm text-gray-500 mb-6">Last updated: {lastUpdated}</p>
                )}

                {/* Content */}
                <div className="prose prose-sm max-w-none">
                    {children}
                </div>
            </div>
        </div>
    )
}
