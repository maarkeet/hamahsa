# سوبر ماركت حماصة

واجهة متجر عربية تعمل مع Supabase: المنتجات والأقسام والطلبات والإعدادات محفوظة أونلاين، ولوحة الإدارة ترى نفس البيانات من أي جهاز.

## التشغيل المحلي

1. نفّذ محتوى `schema.sql` في Supabase SQL Editor للمشروع:
   `https://hkpwuzlcargeokhnqrbo.supabase.co`
2. أنشئ مستخدم الإدارة من Supabase Auth باستخدام Email/Password.
3. أضف صفًا في `admin_users` بنفس `auth.users.id` مع `role = 'admin'` و`is_active = true`.
4. انسخ `supabase.local.example.js` إلى `supabase.local.js` وضع فيه Public/Anon/Publishable Key فقط.
5. شغّل الموقع عبر Live Server أو أي خادم ملفات محلي. لا تفتحه مباشرة بـ `file://` إذا منع المتصفح طلبات الشبكة.

`supabase.local.js` موجود في `.gitignore`. لا تضع Service Role Key أو كلمة مرور قاعدة البيانات في هذا الملف أو في الواجهة.

## الملفات المهمة

- `supabase.js`: عميل Supabase وواجهات الكتالوج والطلبات والتتبع.
- `schema.sql`: الجداول، RLS، RPC، والتحقق من انتقالات الحالة.
- `index.html`: الكتالوج والسلة والـ checkout.
- `admin.html`: Auth والمنتجات والأقسام والإعدادات.
- `orders.html`: البحث والفلترة والتفاصيل والطباعة وتحديث الحالات.
- `track-order.html`: التتبع باستخدام رقم الطلب ورقم الهاتف مع تحديث كل 10 ثوان.
- `local-data.js`: كود محلي قديم غير محمّل في صفحات الإنتاج، وموجود فقط للرجوع أو الترحيل اليدوي.

## التدفق والأمان

- العميل يقرأ المنتجات والأقسام فقط.
- إنشاء الطلب يتم عبر `create_order` داخل PostgreSQL؛ يعيد قراءة الأسعار الحالية، يحسب الإجماليات، ويحفظ `product_name` و`unit_price` في `order_items` داخل نفس المعاملة.
- التتبع يمر عبر `track_order(order_code, phone)`، فلا يكفي معرفة رقم الطلب وحده.
- الإدارة تدخل عبر Supabase Auth، ثم تُراجع عضويتها في `admin_users`.
- قراءة الطلبات وتعديل المنتجات والأقسام متاحة للإدارة فقط عبر RLS.
- `update_order_status` يفرض انتقالات الحالة داخل قاعدة البيانات، بما في ذلك منع الرجوع ومنع تغيير الحالات النهائية.
- لا يوجد تكامل WhatsApp أو `wa.me` في مسار الطلب.

## الحالات

`new -> confirmed/cancelled -> preparing -> ready -> out_for_delivery -> delivered`

`delivered` و`cancelled` نهائيتان.

## QA المحلي

تم تنفيذ فحص syntax على كل كتل JavaScript داخل صفحات HTML، وعلى `supabase.js` و`local-data.js`. اختبار الشبكة الفعلي يحتاج تنفيذ `schema.sql` ووضع المفتاح العام في `supabase.local.js`، ثم تجربة checkout وAuth والتتبع من متصفحين أو جهازين.

## GitHub Pages

لأن GitHub Pages لا يحقن `.env` في HTML ثابت، يجب توفير `supabase.local.js` أثناء النشر من Secret/Build Step خاص بالاستضافة، أو نقل المفتاح العام إلى إعداد build. المفتاح العام وحده مسموح في المتصفح، لكن Service Role Key ممنوع تمامًا.
