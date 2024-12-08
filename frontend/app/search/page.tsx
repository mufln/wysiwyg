
'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
// @ts-ignore
import style from '@edtr-io/mathquill/build/mathquill.css';
import Link from 'next/link'
import { StaticMathField } from 'react-mathquill';
import { Formula, useFormulas } from "@/lib/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EquationEditor from '@/components/EquationEditor';
import { MathJax, MathJaxContext } from "better-react-mathjax";

export function addStyles() {
    if (document.getElementById('react-mathquill-styles') == null) {
        const styleTag = document.createElement('style')
        styleTag.setAttribute('id', 'react-mathquill-styles')
        console.log(style)
        styleTag.innerHTML = style

        const head = document.getElementsByTagName('head')[0]
        head.appendChild(styleTag)
    }
}

function highlightMatches(latex: string, searchLatex: string) {
    const parts = latex.split(new RegExp(`(${searchLatex})`, 'gi'))
    return parts.map((part, index) =>
        part.toLowerCase() === searchLatex.toLowerCase()
            ? <span key={index} className="bg-yellow-200">{part}</span>
            : part
    )
}

function Search() {
    const [searchTerm, setSearchTerm] = useState('')
    const {data: formulas, isLoading, isError} = useFormulas();
    const [filteredFormulas, setFilteredFormulas] = useState<Formula[]>([])
    const [show, setShow] = useState(false)

    useEffect(() => {
        addStyles();
        setShow(true)
    }, [])
    useEffect(() => {
        setFilteredFormulas(
            (formulas ? formulas : []).filter((formula: any) =>
                formula.latex.toLowerCase().replace(" ", "").includes(searchTerm.toLowerCase().replace(" ", ""))
            )
        )
    }, [searchTerm, formulas])

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Formula Search</h1>
            <div className="mb-4 p-4 border rounded">
                {show && <EquationEditor latex={searchTerm} onChange={setSearchTerm}/>}
            </div>
            <ul className="space-y-4">
                {filteredFormulas.map(formula => (
                    <a key={formula.id} href={"/formula/" + formula.id}>
                        <li className="border rounded p-4">
                            <h3 className="font-bold text-lg mb-2">{formula.name}</h3>
                            <div className="mb-2">
                                <MathJax>{'\\begin{align}'+formula.latex+'\\end{align}'}</MathJax>
                            </div>
                            <Link href={formula.source} target="_blank" rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline">
                                Source
                            </Link>
                        </li>
                    </a>
                ))}
            </ul>
        </div>
    )
}

export default function Page() {
    let client = new QueryClient()
    return <QueryClientProvider client={client}>
        <MathJaxContext>
            <Search/>
        </MathJaxContext>
    </QueryClientProvider>
}