'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isToday, addMonths, subMonths, getDay,
} from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ClipboardPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getInterventiFuturo, getTodos } from '@/lib/supabase/queries'
import type { Priorita } from '@/types/database'

const priorityColors: Record<Priorita, string> = {
  urgente: 'bg-red-100 text-red-700 border-red-200',
  alta: 'bg-orange-100 text-orange-700 border-orange-200',
  media: 'bg-blue-100 text-blue-700 border-blue-200',
  bassa: 'bg-zinc-100 text-zinc-600 border-zinc-200',
}

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [todos, setTodos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const start = format(subMonths(startOfMonth(currentMonth), 1), 'yyyy-MM-dd')
      const end = format(addMonths(endOfMonth(currentMonth), 1), 'yyyy-MM-dd')
      const [interventi, todoData] = await Promise.all([getInterventiFuturo(start, end), getTodos()])
      setEvents(interventi)
      setTodos(todoData.filter((t: any) => !t.completato).slice(0, 5))
    } catch { toast.error('Errore caricamento') }
    finally { setLoading(false) }
  }, [currentMonth])

  useEffect(() => { loadData() }, [loadData])

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const monthDays = eachDayOfInterval({ start, end })
    const firstDayIndex = (getDay(start) + 6) % 7
    const padDays = Array.from({ length: firstDayIndex }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() - (firstDayIndex - i)); return d
    })
    return [...padDays, ...monthDays]
  }, [currentMonth])

  const eventsForDate = (date: Date) => events.filter(e => e.data === format(date, 'yyyy-MM-dd'))

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE d MMMM yyyy", { locale: it })}</p>
        </div>
        <Link href="/intervento"><Button size="lg" className="touch-target gap-2 rounded-xl font-semibold shadow-lg shadow-primary/25"><ClipboardPlus className="h-5 w-5" /><span className="hidden sm:inline">Nuovo Intervento</span><span className="sm:hidden">Nuovo</span></Button></Link>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="touch-target flex items-center justify-center rounded-lg hover:bg-muted"><ChevronLeft className="h-5 w-5" /></button>
            <h2 className="text-lg font-semibold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: it })}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="touch-target flex items-center justify-center rounded-lg hover:bg-muted"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-7 mb-2">{['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const dayEvents = eventsForDate(day)
              const isSelected = isSameDay(day, selectedDate)
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              return (
                <button key={i} onClick={() => setSelectedDate(day)} className={cn('relative flex flex-col items-center rounded-lg p-1.5 md:p-2 min-h-[48px] md:min-h-[64px] transition-all', isSelected && 'bg-primary/15 ring-1 ring-primary/50', isToday(day) && !isSelected && 'bg-muted', !isCurrentMonth && 'opacity-30', 'hover:bg-muted/60')}>
                  <span className={cn('text-sm font-medium', isToday(day) && 'text-primary font-bold', isSelected && 'text-primary')}>{format(day, 'd')}</span>
                  {dayEvents.length > 0 && <div className="flex gap-0.5 mt-1">{dayEvents.slice(0, 3).map((e, ei) => <div key={ei} className={cn('h-1.5 w-1.5 rounded-full', e.progetti?.tipologia === 'preventivo' ? 'bg-blue-500' : 'bg-primary')} />)}</div>}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{isToday(selectedDate) ? 'Oggi' : format(selectedDate, "EEEE d MMMM", { locale: it })}</h3>
        <div className="space-y-2">
          {eventsForDate(selectedDate).length === 0 ? (
            <Card className="border-dashed shadow-sm"><CardContent className="p-6 text-center text-muted-foreground"><p>Nessun intervento</p><Link href="/intervento" className="text-primary text-sm mt-1 inline-block">+ Aggiungi intervento</Link></CardContent></Card>
          ) : eventsForDate(selectedDate).map((event, i) => (
            <Card key={i} className="shadow-sm hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('h-10 w-1 rounded-full shrink-0', event.progetti?.tipologia === 'preventivo' ? 'bg-blue-500' : 'bg-primary')} />
                <div className="flex-1 min-w-0"><p className="font-medium truncate">{event.progetti?.nome || '—'}</p><p className="text-xs text-muted-foreground">{event.progetti?.clienti?.nome || ''}</p></div>
                <Badge variant="outline" className={cn('text-xs capitalize shrink-0', event.progetti?.tipologia === 'preventivo' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200')}>{event.progetti?.tipologia || '—'}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {todos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Lavori Futuri</h3>
            <Link href="/todo"><Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Vedi tutti →</Button></Link>
          </div>
          <div className="space-y-2">
            {todos.map((todo: any) => (
              <Card key={todo.id} className="shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <Badge variant="outline" className={cn('text-[10px] shrink-0 capitalize', priorityColors[todo.priorita as Priorita])}>{todo.priorita}</Badge>
                  <span className="text-sm font-medium flex-1 truncate">{todo.titolo}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
