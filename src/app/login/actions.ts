'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const pin = formData.get('pin') as string

    if (pin === '2580') {
        const cookieStore = await cookies()
        cookieStore.set('auth_pin', pin, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        })
        redirect('/')
    }

    return { error: 'PIN errato' }
}
