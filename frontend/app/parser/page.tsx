'use client'

import {useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {FileText, Upload, AlertCircle, Info} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link";

interface JobStatus {
    id: number,
    status: "pnd" | "prc" | "suc" | "err"
}

function nameFromShorthand(s: "pnd" | "prc" | "suc" | "err"): string {
    switch (s) {
        case "pnd":
            return "Ожидание очереди"
        case "prc":
            return "В обработке"
        case "suc":
            return "Обработано успешно"
        case "err":
            return "Во время обработки произошла ошибка"
        default:
            return "Неизвестное состояние";
    }
}

export default function PDFImportPage() {
    const [file, setFile] = useState<File | null>(null)
    const [url, setUrl] = useState<string>('')
    const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload')

    const {data, error, isLoading, refetch} = useQuery({
        queryKey: ['parsePDF'],
        queryFn: async () => {
            let fileToSend: File | null = file;

            if (activeTab === 'link') {
                if (!url) throw new Error('No URL provided')

                // Fetch the file from the URL
                const response = await fetch(url)
                const blob = await response.blob()
                fileToSend = new File([blob], 'file', { type: 'application/pdf' })
            } else if (!fileToSend) {
                throw new Error('Файл не выбран')
            }

            const formData = new FormData()
            formData.append('file', fileToSend)

            const response = await fetch('/api/parse_pdf', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error('Не удалось обработать PDF')
            }

            return await response.json() as JobStatus
        },
        enabled: false, // Don't run the query automatically
    })

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]
        setFile(selectedFile || null)
    }

    const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value)
    }

    const handleUpload = () => {
        refetch()
    }

    return (
        <div className="container mx-auto w-[640px] p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Обработка PDF</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'upload' | 'link')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload">Загрузить файл</TabsTrigger>
                            <TabsTrigger value="link">Указать ссылку</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload">
                            <Input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="mb-4"
                            />
                        </TabsContent>
                        <TabsContent value="link">
                            <Input
                                type="url"
                                placeholder="Укажите адрес"
                                value={url}
                                onChange={handleUrlChange}
                                className="mb-4"
                            />
                        </TabsContent>
                    </Tabs>

                    <Button onClick={handleUpload} disabled={isLoading || (activeTab === 'upload' ? !file : !url)}>
                        {isLoading ? 'Обработка...' : 'Импортировать файл'}
                        {activeTab === 'upload' ? <Upload className="ml-2 h-4 w-4" /> : <Link href={"#"} className="ml-2 h-4 w-4" />}
                    </Button>

                    {isLoading && (
                        <Alert className="mt-4">
                            <FileText className="h-4 w-4" />
                            <AlertTitle>Обработка</AlertTitle>
                            <AlertDescription>
                                Файл обрабатывается, подождите...
                            </AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4"/>
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {error.message ?? 'Неизветсная ошибка'}
                            </AlertDescription>
                        </Alert>
                    )}

                    {data && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">Задача была успешно добавлена в очередь!</h3>
                            <Card className="flex flex-row items-center justify-between h-full bg-red p-4">
                                <div className="flex gap-1 text-xl">
                                    <span className="text-gray-300">ID</span>
                                    <span className="">{data.id}</span>
                                </div>
                                <span>{nameFromShorthand(data.status)}</span>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

