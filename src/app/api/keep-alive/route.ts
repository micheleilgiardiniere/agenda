import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');

        // Verifica il segreto CRON di Vercel (protezione endpoint)
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Usiamo auth client per non doverci basare su ruoli complessi, solo una query semplice
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Effettuiamo una micro-query su una tabella per svegliare Supabase
        const { error } = await supabase.from('clienti').select('id').limit(1);

        if (error) {
            console.error('Errore durante il ping di Supabase:', error);
            return new NextResponse('Error pinging database', { status: 500 });
        }

        return NextResponse.json({ status: 'ok', message: 'Database pinged successfully' });
    } catch (error) {
        console.error('Keep-alive error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
