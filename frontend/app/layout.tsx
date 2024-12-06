import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LaTeX Equation Editor',
  description: 'A LaTeX equation editor with formula search',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">LaTeX Equation Editor</Link>
            <div className="space-x-4">
              <Link href="/" className="hover:text-gray-300">Home</Link>
              <Link href="/editor" className="hover:text-gray-300">Editor</Link>
              <Link href="/search" className="hover:text-gray-300">Search</Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto mt-8 px-4">
          {children}
        </main>
      </body>
    </html>
  )
}

