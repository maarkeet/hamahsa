const SUPABASE_URL = 'https://wqzllkstcbpgvnlnkurd.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lmGYpaESsmAKWsspDyRwGQ_jrneV3U4';

if (!window.supabase) {
    throw new Error('Supabase JS library لم يتم تحميلها');
}

window.marketSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log('Supabase initialized successfully');
