
import './globals.css'
// import { Inter } from 'next/font/google'
import Link from 'next/link'
import {useRouter} from "next/navigation";
import ReactQueryClientProvider from "@/lib/reactQueryClientProvider";

// const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'LaTeX',
    description: 'Редактор формул LaTeX',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body>
        <ReactQueryClientProvider>
            <nav className="bg-gray-800 text-white p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold">Редактор формул LaTeX</Link>
                    <div className="space-x-4">
                        <Link href="/" className="hover:text-gray-300">Главная</Link>
                        <Link href="/editor" className="hover:text-gray-300">Редактор</Link>
                        <Link href="/search" className="hover:text-gray-300">Поиск</Link>
                        <Link href="/parser" className="hover:text-gray-300">Импорт</Link>

                    </div>
                </div>
            </nav>
            <main className="container mx-auto mt-8 px-4">
                {children}
            </main>
        </ReactQueryClientProvider>
        </body>
        </html>
    )
}

