const SUPABASE_URL = 'https://hkpwuzlcargeokhnqrbo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = window.SUPABASE_ANON_KEY || '';

if (!window.supabase) {
    throw new Error('Supabase JS library لم يتم تحميلها');
}

if (!SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.includes('PASTE_YOUR_')) {
    console.warn('Supabase key is missing. Copy supabase.local.example.js to supabase.local.js and add the public anon/publishable key.');
}

window.marketSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY || 'missing-public-key');
window.localDataFacade = window.marketSupabase;

window.marketAuth = {
    async requireAdmin() {
        const client = requireSupabase();
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) return false;

        const { data: adminUser, error: adminError } = await client
            .from('admin_users')
            .select('user_id, role, is_active')
            .eq('user_id', session.user.id)
            .maybeSingle();
        if (adminError) throw adminError;
        return Boolean(adminUser && adminUser.is_active && ['admin', 'manager'].includes(adminUser.role));
    }
};

function requireSupabase() {
    if (!SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.includes('PASTE_YOUR_')) {
        throw new Error('مفتاح Supabase العام غير مضبوط. أضف المفتاح إلى supabase.local.js');
    }
    return window.marketSupabase;
}

window.marketApi = {
    async getCatalog() {
        const client = requireSupabase();
        const [{ data: categories, error: categoriesError }, { data: products, error: productsError }, { data: settings, error: settingsError }] = await Promise.all([
            client.from('categories').select('*').order('sort_order', { ascending: true }),
            client.from('products').select('*').eq('available', true).order('sort_order', { ascending: true }),
            client.from('store_settings').select('*').eq('id', 1).maybeSingle()
        ]);
        if (categoriesError) throw categoriesError;
        if (productsError) throw productsError;
        if (settingsError) throw settingsError;
        return { categories: categories || [], products: products || [], settings: settings || null };
    },

    async createOrder({ customer_name, phone, address, items, payment_method, notes }) {
        const { data, error } = await requireSupabase().rpc('create_order', {
            p_customer_name: customer_name,
            p_phone: phone,
            p_address: address,
            p_items: items,
            p_payment_method: payment_method || 'cash',
            p_notes: notes || ''
        });
        if (error) throw error;
        return Array.isArray(data) ? data[0] : data;
    },

    async trackOrder(orderCode, phone) {
        const { data, error } = await requireSupabase().rpc('track_order', {
            p_order_code: orderCode,
            p_phone: phone
        });
        if (error) throw error;
        return data || null;
    },

    async getOrders() {
        const client = requireSupabase();
        const { data: orders, error } = await client.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
        if (error) throw error;
        return (orders || []).map((order) => ({ ...order, items: order.order_items || [] }));
    },

    async updateOrderStatus(id, status) {
        const { data, error } = await requireSupabase().rpc('update_order_status', {
            p_order_id: id,
            p_next_status: status
        });
        if (error) throw error;
        return data;
    }
};
