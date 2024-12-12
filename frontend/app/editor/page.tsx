'use client'

import React, {useState, useEffect, useRef} from 'react'
import dynamic from 'next/dynamic'
// @ts-ignore
import style from '@edtr-io/mathquill/build/mathquill.css';
import {useCreateFormula} from "@/lib/api";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {Input} from "@/components/ui/input";
import {useRouter} from "next/navigation";
import MathKeyboard from "@/app/editor/keyboard/MathKeyboard";
import {Button} from "@/components/ui/button";
import html2canvas from 'html2canvas';

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
    const [latex, setLatex] = useState('f(x) = a')
    const [name, setName] = useState('')
    const [source, setSource] = useState('')
    const [description, setDescription] = useState('')
    let createFormula = useCreateFormula();
    useEffect(() => addStyles())
    const mathRef = useRef<HTMLDivElement>(null);
    const handleInsert = (value: string) => {
        setLatex((prev) => prev + value);
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/export_png`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ latex: latex }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при экспорте изображения');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'math-expression.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при экспорте изображения. Пожалуйста, попробуйте еще раз.');
        }
    };
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parse_screenshot`, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Ошибка при обработке изображения');
                }

                const data = await response.json();
                setLatex(data);
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при обработке изображения. Пожалуйста, попробуйте еще раз.');
            }
        }
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
                            <div ref={mathRef} className="relative pt-2z">
                                <EquationEditor latex={latex} onChange={setLatex}/>
                            </div>
                            <textarea style={{resize: 'none'}} className="w-full h-16 p-2 text-sm border rounded"
                                      placeholder="Описание формулы"
                                      onChange={(e) => setDescription(e.target.value)}/>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button className="bg-gray-800 text-white hover:bg-gray-700"
                                onClick={async () => {
                                    await createFormula.mutateAsync({
                                        name,
                                        latex,
                                        source,
                                        description
                                    });
                                    router.push("/search")
                                }}>
                            Сохранить формулу в базу
                        </Button>
                        <Button onClick={handleDownload} className="bg-gray-800 text-white hover:bg-gray-700">
                            Скачать как PNG
                        </Button>
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
