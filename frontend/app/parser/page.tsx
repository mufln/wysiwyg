'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileText, Upload, AlertCircle } from 'lucide-react'

export default function PDFImportPage() {
    const [file, setFile] = useState<File | null>(null)

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: ['parsePDF'],
        queryFn: async () => {
            if (!file) throw new Error('No file selected')

            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/parse_pdf', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error('Failed to parse PDF')
            }

            return response.json()
        },
        enabled: false, // Don't run the query automatically
    })

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]
        setFile(selectedFile || null)
    }

    const handleUpload = () => {
        if (file) {
            refetch()
        }
    }

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Импорировать формулы из PDF</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                        <Input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="flex-grow"
                        />
                        <Button onClick={handleUpload} disabled={!file || isLoading}>
                            {isLoading ? 'Uploading...' : 'Upload'}
                            <Upload className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    {isLoading && (
                        <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertTitle>Processing</AlertTitle>
                            <AlertDescription>
                                Файл обрабатывается, пожалуйста, подождите...
                            </AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {error instanceof Error ? error.message : 'An unknown error occurred'}
                            </AlertDescription>
                        </Alert>
                    )}

                    {data && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">Parsed Content:</h3>
                            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
                {JSON.stringify(data, null, 2)}
              </pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

