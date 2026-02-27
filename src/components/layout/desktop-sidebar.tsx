'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    CalendarDays,
    ClipboardPlus,
    Users,
    UserCog,
    Package,
    FolderKanban,
    Receipt,
    BarChart3,
    ListTodo,
    Sprout,
    FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/', icon: CalendarDays, label: 'Dashboard', section: 'main' },
    { href: '/intervento', icon: ClipboardPlus, label: 'Nuovo Intervento', section: 'main' },
    { href: '/clienti', icon: Users, label: 'Clienti', section: 'anagrafica' },
    { href: '/dipendenti', icon: UserCog, label: 'Dipendenti', section: 'anagrafica' },
    { href: '/catalogo', icon: Package, label: 'Catalogo', section: 'anagrafica' },
    { href: '/progetti', icon: FolderKanban, label: 'Progetti', section: 'anagrafica' },
    { href: '/contabilita', icon: Receipt, label: 'Contabilità', section: 'contabilita' },
    { href: '/fatturazione', icon: FileText, label: 'Fatturazione', section: 'contabilita' },
    { href: '/analisi', icon: BarChart3, label: 'Analisi Preventivi', section: 'contabilita' },
    { href: '/todo', icon: ListTodo, label: 'Lavori Futuri', section: 'main' },
]

const sections = {
    main: 'Operativo',
    anagrafica: 'Anagrafiche',
    contabilita: 'Contabilità',
}

export function DesktopSidebar() {
    const pathname = usePathname()

    const groupedItems = Object.entries(sections).map(([key, label]) => ({
        label,
        items: navItems.filter((item) => item.section === key),
    }))

    return (
        <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                    <Sprout className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">GreenWork</h1>
                    <p className="text-xs text-muted-foreground">Gestionale Giardinaggio</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                {groupedItems.map((group) => (
                    <div key={group.label}>
                        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                            {group.label}
                        </p>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive =
                                    item.href === '/'
                                        ? pathname === '/'
                                        : pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                                            isActive
                                                ? 'bg-primary/15 text-primary'
                                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                                        )}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-sidebar-border">
                <p className="text-xs text-muted-foreground">v1.0 — GreenWork</p>
            </div>
        </aside>
    )
}
