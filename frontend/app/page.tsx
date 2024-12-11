import Link from 'next/link'

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <h1 className="text-4xl font-bold mb-8">Добро пожаловать в редактор уравнений LaTeX!</h1>
            <div className="space-y-4">
                <Link href="/editor"
                      className="block px-6 py-3 bg-blue-500 text-white rounded-lg text-center hover:bg-blue-600 transition-colors">
                    Перейти в редактор
                </Link>
                <Link href="/search"
                      className="block px-6 py-3 bg-green-500 text-white rounded-lg text-center hover:bg-green-600 transition-colors">
                    Поиск формул
                </Link>
                <Link href="/parser"
                      className="block px-6 py-3 bg-violet-500 text-white rounded-lg text-center hover:bg-violet-600 transition-colors">
                    Импорт из  pdf
                </Link>
                <Link href="/assistant"
                      className="block px-6 py-3 bg-zinc-500 text-white rounded-lg text-center hover:bg-zinc-600 transition-colors">
                    Ассистент
                </Link>
            </div>
        </div>
    )
}

