'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const progetti = [
    {
        id: '1', nome: 'Manutenzione Cond. Aurora', cliente: 'Cond. Aurora',
        importo_preventivo: 12000, ore_previste: 200, ore_spese: 145,
        materiali_budget: 3000, materiali_spesi: 2100, n_interventi: 12,
    },
    {
        id: '2', nome: 'Nuovo giardino Verdi', cliente: 'Luca Verdi',
        importo_preventivo: 8500, ore_previste: 120, ore_spese: 95,
        materiali_budget: 4000, materiali_spesi: 4200, n_interventi: 8,
    },
]

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = Math.min((value / max) * 100, 100)
    const over = value > max
    return (
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', over ? 'bg-red-500' : color)} style={{ width: `${pct}%` }} />
        </div>
    )
}

export default function AnalisiPage() {
    return (
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Analisi Preventivi</h1>
            <p className="text-sm text-muted-foreground">Monitoraggio lavori a forfait — ore e materiali vs budget</p>

            {progetti.map(p => {
                const costSpent = (p.ore_spese * 18) + p.materiali_spesi // avg €18/h
                const margin = p.importo_preventivo - costSpent
                const marginPct = ((margin / p.importo_preventivo) * 100).toFixed(0)
                const isOverBudget = margin < 0

                return (
                    <Card key={p.id} className="border-border/30 bg-card/60">
                        <CardContent className="p-5 space-y-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-lg">{p.nome}</p>
                                    <p className="text-sm text-muted-foreground">{p.cliente} • {p.n_interventi} interventi</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold">€{p.importo_preventivo.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">preventivato</p>
                                </div>
                            </div>

                            {/* Hours */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Ore</span>
                                    <span className="tabular-nums">{p.ore_spese} / {p.ore_previste}h</span>
                                </div>
                                <ProgressBar value={p.ore_spese} max={p.ore_previste} color="bg-primary" />
                            </div>

                            {/* Materials */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>📦 Materiali</span>
                                    <span className="tabular-nums">€{p.materiali_spesi.toLocaleString()} / €{p.materiali_budget.toLocaleString()}</span>
                                </div>
                                <ProgressBar value={p.materiali_spesi} max={p.materiali_budget} color="bg-blue-400" />
                            </div>

                            {/* Margin */}
                            <div className={cn('flex items-center justify-between p-3 rounded-xl', isOverBudget ? 'bg-red-500/10' : 'bg-green-500/10')}>
                                <div className="flex items-center gap-2">
                                    {isOverBudget ? <TrendingDown className="h-5 w-5 text-red-400" /> : <TrendingUp className="h-5 w-5 text-green-400" />}
                                    <span className="text-sm font-medium">Margine stimato</span>
                                </div>
                                <div className="text-right">
                                    <p className={cn('font-bold text-lg', isOverBudget ? 'text-red-400' : 'text-green-400')}>
                                        {isOverBudget ? '' : '+'}€{margin.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{marginPct}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
