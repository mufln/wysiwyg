'use client'

import {useParams} from 'next/navigation'
import Link from 'next/link'
import {useEffect} from 'react'
import {useFormulas} from "@/lib/api";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

function Formula() {
    let {data: formulas} = useFormulas()
    const params = useParams()
    const id = Number(params.id)
    if (formulas == null) {
        formulas = []
    }
    const formula = formulas.find(f => f.id === id)

    useEffect(() => {
        const loadMathJax = async () => {
            const script = document.createElement('script')
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML'
            script.async = true
            await new Promise<Event>((resolve, reject) => {
                script.onload = resolve
                document.body.appendChild(script)
            });
            (window as any).MathJax.Hub.Queue(['Typeset', (window as any).MathJax.Hub])
        }
        loadMathJax()
    }, [])

    if (!formula) {
        return <div>Формула не найдена</div>
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">{formula.name}</h1>
            <div className="mb-4 p-4 border rounded bg-gray-100">
                <div id="formula">{`\\[${formula.latex}\\]`}</div>
            </div>
            <Link href={formula.source} target="_blank" rel="noopener noreferrer"
                  className="text-blue-500 hover:underline">
                Источник
            </Link>
            <div className="mt-8">
                <Link href="/search" className="text-blue-500 hover:underline">
                    Назад к поиску
                </Link>
            </div>
        </div>
    )
}

export default function Page() {
    const client = new QueryClient()
    return <QueryClientProvider client={client}>
        <Formula/>
    </QueryClientProvider>
}

