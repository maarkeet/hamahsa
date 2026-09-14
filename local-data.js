(function () {
    const STORAGE_KEY = 'al_saada_local_db_v1';
    const ORDER_STATUS_OPTIONS = ['new', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    const ORDER_STATUS_TRANSITIONS = {
        new: ['confirmed', 'cancelled'],
        confirmed: ['preparing', 'cancelled'],
        preparing: ['ready'],
        ready: ['out_for_delivery'],
        out_for_delivery: ['delivered'],
        delivered: [],
        cancelled: []
    };

    function isValidStatusTransition(currentStatus, nextStatus) {
        if (!currentStatus || !nextStatus) return false;
        if (String(currentStatus) === String(nextStatus)) return false;
        if (!ORDER_STATUS_OPTIONS.includes(currentStatus) || !ORDER_STATUS_OPTIONS.includes(nextStatus)) return false;
        if (currentStatus === 'delivered' || currentStatus === 'cancelled') return false;
        const allowed = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
        return allowed.includes(nextStatus);
    }

    const DEFAULT_STORE_SETTINGS = [
        {
            id: 1,
            name: 'Ø³ÙˆØ¨Ø± Ù…Ø§Ø±ÙƒØª Ø­Ù…Ø§ØµØ©',
            whatsapp: '201144191571',
            delivery_fee: 20,
            updated_at: new Date().toISOString()
        }
    ];

    const DEFAULT_CATEGORIES = [
        { id: 'all', name: 'Ø§Ù„ÙƒÙ„', icon: 'fa-border-all', display_order: 0 },
        { id: 'dairy', name: 'Ø£Ù„Ø¨Ø§Ù† ÙˆØ£Ø¬Ø¨Ø§Ù†', icon: 'fa-cow', display_order: 1 },
        { id: 'beverages', name: 'Ù…Ø´Ø±ÙˆØ¨Ø§Øª ÙˆØ¹ØµØ§Ø¦Ø±', icon: 'fa-bottle-droplet', display_order: 2 },
        { id: 'snacks', name: 'ØªØ³Ø§Ù„ÙŠ ÙˆØ´ÙŠØ¨Ø³ÙŠ', icon: 'fa-cookie-bite', display_order: 3 },
        { id: 'grains', name: 'Ø£Ø±Ø² ÙˆÙ…Ù‚Ø±Ù…Ø´Ø§Øª', icon: 'fa-bowl-rice', display_order: 4 },
        { id: 'cleaning', name: 'Ù…Ù†Ø¸ÙØ§Øª ÙˆØ¹Ù†Ø§ÙŠØ©', icon: 'fa-spray-can-sparkles', display_order: 5 },
        { id: 'fresh', name: 'Ø®Ø¶Ø§Ø± ÙˆÙÙˆØ§ÙƒÙ‡', icon: 'fa-apple-whole', display_order: 6 }
    ];

    const DEFAULT_PRODUCTS = [
        { id: 3, name: 'Ø¨ÙŠØ¨Ø³ÙŠ ÙƒØ§Ù†Ø² â€“ 355 Ù…Ù„', price: 15, description: 'Ù…Ø´Ø±ÙˆØ¨ ØºØ§Ø²ÙŠ', unit: 'Ø¹Ù„Ø¨Ø©', stock: 0, available: true, category: 'beverages', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 4, name: 'Ù†Ø³ØªÙ„Ø© Ù‚Ù‡ÙˆØ© Ù…Ø«Ù„Ø¬Ø© Ù†Ø³ÙƒØ§ÙÙŠÙ‡ Ù…ÙˆÙƒØ§ â€“ 220 Ù…Ù„', price: 45, description: 'Ù‚Ù‡ÙˆØ© Ù…Ø«Ù„Ø¬Ø©', unit: 'Ø¹Ù„Ø¨Ø©', stock: 0, available: true, category: 'beverages', image_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=500&q=80', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 5, name: 'ÙƒØ±Ø§Ù†Ø´ÙŠ Ø¨Ø·Ø¹Ù… Ø§Ù„ÙØ±Ø§Ø® â€“ 10 Ø¬', price: 10, description: 'Ù…Ù‚Ø±Ù…Ø´Ø§Øª', unit: 'ÙƒÙŠØ³', stock: 0, available: true, category: 'snacks', image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&q=80', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 10, name: 'Ø´ÙŠØ¨Ø³ÙŠ Ø¨Ø·Ø¹Ù… ÙƒØ¨Ø§Ø¨ Ø¹Ø§Ù„ÙØ­Ù… â€“ 15 Ø¬', price: 15, description: 'Ø´ÙŠØ¨Ø³ÙŠ', unit: 'ÙƒÙŠØ³', stock: 15, available: true, category: 'snacks', image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&q=80', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 11, name: 'Ø¬Ù‡ÙŠÙ†Ø© Ù…ÙƒØ³ Ø­Ù„ÙŠØ¨ Ø¨Ø§Ù„Ù…ÙˆØ² â€“ 200 Ù…Ù„', price: 12, description: 'Ù…Ø´Ø±ÙˆØ¨', unit: 'Ø¹Ù„Ø¨Ø©', stock: 0, available: true, category: 'beverages', image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=500&q=80', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    const DEFAULT_ADMIN_USERS = [
        { user_id: 'local-admin-user-id', email: 'admin@local', role: 'admin', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function ensureDefaultData() {
        const defaultData = {
            store_settings: clone(DEFAULT_STORE_SETTINGS),
            categories: clone(DEFAULT_CATEGORIES),
            products: clone(DEFAULT_PRODUCTS),
            orders: [],
            admin_users: clone(DEFAULT_ADMIN_USERS)
        };

        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
            return clone(defaultData);
        }

        try {
            const parsed = JSON.parse(stored);
            return {
                store_settings: Array.isArray(parsed.store_settings) ? parsed.store_settings : clone(DEFAULT_STORE_SETTINGS),
                categories: Array.isArray(parsed.categories) ? parsed.categories : clone(DEFAULT_CATEGORIES),
                products: Array.isArray(parsed.products) ? parsed.products : clone(DEFAULT_PRODUCTS),
                orders: Array.isArray(parsed.orders) ? parsed.orders : [],
                admin_users: Array.isArray(parsed.admin_users) ? parsed.admin_users : clone(DEFAULT_ADMIN_USERS)
            };
        } catch (error) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
            return clone(defaultData);
        }
    }

    function readLocalDb() {
        return ensureDefaultData();
    }

    function writeLocalDb(nextDb) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDb));
        return clone(nextDb);
    }

    function matchesFilters(row, filters) {
        return filters.every(({ field, value }) => {
            if (field === 'category' && value === 'all') return true;
            return row[field] === value;
        });
    }

    function runQuery(tableName, query) {
        const db = readLocalDb();
        let rows = clone(db[tableName] || []);

        if (query.filters.length) {
            rows = rows.filter((row) => matchesFilters(row, query.filters));
        }

        if (query.orderBy) {
            rows.sort((a, b) => {
                const av = a[query.orderBy.field];
                const bv = b[query.orderBy.field];
                const cmp = av === bv ? 0 : (av > bv ? 1 : -1);
                return query.orderBy.ascending ? cmp : -cmp;
            });
        }

        if (query.limitValue !== null) {
            rows = rows.slice(0, query.limitValue);
        }

        if (query.singleMode) {
            return { data: rows[0] || null, error: null };
        }

        return { data: rows, error: null };
    }

    function performMutation(tableName, action, config) {
        const db = readLocalDb();
        const rows = clone(db[tableName] || []);
        let result = null;

        if (action === 'insert') {
            const entry = Array.isArray(config.payload) ? config.payload : [config.payload];
            const insertRows = entry.map((row) => ({
                ...row,
                created_at: row.created_at || new Date().toISOString(),
                updated_at: row.updated_at || new Date().toISOString()
            }));
            rows.push(...insertRows);
            db[tableName] = rows;
            writeLocalDb(db);
            result = insertRows.length > 1 ? insertRows : insertRows[0];
            return { data: result, error: null };
        }

        if (action === 'update') {
            const filters = config.filters || [];
            const updated = rows.map((row) => {
                if (filters.every(({ field, value }) => row[field] === value)) {
                    return { ...row, ...config.values, updated_at: new Date().toISOString() };
                }
                return row;
            });
            db[tableName] = updated;
            writeLocalDb(db);
            result = updated.filter((row) => filters.every(({ field, value }) => row[field] === value));
            return { data: result, error: null };
        }

        if (action === 'delete') {
            const filters = config.filters || [];
            const remaining = rows.filter((row) => !filters.every(({ field, value }) => row[field] === value));
            db[tableName] = remaining;
            writeLocalDb(db);
            result = rows.filter((row) => filters.every(({ field, value }) => row[field] === value));
            return { data: result, error: null };
        }

        if (action === 'upsert') {
            const incoming = Array.isArray(config.payload) ? config.payload : [config.payload];
            const current = [...rows];
            incoming.forEach((newRow) => {
                const index = current.findIndex((row) => row.id === newRow.id);
                const entry = { ...newRow, created_at: newRow.created_at || new Date().toISOString(), updated_at: new Date().toISOString() };
                if (index >= 0) {
                    current[index] = { ...current[index], ...entry };
                } else {
                    current.push(entry);
                }
            });
            db[tableName] = current;
            writeLocalDb(db);
            result = incoming.length > 1 ? incoming : incoming[0];
            return { data: result, error: null };
        }

        return { data: null, error: null };
    }

    function createQueryBuilder(tableName) {
        const builder = {
            tableName,
            filters: [],
            orderBy: null,
            limitValue: null,
            singleMode: null,
            payload: null,
            values: null,
            action: 'select',
            selectFields: '*',
            execute() {
                if (this.action === 'insert') {
                    return performMutation(this.tableName, this.action, { payload: this.payload });
                }

                if (this.action === 'update') {
                    return performMutation(this.tableName, this.action, { filters: this.filters, values: this.values });
                }

                if (this.action === 'delete') {
                    return performMutation(this.tableName, this.action, { filters: this.filters });
                }

                if (this.action === 'upsert') {
                    return performMutation(this.tableName, this.action, { payload: this.payload });
                }

                return runQuery(this.tableName, this);
            },
            select(fields) {
                this.selectFields = fields;
                this.action = 'select';
                return this;
            },
            eq(field, value) {
                this.filters.push({ field, value });
                return this;
            },
            order(field, options = {}) {
                this.orderBy = { field, ascending: options.ascending !== false };
                return this;
            },
            limit(value) {
                this.limitValue = Number(value);
                return this;
            },
            maybeSingle() {
                this.singleMode = 'maybe';
                return this;
            },
            single() {
                this.singleMode = 'single';
                return this;
            },
            insert(payload) {
                this.action = 'insert';
                this.payload = payload;
                return this;
            },
            update(values) {
                this.action = 'update';
                this.values = values;
                return this;
            },
            delete() {
                this.action = 'delete';
                return this;
            },
            upsert(payload, options) {
                this.action = 'upsert';
                this.payload = payload;
                this.options = options || {};
                return this;
            },
            then(resolve, reject) {
                return Promise.resolve(this.execute()).then(resolve, reject);
            }
        };

        return builder;
    }

    function buildLocalAuth() {
        const LOCAL_ADMIN_EMAIL = 'admin@local';
        const LOCAL_ADMIN_PASSWORD = 'admin123';
        const LOCAL_ADMIN_USER_ID = 'local-admin-user-id';

        return {
            async getSession() {
                const raw = localStorage.getItem('al_saada_local_session');
                if (!raw) {
                    return { data: { session: null }, error: null };
                }

                try {
                    const session = JSON.parse(raw);
                    return {
                        data: {
                            session: {
                                user: { id: session.user_id, email: session.email },
                                access_token: 'local-token'
                            }
                        },
                        error: null
                    };
                } catch (error) {
                    return { data: { session: null }, error: null };
                }
            },
            async signInWithPassword({ email, password }) {
                if (email === LOCAL_ADMIN_EMAIL && password === LOCAL_ADMIN_PASSWORD) {
                    const session = { user_id: LOCAL_ADMIN_USER_ID, email };
                    localStorage.setItem('al_saada_local_session', JSON.stringify(session));
                    return {
                        data: { user: { id: LOCAL_ADMIN_USER_ID, email } },
                        error: null
                    };
                }
                return {
                    data: { user: null },
                    error: { message: 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø£Ùˆ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­Ø©' }
                };
            },
            async signOut() {
                localStorage.removeItem('al_saada_local_session');
                return { error: null };
            }
        };
    }

    function generateOrderCode() {
        return `LOCAL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }

    class LocalOrderService {
        constructor() {
            this.key = STORAGE_KEY;
        }

        readDb() {
            return readLocalDb();
        }

        writeDb(db) {
            return writeLocalDb(db);
        }

        createOrder({
            customer_name,
            phone,
            address,
            items,
            payment_method = 'cash',
            notes = ''
        }) {
            const db = this.readDb();
            const normalizedItems = Array.isArray(items) ? items.map((item) => ({
                product_id: Number(item.product_id),
                product_name: item.product_name || 'Ù…Ù†ØªØ¬',
                quantity: Number(item.quantity || 0),
                unit_price: Number(item.unit_price || 0),
                line_total: Number(item.line_total || 0)
            })) : [];

            const subtotal = normalizedItems.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
            const deliveryFee = Number((db.store_settings && db.store_settings[0] && db.store_settings[0].delivery_fee) || 0);
            const total = subtotal + deliveryFee;
            const now = new Date().toISOString();

            const order = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                order_code: generateOrderCode(),
                customer_name: String(customer_name || '').trim(),
                phone: String(phone || '').trim(),
                address: String(address || '').trim(),
                items: normalizedItems,
                subtotal,
                delivery_fee: deliveryFee,
                total,
                payment_method: payment_method || 'cash',
                notes: String(notes || '').trim(),
                status: 'new',
                created_at: now,
                updated_at: now
            };

            db.orders = [order, ...(db.orders || [])];
            this.writeDb(db);
            return order;
        }

        getOrders() {
            const db = this.readDb();
            return (db.orders || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        getOrderById(id) {
            return this.getOrders().find((order) => String(order.id) === String(id)) || null;
        }

        updateOrderStatus(id, status) {
            const valid = ORDER_STATUS_OPTIONS.includes(status);
            if (!valid) return null;

            const db = this.readDb();
            const target = (db.orders || []).find((order) => String(order.id) === String(id));
            if (!target) return null;

            if (!isValidStatusTransition(target.status, status)) {
                return null;
            }

            target.status = status;
            target.updated_at = new Date().toISOString();
            this.writeDb(db);
            return target;
        }

        deleteOrder(id) {
            const db = this.readDb();
            const filtered = (db.orders || []).filter((order) => String(order.id) !== String(id));
            db.orders = filtered;
            this.writeDb(db);
            return filtered;
        }

        clearOrders() {
            const db = this.readDb();
            db.orders = [];
            this.writeDb(db);
            return [];
        }
    }

    function buildLocalRpc() {
        return async function rpc(functionName, params = {}) {
            if (functionName === 'is_admin_user') {
                return { data: true, error: null };
            }

            if (functionName === 'create_order') {
                const order = window.LocalOrderService.createOrder({
                    customer_name: params.p_customer_name,
                    phone: params.p_phone,
                    address: params.p_address,
                    items: Array.isArray(params.p_items) ? params.p_items : JSON.parse(params.p_items || '[]'),
                    payment_method: params.p_payment_method || 'cash',
                    notes: params.p_notes || ''
                });
                return { data: [order], error: null };
            }

            if (functionName === 'confirm_order') {
                const updated = window.LocalOrderService.updateOrderStatus(params.p_order_id, 'confirmed');
                return { data: updated ? { id: updated.id, status: updated.status } : null, error: null };
            }

            return { data: null, error: { message: 'RPC not implemented locally' } };
        };
    }

    window.LocalOrderService = new LocalOrderService();

    window.localDataFacade = {
        auth: buildLocalAuth(),
        rpc: buildLocalRpc(),
        from(tableName) {
            return createQueryBuilder(tableName);
        }
    };

    window.localMarketDb = {
        read: readLocalDb,
        write: writeLocalDb,
        reset: function () {
            localStorage.removeItem(STORAGE_KEY);
            readLocalDb();
        }
    };

    if (!localStorage.getItem(STORAGE_KEY)) {
        writeLocalDb(readLocalDb());
    }
})();

