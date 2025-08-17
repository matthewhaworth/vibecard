'use client'

import {useEffect, useState} from "react";

const examplePostcards = [
    {
        id: 1,
        image: "/cards/image-1.jpeg",
        title: "Happy Birthday",
        x: 10,
        y: 20,
        rotation: -5,
        scale: 0.8,
    },
    {
        id: 2,
        image: "/cards/image-2.jpeg",
        title: "Happy Father's Day",
        x: 70,
        y: 15,
        rotation: 8,
        scale: 0.9,
    },
    {
        id: 3,
        image: "/cards/image-3.jpeg",
        title: "Congratulations",
        x: 15,
        y: 60,
        rotation: -3,
        scale: 0.7,
    },
    {
        id: 4,
        image: "/cards/image-4.jpeg",
        title: "Happy Anniversary",
        x: 80,
        y: 70,
        rotation: 12,
        scale: 0.85,
    },
    {
        id: 5,
        image: "/cards/image-5.jpeg",
        title: "Thank You",
        x: 45,
        y: 35,
        rotation: -8,
        scale: 0.6,
    },
    {
        id: 6,
        image: "/cards/image-6.jpeg",
        title: "Get Well Soon",
        x: 25,
        y: 80,
        rotation: 15,
        scale: 0.75,
    },
]

export default function ParallaxWrapper({ children }: { children: React.ReactNode }) {
    const [scrollY, setScrollY] = useState(0)

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
            {examplePostcards.map((postcard) => (
                <div
                    key={postcard.id}
                    className="absolute opacity-15 hover:opacity-30 transition-opacity duration-500"
                    style={{
                        left: `${postcard.x}%`,
                        top: `${postcard.y}%`,
                        transform: `
                translate(-50%, -50%) 
                rotate(${postcard.rotation}deg) 
                scale(${postcard.scale})
                translateY(${scrollY * 0.1}px)
              `,
                        transition: "transform 0.1s ease-out",
                    }}
                >
                    <div className="relative">
                        <img
                            src={postcard.image || "/placeholder.svg"}
                            alt={postcard.title}
                            className="w-48 h-32 md:w-60 md:h-40 object-cover rounded-lg shadow-lg border-4 border-white"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
        {children}
    </div>
}