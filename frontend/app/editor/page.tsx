'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
// @ts-ignore
import style from '@edtr-io/mathquill/build/mathquill.css';
import { Button } from "@/components/ui/button";
import { useCreateFormula } from "@/lib/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";


function addStyles() {
    if (document.getElementById('react-mathquill-styles') == null) {
        const styleTag = document.createElement('style')
        styleTag.setAttribute('id', 'react-mathquill-styles')
        console.log(style)
        styleTag.innerHTML = style

        const head = document.getElementsByTagName('head')[0]
        head.appendChild(styleTag)
    }
}


const EquationEditor = dynamic(() => import('@/components/EquationEditor'), {ssr: false})

function Editor() {
    const router = useRouter()
    const [latex, setLatex] = useState('f(x) = \\int_{-\\infty}^\\infty \\hat f(\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi')
    const [name, setName] = useState('')
    const [source, setSource] = useState('')
    let createFormula = useCreateFormula();
    useEffect(() => addStyles())
    return (
        <div className="flex flex-col justify-between gap-2">
            <Label>
                Имя формулы
            </Label>
            <Input onChange={(e) => setName(e.target.value)} value={name}/>
            <Label>Формула</Label>
            <div className="mb-4 p-4 border rounded">
                <EquationEditor latex={latex} onChange={setLatex}/>
            </div>
            <Label>Источник</Label>
            <Input onChange={(e) => setSource(e.target.value)} value={source}/>
            <Button onClick={async () => {
                await createFormula.mutateAsync({
                    name,
                    latex,
                    source
                });
                router.push("/search")
            }}>
                Добавить
            </Button>
        </div>
    )
}

export default function Page() {
    const client = new QueryClient()
    return <QueryClientProvider client={client}>
        <Editor />
    </QueryClientProvider>
}
