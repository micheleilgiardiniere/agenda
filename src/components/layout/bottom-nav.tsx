'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    CalendarDays,
    ClipboardPlus,
    Users,
    Receipt,
    Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from '@/components/ui/sheet'
import {
    FolderKanban,
    UserCog,
    Package,
    BarChart3,
    ListTodo,
    FileText,
} from 'lucide-react'

const mainNavItems = [
    { href: '/', icon: CalendarDays, label: 'Home' },
    { href: '/intervento', icon: ClipboardPlus, label: 'Nuovo' },
    { href: '/clienti', icon: Users, label: 'Clienti' },
    { href: '/contabilita', icon: Receipt, label: 'Conti' },
]

const menuItems = [
    { href: '/', icon: CalendarDays, label: 'Dashboard' },
    { href: '/intervento', icon: ClipboardPlus, label: 'Nuovo Intervento' },
    { href: '/clienti', icon: Users, label: 'Clienti' },
    { href: '/dipendenti', icon: UserCog, label: 'Dipendenti' },
    { href: '/catalogo', icon: Package, label: 'Catalogo' },
    { href: '/progetti', icon: FolderKanban, label: 'Progetti' },
    { href: '/contabilita', icon: Receipt, label: 'Contabilità' },
    { href: '/fatturazione', icon: FileText, label: 'Fatturazione' },
    { href: '/analisi', icon: BarChart3, label: 'Analisi Preventivi' },
    { href: '/todo', icon: ListTodo, label: 'Lavori Futuri' },
]

export function BottomNav() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-xl pb-safe md:hidden">
            <div className="flex items-center justify-around px-2">
                {mainNavItems.map((item) => {
                    const isActive =
                        item.href === '/'
                            ? pathname === '/'
                            : pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center gap-0.5 py-2 px-3 touch-target transition-colors',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <item.icon className="h-6 w-6" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}

                {/* More menu */}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <button className="flex flex-col items-center gap-0.5 py-2 px-3 touch-target text-muted-foreground hover:text-foreground transition-colors">
                            <Menu className="h-6 w-6" />
                            <span className="text-[10px] font-medium">Altro</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
                        <SheetTitle className="sr-only">Menu navigazione</SheetTitle>
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            {menuItems.map((item) => {
                                const isActive =
                                    item.href === '/'
                                        ? pathname === '/'
                                        : pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            'flex flex-col items-center gap-2 rounded-xl p-4 transition-all active:scale-95',
                                            isActive
                                                ? 'bg-primary/15 text-primary'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        )}
                                    >
                                        <item.icon className="h-7 w-7" />
                                        <span className="text-xs font-medium text-center leading-tight">
                                            {item.label}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    )
}
