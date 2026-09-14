# سوبر ماركت حماصة

تطبيق Static يعمل على Cloudflare Pages، ومصدر البيانات الوحيد فيه هو Supabase.

## النشر

1. نفّذ [schema.sql](schema.sql) في Supabase SQL Editor.
2. أنشئ حساب الإدارة في Supabase Auth باستخدام Email/Password.
3. أضف صف المستخدم إلى `admin_users` مع `role = 'admin'` و`is_active = true`.
4. ارفع جذر المستودع إلى Cloudflare Pages.

إعدادات Cloudflare Pages:

- Framework preset: `None`
- Build command: لا يوجد
- Output directory: `/`

لا يحتاج المشروع إلى Node.js أو Backend أو أي ملف إعداد محلي. مفتاح Supabase الموجود في [supabase.js](supabase.js) هو Public/Publishable key فقط.

## Architecture

- `index.html`: الكتالوج والسلة وإنشاء الطلب عبر `create_order`.
- `admin.html`: Supabase Auth وإدارة المنتجات والأقسام والإعدادات.
- `orders.html`: الطلبات والفلترة والتفاصيل والطباعة وتغيير الحالة.
- `track-order.html`: تتبع آمن باستخدام رقم الطلب ورقم الهاتف.
- `schema.sql`: الجداول وRLS وRPC والتحقق من انتقالات الحالة.
- `supabase.js`: عميل Supabase وواجهات التطبيق.

## الأمان

- لا توجد قاعدة بيانات أو بيانات تشغيلية داخل المتصفح.
- لا توجد Service Role أو Secret keys في الواجهة.
- قراءة الطلبات محمية بـ RLS للإدارة فقط.
- إنشاء الطلب والتسعير يتمان داخل PostgreSQL في معاملة RPC.
- تتبع الطلب لا يعرض بيانات بدون مطابقة رقم الطلب ورقم الهاتف.
