'use client'

import React, {useState, useEffect} from 'react'
import dynamic from 'next/dynamic'
// @ts-ignore
import style from '@edtr-io/mathquill/build/mathquill.css';
import {Button} from "@/components/ui/button";
import {useCreateFormula} from "@/lib/api";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useRouter} from "next/navigation";
import Keyboard from "@/app/editor/keyboard/kb";
import MathKeyboard from "@/app/editor/keyboard/MathKeyboard";


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
    const [latex, setLatex] = useState('')
    const [name, setName] = useState('')
    const [source, setSource] = useState('')
    let createFormula = useCreateFormula();
    useEffect(() => addStyles())

    const handleInsert = (value: string) => {
        setLatex((prev) => prev + value);
    };

    return (
        <div className=" flex flex-col justify-center">
            <div className="relative py-3 w-full">
                <div className="mx-auto">
                    <div>
                        <h1 className="text-2xl font-semibold">Редактор Формул</h1>
                    </div>
                    <div className="flex flex-row gap-2 pt-2 items-center">
                        <Input onChange={(e) => setName(e.target.value)} value={name} placeholder="Имя формулы"/>
                        <Input onChange={(e) => setSource(e.target.value)} value={source} placeholder="Источник"/>
                    </div>
                    <div className="divide-y divide-gray-200">
                        <div className="py-6 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                            <p>Введите математическое выражение:</p>
                            <div className="relative pt-2z">
                                <EquationEditor latex={latex} onChange={setLatex}/>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <MathKeyboard onInsert={handleInsert}/>
        </div>
    );
}

export default function Page() {
    const client = new QueryClient()
    return <QueryClientProvider client={client}>
        <Editor/>
    </QueryClientProvider>
}
