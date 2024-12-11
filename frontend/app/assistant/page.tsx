'use client'

import {useState, useRef, useEffect} from 'react'
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"

type Message = {
    role: 'assistant' | 'user'
    content: string
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMessage: Message = {role: 'user', content: input}
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([...messages, userMessage]),
            })

            if (!response.ok) {
                throw new Error('Не удалось получить ответ')
            }

            const data = await response.json()
            const assistantMessage: Message = {role: 'assistant', content: data}
            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            console.error('Ошибка:', error)
            // Можно добавить обработку ошибок, например, показать уведомление пользователю
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="h-[730px] flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Чат с ИИ</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden">
                    <div className="h-full overflow-y-auto pr-4 flex flex-col"
                         style={{maxHeight: 'calc(100vh - 200px)'}}>
                        {messages.reduce((acc: any, message, index) => {
                            if (message.role === 'user') {
                                acc.push(
                                    <div key={`user-${index}`} className="flex justify-end mb-2">
                                        <div className="rounded-lg p-2 max-w-xs bg-blue-500 text-white">
                                            {message.content}
                                        </div>
                                    </div>
                                );
                                if (index + 1 < messages.length && messages[index + 1].role === 'assistant') {
                                    acc.push(
                                        <div key={`assistant-${index + 1}`} className="flex justify-start mb-4">
                                            <div className="rounded-lg p-2 max-w-xs bg-gray-200">
                                                {messages[index + 1].content}
                                            </div>
                                        </div>
                                    );
                                }
                            }
                            return acc;
                        }, [])}
                        <div ref={messagesEndRef}/>
                    </div>
                </CardContent>
                <CardFooter>
                    <form onSubmit={sendMessage} className="flex w-full space-x-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Введите ваше сообщение..."
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Отправка...' : 'Отправить'}
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}

