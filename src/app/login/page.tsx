'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Leaf, Lock } from 'lucide-react'
import { login } from './actions'

export default function LoginPage() {
    const [pin, setPin] = useState('')
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (pin.length < 4) return

        setError('')
        startTransition(async () => {
            const formData = new FormData()
            formData.append('pin', pin)
            try {
                const result = await login(formData)
                // Se c'è un redirect non arriva qui perché solleva un NEXT_REDIRECT
                if (result?.error) {
                    setError(result.error)
                    setPin('')
                }
            } catch (error) {
                // Ignore redirect trick in Next.js
            }
        })
    }

    const handleKeypad = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num
            setPin(newPin)
            if (newPin.length === 4) {
                // autosubmit
                setTimeout(() => {
                    const form = new FormData()
                    form.append('pin', newPin)
                    startTransition(async () => {
                        try {
                            const res = await login(form)
                            if (res?.error) {
                                setError(res.error)
                                setPin('')
                            }
                        } catch (e) { }
                    })
                }, 100)
            }
        }
    }

    return (
        <div className="min-h-svh flex items-center justify-center p-4 bg-muted/30">
            <Card className="w-full max-w-sm shadow-xl border-0 ring-1 ring-border/5">
                <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center space-y-2 mb-8">
                        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                            <Leaf className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Agenda Papa</h1>
                        <p className="text-sm text-muted-foreground">Inserisci il PIN per accedere</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={pin}
                                    readOnly
                                    className="pl-10 text-center tracking-[1em] font-mono text-lg h-12 rounded-xl"
                                    placeholder="••••"
                                />
                            </div>
                            {error && <p className="text-sm text-destructive text-center font-medium animate-in fade-in slide-in-from-top-1">{error}</p>}
                        </div>

                        {/* Tastierino */}
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                <Button
                                    key={n}
                                    type="button"
                                    variant="outline"
                                    className="h-14 text-xl font-medium rounded-xl drop-shadow-sm touch-target bg-background hover:bg-muted"
                                    onClick={() => handleKeypad(n.toString())}
                                >
                                    {n}
                                </Button>
                            ))}
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-14 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 touch-target"
                                onClick={() => setPin('')}
                            >
                                C
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-14 text-xl font-medium rounded-xl drop-shadow-sm touch-target bg-background hover:bg-muted"
                                onClick={() => handleKeypad('0')}
                            >
                                0
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-14 rounded-xl text-muted-foreground touch-target"
                                onClick={() => setPin(p => p.slice(0, -1))}
                            >
                                ⌫
                            </Button>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl font-semibold text-base mt-2 transition-all"
                            disabled={pin.length < 4 || isPending}
                        >
                            {isPending ? 'Accesso in corso...' : 'Entra'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
